import type { Env } from "../../types/env";
import { escapeHtml, page } from "../html";

type PropertyRow = {
  property_id: string;
  property_name: string;
  created_at: string;
};

type ImportRow = {
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
  status: string;
  imported_at: string;
};

type WorkingTwinRow = {
  working_twin_id: string;
  property_id: string;
  property_ref: string;
  source: string;
  metadata_json: string;
  created_at: string;
};

type CaptureSessionRow = {
  capture_session_id: string;
  property_id: string;
  working_twin_id: string;
  metadata_json: string;
  created_at: string;
};

type AreaRow = {
  import_id: string;
  area_ref: string;
  property_id: string;
  working_twin_id: string;
  name: string | null;
  metadata_json: string;
  created_at: string;
};

type ComponentRow = {
  import_id: string;
  component_ref: string;
  property_id: string;
  working_twin_id: string;
  area_ref: string | null;
  component_type: string;
  metadata_json: string;
  created_at: string;
};

type EvidenceRow = {
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

type CountRow = {
  count: number;
  last_imported_at: string | null;
};

const NOT_CAPTURED = "Not yet captured";

const cell = (label: string, value: unknown) =>
  `<td data-label="${escapeHtml(label)}">${escapeHtml(value ?? "-")}</td>`;

const linkedCell = (label: string, href: string, value: unknown) =>
  `<td data-label="${escapeHtml(label)}"><a href="${escapeHtml(href)}">${escapeHtml(
    value ?? "-"
  )}</a></td>`;

const emptyRow = (colspan: number, message: string) =>
  `<tr><td colspan="${colspan}">${escapeHtml(message)}</td></tr>`;

const section = (title: string, body: string) =>
  `<section class="panel-section"><h2>${escapeHtml(title)}</h2>${body}</section>`;

const card = (title: string, body: string) =>
  `<div class="panel"><h3>${escapeHtml(title)}</h3>${body}</div>`;

const metric = (label: string, value: unknown) =>
  `<div class="stat"><strong>${escapeHtml(value ?? 0)}</strong><span>${escapeHtml(label)}</span></div>`;

const detailItem = (label: string, value: unknown) =>
  `<div class="detail"><span>${escapeHtml(label)}</span><strong>${escapeHtml(
    value ?? NOT_CAPTURED
  )}</strong></div>`;

const parseMetadata = (json: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const firstText = (
  metadata: Record<string, unknown>,
  keys: string[]
): string | null => {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const reviewStatus = (metadataJson: string): string | null => {
  const metadata = parseMetadata(metadataJson);
  const direct = firstText(metadata, [
    "reviewStatus",
    "review_status",
    "review_state",
    "status",
    "resolutionStatus",
    "resolution_status"
  ]);
  if (direct) {
    return direct;
  }

  const data = metadata.data;
  return data && typeof data === "object" && !Array.isArray(data)
    ? firstText(data as Record<string, unknown>, [
        "reviewStatus",
        "review_status",
        "review_state",
        "status",
        "resolutionStatus",
        "resolution_status"
      ])
    : null;
};

const isNeedsReview = (status: string | null): boolean => {
  if (!status) return false;
  return !["reviewed", "resolved", "complete", "completed", "verified", "accepted"].includes(
    status.toLowerCase()
  );
};

const namedId = (name: string | null | undefined, id: string) =>
  name && name !== id ? `${name} (${id})` : id;

export async function listProperties(env: Env): Promise<Response> {
  const properties =
    (
      await env.DB.prepare(
        `SELECT property_id, property_name, created_at
        FROM properties
        ORDER BY created_at DESC`
      ).all<PropertyRow>()
    ).results ?? [];

  const rows = await Promise.all(
    properties.map(async (property) => {
      const counts = await env.DB.prepare(
        `SELECT COUNT(import_id) AS count, MAX(imported_at) AS last_imported_at
        FROM imported_packages
        WHERE property_id = ?`
      )
        .bind(property.property_id)
        .first<CountRow>();

      return `<tr>
${linkedCell("Property", `/property/${encodeURIComponent(property.property_id)}`, property.property_name)}
${cell("Property ID", property.property_id)}
${cell("Imports", counts?.count ?? 0)}
${cell("Last import", counts?.last_imported_at ?? null)}
</tr>`;
    })
  );

  return page(
    "Properties",
    `<div class="topline">
  <div>
    <h1>Properties</h1>
    <div class="muted">Imported Capture package visibility</div>
  </div>
</div>
<table>
  <thead><tr><th>Property</th><th>Property ID</th><th>Imports</th><th>Last import</th></tr></thead>
  <tbody>${rows.join("") || emptyRow(4, "No properties have been created or imported yet.")}</tbody>
</table>`
  );
}

export async function showProperty(id: string, env: Env): Promise<Response> {
  const property = await env.DB.prepare(
    `SELECT property_id, property_name, created_at
    FROM properties
    WHERE property_id = ?`
  )
    .bind(id)
    .first<PropertyRow>();

  if (!property) {
    return page(
      "Property not found",
      `<h1>Property not found</h1><p><a href="/properties">Back to properties</a></p>`
    );
  }

  const imports =
    (
      await env.DB.prepare(
        `SELECT
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
        FROM imported_packages
        WHERE property_id = ?
        ORDER BY imported_at DESC`
      )
        .bind(id)
        .all<ImportRow>()
    ).results ?? [];

  const twins =
    (
      await env.DB.prepare(
        `SELECT working_twin_id, property_id, property_ref, source, metadata_json, created_at
        FROM working_twins
        WHERE property_id = ?
        ORDER BY created_at DESC`
      )
        .bind(id)
        .all<WorkingTwinRow>()
    ).results ?? [];

  const sessions =
    (
      await env.DB.prepare(
        `SELECT capture_session_id, property_id, working_twin_id, metadata_json, created_at
        FROM capture_sessions
        WHERE property_id = ?
        ORDER BY created_at DESC`
      )
        .bind(id)
        .all<CaptureSessionRow>()
    ).results ?? [];

  const areas =
    (
      await env.DB.prepare(
        `SELECT import_id, area_ref, property_id, working_twin_id, name, metadata_json, created_at
        FROM areas
        WHERE property_id = ?
        ORDER BY COALESCE(name, area_ref)`
      )
        .bind(id)
        .all<AreaRow>()
    ).results ?? [];

  const components =
    (
      await env.DB.prepare(
        `SELECT import_id, component_ref, property_id, working_twin_id, area_ref, component_type, metadata_json, created_at
        FROM components
        WHERE property_id = ?
        ORDER BY component_type, component_ref`
      )
        .bind(id)
        .all<ComponentRow>()
    ).results ?? [];

  const evidence =
    (
      await env.DB.prepare(
        `SELECT
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
        FROM evidence_items
        WHERE property_id = ?
        ORDER BY created_at DESC`
      )
        .bind(id)
        .all<EvidenceRow>()
    ).results ?? [];

  const latestImport = imports[0];
  const latestTwin = twins[0];
  const areaNameByRef = new Map(areas.map((area) => [area.area_ref, area.name]));
  const evidenceByComponent = new Map<string, number>();
  for (const component of components) {
    const metadata = parseMetadata(component.metadata_json);
    const refs = Array.isArray(metadata.evidence_refs) ? metadata.evidence_refs : [];
    evidenceByComponent.set(component.component_ref, refs.length);
  }

  const unresolvedRows = [
    ...areas
      .filter((area) => isNeedsReview(reviewStatus(area.metadata_json)))
      .map(
        (area) =>
          `<tr>${cell("Type", "Area")}${cell("Item", namedId(area.name, area.area_ref))}${cell(
            "Reason",
            reviewStatus(area.metadata_json)
          )}</tr>`
      ),
    ...components
      .filter(
        (component) =>
          isNeedsReview(reviewStatus(component.metadata_json)) || !component.area_ref
      )
      .map(
        (component) =>
          `<tr>${cell("Type", "Component")}${cell("Item", component.component_ref)}${cell(
            "Reason",
            reviewStatus(component.metadata_json) ?? "No linked area captured"
          )}</tr>`
      ),
    ...evidence
      .filter(
        (item) =>
          isNeedsReview(reviewStatus(item.metadata_json)) || !item.capture_session_id
      )
      .map(
        (item) =>
          `<tr>${cell("Type", "Evidence")}${cell("Item", item.evidence_ref)}${cell(
            "Reason",
            reviewStatus(item.metadata_json) ?? "No linked capture session"
          )}</tr>`
      )
  ].join("");

  const importRows = imports.length
    ? imports
        .map(
          (row) => `<tr>
${linkedCell("Import", `/import/${encodeURIComponent(row.import_id)}`, row.import_id)}
${cell("Package", row.package_id)}
${cell("Version", row.package_version)}
${cell("Imported", row.imported_at)}
</tr>`
        )
        .join("")
    : emptyRow(4, "No Capture packages have been imported for this property yet.");

  const areaRows = areas.length
    ? areas
        .map((area) => `<tr>
${cell("Area", namedId(area.name, area.area_ref))}
${cell("Objects", components.filter((component) => component.area_ref === area.area_ref).length)}
${cell("Evidence", evidence.filter((item) => item.metadata_json.includes(area.area_ref)).length)}
${cell("Review", reviewStatus(area.metadata_json) ?? "No review status captured")}
</tr>`)
        .join("")
    : emptyRow(4, "No areas imported yet.");

  const componentRows = components.length
    ? components
        .map((component) => `<tr>
${cell("Component", component.component_type)}
${cell("Object", component.component_ref)}
${cell("Review", reviewStatus(component.metadata_json) ?? "No review status captured")}
${cell("Linked area", component.area_ref ? areaNameByRef.get(component.area_ref) ?? component.area_ref : null)}
</tr>`)
        .join("")
    : emptyRow(4, "No components or objects imported yet.");

  const evidenceRows = evidence.length
    ? evidence
        .slice(0, 12)
        .map((item) => `<tr>
${cell("Evidence", item.evidence_ref)}
${cell("Type", item.media_type)}
${cell("Capture session", item.capture_session_id)}
${cell("Review", reviewStatus(item.metadata_json) ?? "No review status captured")}
</tr>`)
        .join("")
    : emptyRow(4, "No evidence imported yet.");

  const historyRows = sessions.length
    ? sessions
        .map((session) => `<tr>
${cell("Capture session", session.capture_session_id)}
${cell("Working Twin", session.working_twin_id)}
${cell("Created", session.created_at)}
${cell("Review", reviewStatus(session.metadata_json) ?? "No review status captured")}
</tr>`)
        .join("")
    : emptyRow(4, "No capture sessions imported yet.");

  return page(
    property.property_name,
    `<p><a href="/properties">Back to properties</a></p>
<div class="topline">
  <div>
    <h1>${escapeHtml(property.property_name)}</h1>
    <div class="muted">Property ID <code>${escapeHtml(property.property_id)}</code></div>
  </div>
</div>
<div class="grid">
  ${metric("Capture sessions", sessions.length)}
  ${metric("Areas", areas.length)}
  ${metric("Components", components.length)}
  ${metric("Evidence", evidence.length)}
</div>
${section("Property Summary", `<div class="detail-grid">
  ${detailItem("Property ID", property.property_id)}
  ${detailItem("Property reference", latestTwin?.property_ref)}
  ${detailItem("Created", property.created_at)}
  ${detailItem("Last import", latestImport?.imported_at)}
</div>`)}
${section("Working Twin Summary", `<div class="card-grid">
  ${card("Working Twin ID", `<p><code>${escapeHtml(latestTwin?.working_twin_id ?? NOT_CAPTURED)}</code></p>`)}
  ${card("Source", `<p>${escapeHtml(latestTwin?.source ?? NOT_CAPTURED)}</p>`)}
  ${card("Import status", `<p>${escapeHtml(latestImport?.status ?? NOT_CAPTURED)}</p>`)}
  ${card("Evidence refs on components", `<p>${escapeHtml(
    [...evidenceByComponent.values()].reduce((total, count) => total + count, 0)
  )}</p>`)}
</div>
<p class="muted">Current Working Twin reflects captured evidence only.</p>`)}
${section("Needs Review", `<table>
  <thead><tr><th>Type</th><th>Item</th><th>Reason</th></tr></thead>
  <tbody>${unresolvedRows || emptyRow(3, "No unresolved captured items are currently visible.")}</tbody>
</table>`)}
${section("Areas", `<table>
  <thead><tr><th>Area</th><th>Objects</th><th>Evidence</th><th>Review status</th></tr></thead>
  <tbody>${areaRows}</tbody>
</table>`)}
${section("Components", `<table>
  <thead><tr><th>Component</th><th>Object</th><th>Review status</th><th>Linked area</th></tr></thead>
  <tbody>${componentRows}</tbody>
</table>`)}
${section("Evidence", `<table>
  <thead><tr><th>Evidence</th><th>Type</th><th>Capture session</th><th>Review status</th></tr></thead>
  <tbody>${evidenceRows}</tbody>
</table>`)}
${section("Survey History", `<table>
  <thead><tr><th>Capture session</th><th>Working Twin</th><th>Created</th><th>Review status</th></tr></thead>
  <tbody>${historyRows}</tbody>
</table>
<h3>Imports</h3>
<table>
  <thead><tr><th>Import</th><th>Package</th><th>Version</th><th>Imported</th></tr></thead>
  <tbody>${importRows}</tbody>
</table>`)}
<div class="boundary">
  <p>This dashboard reflects captured Property Twin data.</p>
  <p>It does not provide recommendations, repair advice, compliance judgement, or product selection.</p>
</div>`
  );
}

export async function showImport(importId: string, env: Env): Promise<Response> {
  const importRow = await env.DB.prepare(
    `SELECT
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
    FROM imported_packages
    WHERE import_id = ?`
  )
    .bind(importId)
    .first<ImportRow>();

  if (!importRow) {
    return page(
      "Import not found",
      `<h1>Import not found</h1><p><a href="/properties">Back to properties</a></p>`
    );
  }

  return page(
    `Import ${importRow.import_id}`,
    `<p><a href="/property/${encodeURIComponent(importRow.property_id)}">Back to property</a></p>
<h1>Import ${escapeHtml(importRow.import_id)}</h1>
<div class="grid">
  ${metric("Package", importRow.package_id)}
  ${metric("Version", importRow.package_version)}
  ${metric("Status", importRow.status)}
  ${metric("Imported", importRow.imported_at)}
</div>
${section("Working Twin", `<div class="detail-grid">
  ${detailItem("Working Twin ID", importRow.working_twin_id)}
  ${detailItem("Capture Session ID", importRow.capture_session_id)}
  ${detailItem("Property ID", importRow.property_id)}
</div>`)}
${section("Stored Package", `<div class="panel"><code>${escapeHtml(importRow.package_object_key)}</code></div>`)}
${section("Import Counts", `<div class="grid">
  ${metric("Areas", importRow.area_count)}
  ${metric("Components", importRow.component_count)}
  ${metric("Evidence", importRow.evidence_count)}
</div>`)}
<div class="boundary">
  <p>This import view shows stored Capture package metadata only.</p>
  <p>It does not provide recommendations, repair advice, compliance judgement, or product selection.</p>
</div>`
  );
}
