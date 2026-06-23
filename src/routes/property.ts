import type { Env } from "../../types/env";
import type { Property, PropertyCreateInput } from "../../types/property";

type PropertyRow = {
  id: string;
  display_name: string;
  uprn: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

const jsonHeaders = {
  "content-type": "application/json"
};

const badRequest = (message: string) =>
  Response.json({ error: "bad_request", message }, { status: 400 });

const toProperty = (row: PropertyRow): Property => ({
  id: row.id,
  displayName: row.display_name,
  uprn: row.uprn,
  address: row.address,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export async function createProperty(
  request: Request,
  env: Env
): Promise<Response> {
  let input: PropertyCreateInput;

  try {
    input = (await request.json()) as PropertyCreateInput;
  } catch {
    return badRequest("Expected a JSON request body.");
  }

  const displayName = input.displayName?.trim();
  if (!displayName) {
    return badRequest("displayName is required.");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const uprn = input.uprn?.trim() || null;
  const address = input.address?.trim() || null;

  await env.DB.prepare(
    `INSERT INTO properties (
      id,
      display_name,
      uprn,
      address,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, displayName, uprn, address, now, now)
    .run();

  return new Response(
    JSON.stringify({
      property: {
        id,
        displayName,
        uprn,
        address,
        createdAt: now,
        updatedAt: now
      }
    }),
    { status: 201, headers: jsonHeaders }
  );
}

export async function getProperty(id: string, env: Env): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT
      id,
      display_name,
      uprn,
      address,
      created_at,
      updated_at
    FROM properties
    WHERE id = ?`
  )
    .bind(id)
    .first<PropertyRow>();

  if (!row) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  return Response.json({ property: toProperty(row) });
}

