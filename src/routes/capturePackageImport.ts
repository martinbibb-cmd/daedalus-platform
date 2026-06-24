import {
  DaedalusPackageV4Schema,
  identifyDaedalusPackageForUpgrade,
  type DaedalusPackageV4
} from "../contracts/daedalusPackageV4";
import type { Env } from "../../types/env";

type ImportSummary = {
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

type ImportRow = {
  import_id: string;
  property_id: string;
  working_twin_id: string;
  capture_session_id: string;
  evidence_count: number;
  area_count: number;
  component_count: number;
  package_object_key: string;
  status: "imported";
};

const badRequest = (message: string, details?: unknown) =>
  Response.json(
    {
      error: "bad_request",
      message,
      details
    },
    { status: 400 }
  );

const importValidationError = (message: string, details?: unknown) =>
  Response.json(
    {
      error: "invalid_capture_package",
      message,
      details
    },
    { status: 400 }
  );

const toSummary = (row: ImportRow): ImportSummary => ({
  importId: row.import_id,
  propertyId: row.property_id,
  workingTwinId: row.working_twin_id,
  captureSessionId: row.capture_session_id,
  evidenceCount: row.evidence_count,
  areaCount: row.area_count,
  componentCount: row.component_count,
  packageObjectKey: row.package_object_key,
  status: row.status
});

function createImportId(packageId: string): string {
  return `import:${packageId}:${crypto.randomUUID()}`;
}

function packageObjectKey(
  propertyId: string,
  captureSessionId: string,
  importId: string
): string {
  return `captures/${encodeURIComponent(propertyId)}/${encodeURIComponent(
    captureSessionId
  )}/${encodeURIComponent(importId)}.json`;
}

function formatZodIssues(
  issues: Array<{ path: Array<string | number>; message: string; code: string }>
) {
  return issues.map((issue) => ({
    path: issue.path.join("."),
    code: issue.code,
    message: issue.message
  }));
}

function requireImportEntities(packageV4: DaedalusPackageV4) {
  const issues: Array<{ path: string; message: string }> = [];

  if (!packageV4.workingTwin) {
    issues.push({
      path: "workingTwin",
      message: "workingTwin is required for platform import v1."
    });
  }

  if (!packageV4.surveyCaptureSession) {
    issues.push({
      path: "surveyCaptureSession",
      message: "surveyCaptureSession is required for platform import v1."
    });
  }

  return issues;
}

export async function importCapturePackage(
  request: Request,
  env: Env
): Promise<Response> {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return badRequest("Expected a JSON request body.");
  }

  const identification = identifyDaedalusPackageForUpgrade(input);
  if (identification.status === "legacy_v3_upgrade_required") {
    return importValidationError("Legacy v3 packages require upgrade before platform import.", {
      packageVersion: identification.packageVersion,
      propertyRef: identification.property_ref
    });
  }

  const parsed = DaedalusPackageV4Schema.safeParse(input);
  if (!parsed.success) {
    return importValidationError(
      "Capture package failed DaedalusPackageV4 validation.",
      formatZodIssues(parsed.error.issues)
    );
  }

  const missingImportEntities = requireImportEntities(parsed.data);
  if (missingImportEntities.length > 0) {
    return importValidationError(
      "Capture package is valid v4 but is missing entities required for platform import v1.",
      missingImportEntities
    );
  }

  const packageV4 = parsed.data;
  const property = packageV4.propertyIdentity;
  const workingTwin = packageV4.workingTwin!;
  const captureSession = packageV4.surveyCaptureSession!;
  const now = new Date().toISOString();
  const importId = createImportId(packageV4.packageId);
  const objectKey = packageObjectKey(
    property.property_id,
    captureSession.session_ref,
    importId
  );
  const originalPackageJson = JSON.stringify(input);

  await env.DB.prepare(
    `INSERT INTO properties (
      property_id,
      property_name,
      created_at
    ) VALUES (?, ?, ?)
    ON CONFLICT(property_id) DO UPDATE SET
      property_name = excluded.property_name`
  )
    .bind(property.property_id, property.property_ref, now)
    .run();

  await env.DB.prepare(
    `INSERT INTO working_twins (
      working_twin_id,
      property_id,
      property_ref,
      source,
      metadata_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(working_twin_id) DO UPDATE SET
      property_id = excluded.property_id,
      property_ref = excluded.property_ref,
      source = excluded.source,
      metadata_json = excluded.metadata_json`
  )
    .bind(
      workingTwin.twin_ref,
      workingTwin.property_id,
      workingTwin.property_ref,
      workingTwin.source,
      JSON.stringify(workingTwin),
      now
    )
    .run();

  await env.DB.prepare(
    `INSERT INTO capture_sessions (
      capture_session_id,
      property_id,
      working_twin_id,
      metadata_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(capture_session_id) DO UPDATE SET
      property_id = excluded.property_id,
      working_twin_id = excluded.working_twin_id,
      metadata_json = excluded.metadata_json`
  )
    .bind(
      captureSession.session_ref,
      captureSession.property_id,
      captureSession.working_twin_ref,
      JSON.stringify(captureSession),
      now
    )
    .run();

  await env.EVIDENCE.put(objectKey, originalPackageJson, {
    httpMetadata: { contentType: "application/json" }
  });

  await env.DB.prepare(
    `INSERT INTO imported_packages (
      import_id,
      package_id,
      package_version,
      property_id,
      working_twin_id,
      capture_session_id,
      evidence_count,
      area_count,
      component_count,
      package_object_key,
      status,
      imported_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      importId,
      packageV4.packageId,
      packageV4.packageVersion,
      property.property_id,
      workingTwin.twin_ref,
      captureSession.session_ref,
      packageV4.evidence.length,
      packageV4.areas.length,
      packageV4.components.length,
      objectKey,
      "imported",
      now
    )
    .run();

  for (const evidence of packageV4.evidence) {
    await env.DB.prepare(
      `INSERT INTO evidence_items (
        import_id,
        evidence_ref,
        property_id,
        working_twin_id,
        capture_session_id,
        media_ref,
        media_type,
        content_type,
        content_hash,
        metadata_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        importId,
        evidence.evidence_ref,
        evidence.property_id,
        evidence.twin_ref,
        evidence.session_ref ?? null,
        evidence.media_ref,
        evidence.media_type,
        evidence.content_type ?? null,
        evidence.content_hash ?? null,
        JSON.stringify(evidence),
        now
      )
      .run();
  }

  for (const area of packageV4.areas) {
    await env.DB.prepare(
      `INSERT INTO areas (
        import_id,
        area_ref,
        property_id,
        working_twin_id,
        name,
        metadata_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        importId,
        area.area_ref,
        area.property_id,
        area.twin_ref,
        area.name ?? null,
        JSON.stringify(area),
        now
      )
      .run();
  }

  for (const component of packageV4.components) {
    await env.DB.prepare(
      `INSERT INTO components (
        import_id,
        component_ref,
        property_id,
        working_twin_id,
        area_ref,
        component_type,
        metadata_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        importId,
        component.object_ref,
        component.property_id,
        component.twin_ref,
        component.area_ref ?? null,
        component.component_type,
        JSON.stringify(component),
        now
      )
      .run();
  }

  return Response.json(
    {
      import: {
        importId,
        propertyId: property.property_id,
        workingTwinId: workingTwin.twin_ref,
        captureSessionId: captureSession.session_ref,
        evidenceCount: packageV4.evidence.length,
        areaCount: packageV4.areas.length,
        componentCount: packageV4.components.length,
        packageObjectKey: objectKey,
        status: "imported"
      } satisfies ImportSummary
    },
    { status: 201 }
  );
}

export async function getImport(
  importId: string,
  env: Env
): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT
      import_id,
      property_id,
      working_twin_id,
      capture_session_id,
      evidence_count,
      area_count,
      component_count,
      package_object_key,
      status
    FROM imported_packages
    WHERE import_id = ?`
  )
    .bind(importId)
    .first<ImportRow>();

  if (!row) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  return Response.json({ import: toSummary(row) });
}

export async function getPropertyImports(
  propertyId: string,
  env: Env
): Promise<Response> {
  const result = await env.DB.prepare(
    `SELECT
      import_id,
      property_id,
      working_twin_id,
      capture_session_id,
      evidence_count,
      area_count,
      component_count,
      package_object_key,
      status
    FROM imported_packages
    WHERE property_id = ?`
  )
    .bind(propertyId)
    .all<ImportRow>();

  return Response.json({
    imports: (result.results ?? []).map(toSummary)
  });
}
