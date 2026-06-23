import type { Env } from "../../types/env";
import type { Property, PropertyCreateInput } from "../../types/property";
import { validatePropertyCreateAgainstPropertyRootContract } from "../contracts/propertyRoot";

type PropertyRow = {
  property_id: string;
  property_name: string;
  created_at: string;
};

const jsonHeaders = {
  "content-type": "application/json"
};

const badRequest = (message: string) =>
  Response.json({ error: "bad_request", message }, { status: 400 });

const toProperty = (row: PropertyRow): Property => ({
  propertyId: row.property_id,
  propertyName: row.property_name,
  createdAt: row.created_at
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

  const propertyValidation =
    validatePropertyCreateAgainstPropertyRootContract(input);
  if (!propertyValidation.success) {
    return badRequest(propertyValidation.message);
  }

  const propertyId = input.propertyId!.trim();
  const propertyName = input.propertyName!.trim();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO properties (
      property_id,
      property_name,
      created_at
    ) VALUES (?, ?, ?)`
  )
    .bind(propertyId, propertyName, now)
    .run();

  return new Response(
    JSON.stringify({
      property: {
        propertyId,
        propertyName,
        createdAt: now
      }
    }),
    { status: 201, headers: jsonHeaders }
  );
}

export async function getProperty(id: string, env: Env): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT
      property_id,
      property_name,
      created_at
    FROM properties
    WHERE property_id = ?`
  )
    .bind(id)
    .first<PropertyRow>();

  if (!row) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  return Response.json({ property: toProperty(row) });
}
