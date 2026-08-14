/*
 * ContentFragmentVariationsServlet
 *
 * AEM Sling servlet that backs the Universal Editor "Fragment Variation"
 * dropdown on the content-fragment block. Runs inside AEM Author, so it uses
 * the author's own session (no external token, same-origin — no CORS).
 *
 * Contract (matches blocks/content-fragment/_content-fragment.json optionsSource):
 *   GET /tools/content-fragment/variations.json?fragment=<cfPath>
 *   ->  [ { "name": "master", "title": "Master" },
 *         { "name": "broker", "title": "Broker" },
 *         { "name": "doctor", "title": "Doctor" } ]
 *
 * It lists the child nodes of <cfPath>/jcr:content/data — each child node is a
 * Content Fragment variation. "master" is returned first; the rest alphabetically.
 *
 * ⚠️ SCAFFOLD: verify the registration path and your project's servlet
 * conventions. Drop this into your AEM ui.apps/core bundle (adjust the package
 * to your project, e.g. com.covista.core.servlets) and build/deploy the bundle.
 * If the UE data-source property name differs in your build, see
 * tools/content-fragment/README.md.
 */
package com.covista.core.servlets;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.osgi.service.component.annotations.Component;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

@Component(
    service = Servlet.class,
    property = {
        "sling.servlet.methods=" + HttpConstants.METHOD_GET,
        // Fixed path registration -> served at /tools/content-fragment/variations.json
        "sling.servlet.paths=/tools/content-fragment/variations"
    }
)
public class ContentFragmentVariationsServlet extends SlingSafeMethodsServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(final SlingHttpServletRequest request,
                         final SlingHttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        final JsonArray out = new JsonArray();
        String fragment = request.getParameter("fragment");

        List<String> names = new ArrayList<>();
        if (fragment != null && !fragment.isEmpty()) {
            // Normalise: strip .html suffix and trailing slash.
            fragment = fragment.replaceAll("\\.html?$", "").replaceAll("/$", "");
            final ResourceResolver resolver = request.getResourceResolver();
            final Resource dataNode = resolver.getResource(fragment + "/jcr:content/data");
            if (dataNode != null) {
                final Iterator<Resource> children = dataNode.listChildren();
                while (children.hasNext()) {
                    final String childName = children.next().getName();
                    if (childName != null && !childName.startsWith("jcr:")
                            && !childName.startsWith("cq:")) {
                        names.add(childName);
                    }
                }
            }
        }

        // Fallback so the dropdown is never empty if resolution fails.
        if (names.isEmpty()) {
            Collections.addAll(names, "master", "broker", "doctor");
        }

        // master first, then the rest alphabetically.
        List<String> ordered = new ArrayList<>();
        if (names.remove("master")) {
            ordered.add("master");
        }
        Collections.sort(names);
        ordered.addAll(names);

        for (final String name : ordered) {
            final JsonObject option = new JsonObject();
            option.addProperty("name", name);
            option.addProperty("title", toTitleCase(name));
            out.add(option);
        }

        response.getWriter().write(out.toString());
    }

    /** "broker" -> "Broker", "care_team" -> "Care Team". */
    private static String toTitleCase(final String value) {
        final String[] parts = value.split("[-_]");
        final StringBuilder sb = new StringBuilder();
        for (final String part : parts) {
            if (part.isEmpty()) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(Character.toUpperCase(part.charAt(0)));
            if (part.length() > 1) {
                sb.append(part.substring(1));
            }
        }
        return sb.length() > 0 ? sb.toString() : value;
    }
}
