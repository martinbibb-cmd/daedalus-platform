import { describe, expect, it } from "vitest";
import worker from "../src/index";
import type { Env } from "../types/env";

type StoredProperty = {
  property_id: string;
  property_name: string;
  created_at: string;
};

type PropertyResponse = {
  property: {
    propertyId: string;
    propertyName: string;
    createdAt: string;
  };
};

class TestStatement {
  constructor(
    private readonly sql: string,
    private readonly store: Map<string, StoredProperty>
  ) {}

  private params: unknown[] = [];

  bind(...params: unknown[]) {
    this.params = params;
    return this;
  }

  async run() {
    if (!this.sql.includes("INSERT INTO properties")) {
      throw new Error(`Unexpected run SQL: ${this.sql}`);
    }

    const [propertyId, propertyName, createdAt] = this.params;
    this.store.set(String(propertyId), {
      property_id: String(propertyId),
      property_name: String(propertyName),
      created_at: String(createdAt)
    });

    return { success: true };
  }

  async first<T>() {
    if (!this.sql.includes("FROM properties")) {
      throw new Error(`Unexpected first SQL: ${this.sql}`);
    }

    return (this.store.get(String(this.params[0])) ?? null) as T | null;
  }
}

function createEnv(): Env {
  const store = new Map<string, StoredProperty>();

  return {
    DB: {
      prepare(sql: string) {
        return new TestStatement(sql, store);
      }
    } as unknown as D1Database,
    EVIDENCE: {} as R2Bucket
  };
}

describe("property routes", () => {
  it("creates and retrieves a property", async () => {
    const env = createEnv();
    const createResponse = await worker.fetch(
      new Request("https://platform.test/property", {
        method: "POST",
        body: JSON.stringify({
          propertyId: "test-property-001",
          propertyName: "Martin Test Property"
        })
      }),
      env
    );

    expect(createResponse.status).toBe(201);

    const getResponse = await worker.fetch(
      new Request(
        "https://platform.test/property/test-property-001"
      ),
      env
    );
    const body = (await getResponse.json()) as PropertyResponse;

    expect(getResponse.status).toBe(200);
    expect(body.property).toMatchObject({
      propertyId: "test-property-001",
      propertyName: "Martin Test Property"
    });
  });

  it("rejects property creation without a propertyName", async () => {
    const response = await worker.fetch(
      new Request("https://platform.test/property", {
        method: "POST",
        body: JSON.stringify({ propertyId: "test-property-001" })
      }),
      createEnv()
    );

    expect(response.status).toBe(400);
  });

  it("rejects property creation that tries to use a user as ownership root", async () => {
    const response = await worker.fetch(
      new Request("https://platform.test/property", {
        method: "POST",
        body: JSON.stringify({
          propertyId: "test-property-001",
          propertyName: "Martin Test Property",
          userId: "user-001"
        })
      }),
      createEnv()
    );
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(body.message).toContain("Property is the ownership root");
  });
});
