import {
  getImport,
  getPropertyImports,
  importCapturePackage
} from "./routes/capturePackageImport";
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

    if (request.method === "POST" && url.pathname === "/import/capture-package") {
      return importCapturePackage(request, env);
    }

    const importMatch = url.pathname.match(/^\/import\/([^/]+)$/);
    if (request.method === "GET" && importMatch) {
      return getImport(decodeURIComponent(importMatch[1]), env);
    }

    const propertyImportsMatch = url.pathname.match(
      /^\/property\/([^/]+)\/imports$/
    );
    if (request.method === "GET" && propertyImportsMatch) {
      return getPropertyImports(decodeURIComponent(propertyImportsMatch[1]), env);
    }

    const propertyMatch = url.pathname.match(/^\/property\/([^/]+)$/);
    if (request.method === "GET" && propertyMatch) {
      return getProperty(decodeURIComponent(propertyMatch[1]), env);
    }

    return notFound();
  }
};

