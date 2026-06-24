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

class TestStore {
  properties = new Map<string, StoredProperty>();
  workingTwins = new Map<string, StoredWorkingTwin>();
  captureSessions = new Map<string, StoredCaptureSession>();
  imports = new Map<string, StoredImport>();
  evidenceItems: StoredEvidence[] = [];
  areas: StoredArea[] = [];
  components: StoredComponent[] = [];
  r2Objects = new Map<string, string>();
}

class TestStatement {
  private params: unknown[] = [];

  constructor(
    private readonly sql: string,
    private readonly store: TestStore
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
    if (this.sql.includes("FROM imported_packages")) {
      return (this.store.imports.get(String(this.params[0])) ?? null) as
        | T
        | null;
    }

    if (this.sql.includes("FROM properties")) {
      return (this.store.properties.get(String(this.params[0])) ?? null) as
        | T
        | null;
    }

    throw new Error(`Unexpected first SQL: ${this.sql}`);
  }

  async all<T>() {
    if (!this.sql.includes("FROM imported_packages")) {
      throw new Error(`Unexpected all SQL: ${this.sql}`);
    }

    const propertyId = String(this.params[0]);
    return {
      results: Array.from(this.store.imports.values()).filter(
        (row) => row.property_id === propertyId
      ) as T[],
      success: true
    };
  }
}

function createEnv(store = new TestStore()): Env & { store: TestStore } {
  return {
    store,
    DB: {
      prepare(sql: string) {
        return new TestStatement(sql, store);
      }
    } as unknown as D1Database,
    EVIDENCE: {
      async put(key: string, value: string) {
        store.r2Objects.set(key, value);
        return null;
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
      working_twin_ref: "working-twin:uprn-100010001:session-001"
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
        binary_payload: "not-for-d1"
      }
    ],
    areas: [
      {
        property_id: "property:uprn-100010001",
        property_ref: "uprn-100010001",
        area_ref: "area-kitchen",
        twin_ref: "working-twin:uprn-100010001:session-001",
        name: "Kitchen"
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
        evidence_refs: ["evidence-boiler-photo"]
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

describe("capture package import routes", () => {
  it("imports a valid v4 package and returns an import summary", async () => {
    const env = createEnv();
    const { response, body } = await importValidPackage(env);

    expect(response.status).toBe(201);
    expect(body.import).toMatchObject({
      propertyId: "property:uprn-100010001",
      workingTwinId: "working-twin:uprn-100010001:session-001",
      captureSessionId: "capture-session-001",
      evidenceCount: 1,
      areaCount: 1,
      componentCount: 1,
      status: "imported"
    });
    expect(body.import.packageObjectKey).toContain(
      "captures/property%3Auprn-100010001/capture-session-001/"
    );
  });

  it("rejects invalid packages with structured JSON", async () => {
    const response = await worker.fetch(
      new Request("https://platform.test/import/capture-package", {
        method: "POST",
        body: JSON.stringify({ packageVersion: 4 })
      }),
      createEnv()
    );
    const body = (await response.json()) as {
      error: string;
      details: Array<{ path: string }>;
    };

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_capture_package");
    expect(body.details.some((issue) => issue.path === "packageId")).toBe(true);
  });

  it("creates or updates Property without making a user or company the owner", async () => {
    const env = createEnv();

    await importValidPackage(env);
    await importValidPackage(env);

    expect(env.store.properties.get("property:uprn-100010001")).toMatchObject({
      property_id: "property:uprn-100010001",
      property_name: "uprn-100010001"
    });
    expect(env.store.properties.size).toBe(1);
  });

  it("links WorkingTwin to Property", async () => {
    const env = createEnv();

    await importValidPackage(env);

    expect(
      env.store.workingTwins.get("working-twin:uprn-100010001:session-001")
    ).toMatchObject({
      property_id: "property:uprn-100010001",
      property_ref: "uprn-100010001"
    });
  });

  it("links CaptureSession to Property and WorkingTwin", async () => {
    const env = createEnv();

    await importValidPackage(env);

    expect(env.store.captureSessions.get("capture-session-001")).toMatchObject({
      property_id: "property:uprn-100010001",
      working_twin_id: "working-twin:uprn-100010001:session-001"
    });
  });

  it("stores evidence metadata without embedding binary media", async () => {
    const env = createEnv();

    await importValidPackage(env);

    expect(env.store.evidenceItems).toHaveLength(1);
    expect(env.store.evidenceItems[0]).toMatchObject({
      evidence_ref: "evidence-boiler-photo",
      media_ref: "r2://capture-media/boiler-photo.jpg",
      media_type: "photo"
    });
    expect(env.store.evidenceItems[0].metadata_json).not.toContain(
      "binary_payload"
    );
  });

  it("writes the original package JSON to R2", async () => {
    const env = createEnv();
    const { body } = await importValidPackage(env);

    const stored = env.store.r2Objects.get(body.import.packageObjectKey);

    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toMatchObject({
      packageId: "capture-package-001"
    });
  });

  it("fetches an import summary", async () => {
    const env = createEnv();
    const imported = await importValidPackage(env);

    const response = await worker.fetch(
      new Request(
        `https://platform.test/import/${encodeURIComponent(
          imported.body.import.importId
        )}`
      ),
      env
    );
    const body = (await response.json()) as ImportResponse;

    expect(response.status).toBe(200);
    expect(body.import).toEqual(imported.body.import);
  });

  it("lists imports for a property", async () => {
    const env = createEnv();

    await importValidPackage(env);

    const response = await worker.fetch(
      new Request(
        "https://platform.test/property/property%3Auprn-100010001/imports"
      ),
      env
    );
    const body = (await response.json()) as {
      imports: ImportResponse["import"][];
    };

    expect(response.status).toBe(200);
    expect(body.imports).toHaveLength(1);
  });

  it("rejects legacy v3 packages as requiring upgrade", async () => {
    const response = await worker.fetch(
      new Request("https://platform.test/import/capture-package", {
        method: "POST",
        body: JSON.stringify({
          packageVersion: 3,
          packageId: "legacy-package-001",
          propertyRef: "uprn-legacy"
        })
      }),
      createEnv()
    );
    const body = (await response.json()) as {
      error: string;
      message: string;
      details: { packageVersion: number; propertyRef: string };
    };

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_capture_package");
    expect(body.message).toContain("Legacy v3 packages require upgrade");
    expect(body.details).toMatchObject({
      packageVersion: 3,
      propertyRef: "uprn-legacy"
    });
  });
});
