CREATE TABLE IF NOT EXISTS working_twins (
  working_twin_id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  property_ref TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS capture_sessions (
  capture_session_id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  working_twin_id TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS imported_packages (
  import_id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  package_version INTEGER NOT NULL,
  property_id TEXT NOT NULL,
  working_twin_id TEXT NOT NULL,
  capture_session_id TEXT NOT NULL,
  evidence_count INTEGER NOT NULL,
  area_count INTEGER NOT NULL,
  component_count INTEGER NOT NULL,
  package_object_key TEXT NOT NULL,
  status TEXT NOT NULL,
  imported_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_items (
  import_id TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  property_id TEXT NOT NULL,
  working_twin_id TEXT NOT NULL,
  capture_session_id TEXT,
  media_ref TEXT NOT NULL,
  media_type TEXT NOT NULL,
  content_type TEXT,
  content_hash TEXT,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (import_id, evidence_ref)
);

CREATE TABLE IF NOT EXISTS areas (
  import_id TEXT NOT NULL,
  area_ref TEXT NOT NULL,
  property_id TEXT NOT NULL,
  working_twin_id TEXT NOT NULL,
  name TEXT,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (import_id, area_ref)
);

CREATE TABLE IF NOT EXISTS components (
  import_id TEXT NOT NULL,
  component_ref TEXT NOT NULL,
  property_id TEXT NOT NULL,
  working_twin_id TEXT NOT NULL,
  area_ref TEXT,
  component_type TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (import_id, component_ref)
);
