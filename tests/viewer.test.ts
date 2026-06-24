import { describe, expect, it } from "vitest";
import worker from "../src/index";
import type { Env } from "../types/env";

type StoredProperty = {
  property_id: string;
  property_name: string;
  created_at: string;
};

type StoredWorkingTwin = {
  working_twin_id: string;
  property_id: string;
  property_ref: string;
  source: string;
  metadata_json: string;
  created_at: string;
};

type StoredCaptureSession = {
  capture_session_id: string;
  property_id: string;
  working_twin_id: string;
  metadata_json: string;
  created_at: string;
};

type StoredImport = {
  import_id: string;
  package_id: string;
  package_version: number;
  property_id: string;
  working_twin_id: string;
  capture_session_id: string;
  evidence_count: number;
  area_count: number;
  component_count: number;
  package_object_key: string;
  status: "imported";
  imported_at: string;
};

type StoredEvidence = {
  import_id: string;
  evidence_ref: string;
  property_id: string;
  working_twin_id: string;
  capture_session_id: string | null;
  media_ref: string;
  media_type: string;
  content_type: string | null;
  content_hash: string | null;
  metadata_json: string;
  created_at: string;
};

type StoredArea = {
  import_id: string;
  area_ref: string;
  property_id: string;
  working_twin_id: string;
  name: string | null;
  metadata_json: string;
  created_at: string;
};

type StoredComponent = {
  import_id: string;
  component_ref: string;
  property_id: string;
  working_twin_id: string;
  area_ref: string | null;
  component_type: string;
  metadata_json: string;
  created_at: string;
};

type ImportResponse = {
  import: {
    importId: string;
    propertyId: string;
    workingTwinId: string;
    captureSessionId: string;
    evidenceCount: number;
    areaCount: number;
    componentCount: number;
    packageObjectKey: string;
    status: "imported";
  };
};

class ViewerStore {
  properties = new Map<string, StoredProperty>();
  workingTwins = new Map<string, StoredWorkingTwin>();
  captureSessions = new Map<string, StoredCaptureSession>();
  imports = new Map<string, StoredImport>();
  evidenceItems: StoredEvidence[] = [];
  areas: StoredArea[] = [];
  components: StoredComponent[] = [];
  r2Objects = new Map<string, string>();
}

class ViewerStatement {
  private params: unknown[] = [];

  constructor(
    private readonly sql: string,
    private readonly store: ViewerStore
  ) {}

  bind(...params: unknown[]) {
    this.params = params;
    return this;
  }

  async run() {
    if (this.sql.includes("INSERT INTO properties")) {
      const [propertyId, propertyName, createdAt] = this.params;
      const existing = this.store.properties.get(String(propertyId));
      this.store.properties.set(String(propertyId), {
        property_id: String(propertyId),
        property_name: String(propertyName),
        created_at: existing?.created_at ?? String(createdAt)
      });
      return { success: true };
    }

    if (this.sql.includes("INSERT INTO working_twins")) {
      const [
        workingTwinId,
        propertyId,
        propertyRef,
        source,
        metadataJson,
        createdAt
      ] = this.params;
      this.store.workingTwins.set(String(workingTwinId), {
        working_twin_id: String(workingTwinId),
        property_id: String(propertyId),
        property_ref: String(propertyRef),
        source: String(source),
        metadata_json: String(metadataJson),
        created_at: String(createdAt)
      });
      return { success: true };
    }

    if (this.sql.includes("INSERT INTO capture_sessions")) {
      const [
        captureSessionId,
        propertyId,
        workingTwinId,
        metadataJson,
        createdAt
      ] = this.params;
      this.store.captureSessions.set(String(captureSessionId), {
        capture_session_id: String(captureSessionId),
        property_id: String(propertyId),
        working_twin_id: String(workingTwinId),
        metadata_json: String(metadataJson),
        created_at: String(createdAt)
      });
      return { success: true };
    }

    if (this.sql.includes("INSERT INTO imported_packages")) {
      const [
        importId,
        packageId,
        packageVersion,
        propertyId,
        workingTwinId,
        captureSessionId,
        evidenceCount,
        areaCount,
        componentCount,
        packageObjectKey,
        status,
        importedAt
      ] = this.params;
      this.store.imports.set(String(importId), {
        import_id: String(importId),
        package_id: String(packageId),
        package_version: Number(packageVersion),
        property_id: String(propertyId),
        working_twin_id: String(workingTwinId),
        capture_session_id: String(captureSessionId),
        evidence_count: Number(evidenceCount),
        area_count: Number(areaCount),
        component_count: Number(componentCount),
        package_object_key: String(packageObjectKey),
        status: status as "imported",
        imported_at: String(importedAt)
      });
      return { success: true };
    }

    if (this.sql.includes("INSERT INTO evidence_items")) {
      const [
        importId,
        evidenceRef,
        propertyId,
        workingTwinId,
        captureSessionId,
        mediaRef,
        mediaType,
        contentType,
        contentHash,
        metadataJson,
        createdAt
      ] = this.params;
      this.store.evidenceItems.push({
        import_id: String(importId),
        evidence_ref: String(evidenceRef),
        property_id: String(propertyId),
        working_twin_id: String(workingTwinId),
        capture_session_id:
          captureSessionId === null ? null : String(captureSessionId),
        media_ref: String(mediaRef),
        media_type: String(mediaType),
        content_type: contentType === null ? null : String(contentType),
        content_hash: contentHash === null ? null : String(contentHash),
        metadata_json: String(metadataJson),
        created_at: String(createdAt)
      });
      return { success: true };
    }

    if (this.sql.includes("INSERT INTO areas")) {
      const [
        importId,
        areaRef,
        propertyId,
        workingTwinId,
        name,
        metadataJson,
        createdAt
      ] = this.params;
      this.store.areas.push({
        import_id: String(importId),
        area_ref: String(areaRef),
        property_id: String(propertyId),
        working_twin_id: String(workingTwinId),
        name: name === null ? null : String(name),
        metadata_json: String(metadataJson),
        created_at: String(createdAt)
      });
      return { success: true };
    }

    if (this.sql.includes("INSERT INTO components")) {
      const [
        importId,
        componentRef,
        propertyId,
        workingTwinId,
        areaRef,
        componentType,
        metadataJson,
        createdAt
      ] = this.params;
      this.store.components.push({
        import_id: String(importId),
        component_ref: String(componentRef),
        property_id: String(propertyId),
        working_twin_id: String(workingTwinId),
        area_ref: areaRef === null ? null : String(areaRef),
        component_type: String(componentType),
        metadata_json: String(metadataJson),
        created_at: String(createdAt)
      });
      return { success: true };
    }

    throw new Error(`Unexpected run SQL: ${this.sql}`);
  }

  async first<T>() {
    const id = String(this.params[0]);

    if (
      this.sql.includes("COUNT(import_id) AS count") &&
      this.sql.includes("FROM imported_packages")
    ) {
      const imports = [...this.store.imports.values()].filter(
        (row) => row.property_id === id
      );

      return {
        count: imports.length,
        last_imported_at:
          imports.map((row) => row.imported_at).sort().at(-1) ?? null
      } as T;
    }

    if (this.sql.includes("FROM imported_packages")) {
      return (this.store.imports.get(id) ?? null) as T | null;
    }

    if (this.sql.includes("FROM properties")) {
      return (this.store.properties.get(id) ?? null) as T | null;
    }

    throw new Error(`Unexpected first SQL: ${this.sql}`);
  }

  async all<T>() {
    const id = String(this.params[0] ?? "");

    if (this.sql.includes("FROM properties") && !this.sql.includes("WHERE")) {
      return {
        results: [...this.store.properties.values()] as T[],
        success: true
      };
    }

    if (this.sql.includes("FROM imported_packages")) {
      return {
        results: [...this.store.imports.values()].filter(
          (row) => row.property_id === id
        ) as T[],
        success: true
      };
    }

    if (this.sql.includes("FROM working_twins")) {
      return {
        results: [...this.store.workingTwins.values()].filter(
          (row) => row.property_id === id
        ) as T[],
        success: true
      };
    }

    if (this.sql.includes("FROM capture_sessions")) {
      return {
        results: [...this.store.captureSessions.values()].filter(
          (row) => row.property_id === id
        ) as T[],
        success: true
      };
    }

    if (this.sql.includes("FROM areas")) {
      return {
        results: this.store.areas.filter((row) => row.property_id === id) as T[],
        success: true
      };
    }

    if (this.sql.includes("FROM components")) {
      return {
        results: this.store.components.filter(
          (row) => row.property_id === id
        ) as T[],
        success: true
      };
    }

    if (this.sql.includes("FROM evidence_items")) {
      return {
        results: this.store.evidenceItems.filter(
          (row) => row.property_id === id
        ) as T[],
        success: true
      };
    }

    throw new Error(`Unexpected all SQL: ${this.sql}`);
  }
}

function createEnv(store = new ViewerStore()): Env & { store: ViewerStore } {
  return {
    store,
    DB: {
      prepare(sql: string) {
        return new ViewerStatement(sql, store);
      }
    } as unknown as D1Database,
    EVIDENCE: {
      async put(key: string, value: string) {
        store.r2Objects.set(key, value);
        return null;
      },
      async get(key: string) {
        const value = store.r2Objects.get(key);
        if (!value) {
          return null;
        }

        return {
          async text() {
            return value;
          }
        };
      }
    } as unknown as R2Bucket
  };
}

function validPackage() {
  return {
    packageVersion: 4,
    packageId: "capture-package-001",
    exportedAt: "2026-06-24T09:00:00.000Z",
    propertyIdentity: {
      property_id: "property:uprn-100010001",
      property_ref: "uprn-100010001"
    },
    workingTwin: {
      property_id: "property:uprn-100010001",
      property_ref: "uprn-100010001",
      twin_ref: "working-twin:uprn-100010001:session-001",
      source: "survey_capture"
    },
    surveyCaptureSession: {
      property_id: "property:uprn-100010001",
      property_ref: "uprn-100010001",
      session_ref: "capture-session-001",
      working_twin_ref: "working-twin:uprn-100010001:session-001",
      review_status: "needs_review"
    },
    evidence: [
      {
        property_id: "property:uprn-100010001",
        property_ref: "uprn-100010001",
        evidence_ref: "evidence-boiler-photo",
        twin_ref: "working-twin:uprn-100010001:session-001",
        session_ref: "capture-session-001",
        media_ref: "r2://capture-media/boiler-photo.jpg",
        media_type: "photo",
        content_type: "image/jpeg",
        content_hash: "sha256:example",
        review_status: "reviewed"
      },
      {
        property_id: "property:uprn-100010001",
        property_ref: "uprn-100010001",
        evidence_ref: "evidence-unlinked-note",
        twin_ref: "working-twin:uprn-100010001:session-001",
        media_ref: "r2://capture-media/unlinked-note.txt",
        media_type: "text",
        review_status: "needs_review"
      }
    ],
    areas: [
      {
        property_id: "property:uprn-100010001",
        property_ref: "uprn-100010001",
        area_ref: "area-kitchen",
        twin_ref: "working-twin:uprn-100010001:session-001",
        name: "Kitchen",
        data: { reviewStatus: "reviewed" }
      }
    ],
    components: [
      {
        property_id: "property:uprn-100010001",
        property_ref: "uprn-100010001",
        object_ref: "component-boiler",
        twin_ref: "working-twin:uprn-100010001:session-001",
        component_type: "boiler",
        area_ref: "area-kitchen",
        evidence_refs: ["evidence-boiler-photo"],
        data: { reviewStatus: "reviewed" }
      },
      {
        property_id: "property:uprn-100010001",
        property_ref: "uprn-100010001",
        object_ref: "component-flue",
        twin_ref: "working-twin:uprn-100010001:session-001",
        component_type: "flue",
        evidence_refs: [],
        data: { reviewStatus: "needs_review" }
      }
    ]
  };
}

async function importValidPackage(env: Env) {
  const response = await worker.fetch(
    new Request("https://platform.test/import/capture-package", {
      method: "POST",
      body: JSON.stringify(validPackage())
    }),
    env
  );

  return {
    response,
    body: (await response.json()) as ImportResponse
  };
}

describe("property dashboard routes", () => {
  it("shows imported properties, dashboard details, and import view", async () => {
    const env = createEnv();
    const imported = await importValidPackage(env);

    expect(imported.response.status).toBe(201);

    const homeResponse = await worker.fetch(new Request("https://platform.test/"), env);
    const homeHtml = await homeResponse.text();

    expect(homeResponse.status).toBe(200);
    expect(homeHtml).toContain("Properties");
    expect(homeHtml).toContain("uprn-100010001");

    const propertiesResponse = await worker.fetch(
      new Request("https://platform.test/properties"),
      env
    );
    const propertiesHtml = await propertiesResponse.text();

    expect(propertiesResponse.status).toBe(200);
    expect(propertiesHtml).toContain("uprn-100010001");

    const propertyJsonResponse = await worker.fetch(
      new Request("https://platform.test/property/property%3Auprn-100010001"),
      env
    );
    const propertyJson = (await propertyJsonResponse.json()) as {
      property: { propertyId: string };
    };

    expect(propertyJsonResponse.status).toBe(200);
    expect(propertyJson.property.propertyId).toBe("property:uprn-100010001");

    const propertyResponse = await worker.fetch(
      new Request("https://platform.test/property/property%3Auprn-100010001", {
        headers: { accept: "text/html" }
      }),
      env
    );
    const propertyHtml = await propertyResponse.text();

    expect(propertyResponse.status).toBe(200);
    expect(propertyHtml).toContain("Property Summary");
    expect(propertyHtml).toContain("Working Twin Summary");
    expect(propertyHtml).toContain("Kitchen");
    expect(propertyHtml).toContain("component-boiler");
    expect(propertyHtml).toContain("component-flue");
    expect(propertyHtml).toContain("Evidence");
    expect(propertyHtml).toContain("Survey History");
    expect(propertyHtml).toContain("Needs Review");
    expect(propertyHtml).toContain("needs_review");
    expect(propertyHtml).toContain("This dashboard reflects captured Property Twin data.");
    expect(propertyHtml).toContain("does not provide recommendations");

    const importJsonResponse = await worker.fetch(
      new Request(
        `https://platform.test/import/${encodeURIComponent(
          imported.body.import.importId
        )}`
      ),
      env
    );

    expect(importJsonResponse.status).toBe(200);
    expect((await importJsonResponse.json()) as ImportResponse).toMatchObject({
      import: imported.body.import
    });

    const importHtmlResponse = await worker.fetch(
      new Request(
        `https://platform.test/import/${encodeURIComponent(
          imported.body.import.importId
        )}`,
        { headers: { accept: "text/html" } }
      ),
      env
    );
    const importHtml = await importHtmlResponse.text();

    expect(importHtmlResponse.status).toBe(200);
    expect(importHtml).toContain("Stored Package");
    expect(importHtml).toContain(imported.body.import.packageObjectKey);
    expect(importHtml).toContain("Import Counts");
  });

  it("renders an empty property dashboard without changing JSON API behaviour", async () => {
    const env = createEnv();

    const createResponse = await worker.fetch(
      new Request("https://platform.test/property", {
        method: "POST",
        body: JSON.stringify({
          propertyId: "empty-property",
          propertyName: "Empty Property"
        })
      }),
      env
    );

    expect(createResponse.status).toBe(201);

    const propertyResponse = await worker.fetch(
      new Request("https://platform.test/property/empty-property", {
        headers: { accept: "text/html" }
      }),
      env
    );
    const html = await propertyResponse.text();

    expect(propertyResponse.status).toBe(200);
    expect(html).toContain("Empty Property");
    expect(html).toContain("Working Twin Summary");
    expect(html).toContain("Not yet captured");
    expect(html).toContain("No areas imported yet.");
    expect(html).toContain("No components or objects imported yet.");
    expect(html).toContain("No evidence imported yet.");
    expect(html).toContain("No capture sessions imported yet.");

    const jsonResponse = await worker.fetch(
      new Request("https://platform.test/property/empty-property"),
      env
    );
    const body = (await jsonResponse.json()) as {
      property: { propertyName: string };
    };

    expect(jsonResponse.status).toBe(200);
    expect(body.property.propertyName).toBe("Empty Property");
  });
});
