import { describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import type { Env } from "../types/env";

type StoredProperty = {
  id: string;
  display_name: string;
  uprn: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

type PropertyResponse = {
  property: {
    id: string;
    displayName: string;
    uprn: string | null;
    address: string | null;
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

    const [id, displayName, uprn, address, createdAt, updatedAt] = this.params;
    this.store.set(String(id), {
      id: String(id),
      display_name: String(displayName),
      uprn: uprn === null ? null : String(uprn),
      address: address === null ? null : String(address),
      created_at: String(createdAt),
      updated_at: String(updatedAt)
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
    EVIDENCE_BUCKET: {} as R2Bucket
  };
}

describe("property routes", () => {
  it("creates and retrieves a property", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111"
    );

    const env = createEnv();
    const createResponse = await worker.fetch(
      new Request("https://platform.test/property", {
        method: "POST",
        body: JSON.stringify({
          displayName: "1 Example Street",
          uprn: "100000000001",
          address: "1 Example Street, Exampletown"
        })
      }),
      env
    );

    expect(createResponse.status).toBe(201);

    const getResponse = await worker.fetch(
      new Request(
        "https://platform.test/property/11111111-1111-4111-8111-111111111111"
      ),
      env
    );
    const body = (await getResponse.json()) as PropertyResponse;

    expect(getResponse.status).toBe(200);
    expect(body.property).toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      displayName: "1 Example Street",
      uprn: "100000000001",
      address: "1 Example Street, Exampletown"
    });
  });

  it("rejects property creation without a displayName", async () => {
    const response = await worker.fetch(
      new Request("https://platform.test/property", {
        method: "POST",
        body: JSON.stringify({ address: "Missing name" })
      }),
      createEnv()
    );

    expect(response.status).toBe(400);
  });
});
