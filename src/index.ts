import { createProperty, getProperty } from "./routes/property";
import type { Env } from "../types/env";

const notFound = () =>
  Response.json({ error: "not_found" }, { status: 404 });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, service: "daedalus-platform" });
    }

    if (request.method === "POST" && url.pathname === "/property") {
      return createProperty(request, env);
    }

    const propertyMatch = url.pathname.match(/^\/property\/([^/]+)$/);
    if (request.method === "GET" && propertyMatch) {
      return getProperty(propertyMatch[1], env);
    }

    return notFound();
  }
};

