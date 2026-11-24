// The hosted workspace uses the existing university demo API. The repository
// also includes an independent Express/SQLite server for self-hosting.
const UPSTREAM = "https://ntunhs-course-system-web.onrender.com";
const API_ROUTE =
  /^\/api\/(health|auth\/(login|register|me|completed-courses\/toggle)|courses(?:\/meta|\/import|\/\d+)?|schedule(?:\/share|\/shared\/[a-f0-9]+|\/\d+)?)$/;
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};
export function createHandler(assets) {
  return {
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        if (!API_ROUTE.test(url.pathname))
          return Response.json({ error: "Unknown API route" }, { status: 404 });
        if (!["GET", "POST", "PUT", "DELETE"].includes(request.method))
          return new Response(null, { status: 405 });
        if (
          request.method !== "GET" &&
          request.headers.get("origin") &&
          request.headers.get("origin") !== url.origin
        )
          return Response.json(
            { error: "Cross-origin request refused" },
            { status: 403 },
          );
        const headers = new Headers({ Accept: "application/json" });
        if (request.headers.has("content-type"))
          headers.set("Content-Type", request.headers.get("content-type"));
        if (request.headers.has("authorization"))
          headers.set("Authorization", request.headers.get("authorization"));
        try {
          const response = await fetch(UPSTREAM + url.pathname + url.search, {
            method: request.method,
            headers,
            body: request.method === "GET" ? undefined : request.body,
            redirect: "manual",
          });
          if (response.status >= 300 && response.status < 400)
            return Response.json(
              { error: "Unexpected upstream redirect" },
              { status: 502 },
            );
          const outHeaders = new Headers(SECURITY_HEADERS);
          outHeaders.set(
            "Content-Type",
            response.headers.get("content-type") || "application/json",
          );
          outHeaders.set("Cache-Control", "no-store");
          return new Response(response.body, {
            status: response.status,
            headers: outHeaders,
          });
        } catch {
          return Response.json(
            {
              error:
                "原系統暫時無法連線，請稍後重試。 / Course service is temporarily unavailable.",
            },
            {
              status: 502,
              headers: { ...SECURITY_HEADERS, "Cache-Control": "no-store" },
            },
          );
        }
      }
      if (!["GET", "HEAD"].includes(request.method))
        return new Response(null, { status: 405 });
      const path = url.pathname === "/" ? "/index.html" : url.pathname;
      const asset = assets[path];
      if (!asset) return new Response("Not found", { status: 404 });
      return new Response(request.method === "HEAD" ? null : asset.content, {
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": asset.type,
          "Cache-Control":
            path === "/index.html"
              ? "no-cache"
              : "public, max-age=31536000, immutable",
        },
      });
    },
  };
}
