import { describe, expect, it } from "vitest";

import { executeQrPixelGraphQl } from "@/lib/graphql/schema";

describe("QR Pixel GraphQL schema", () => {
  it("builds QR payloads from mutation input", async () => {
    const result = await executeQrPixelGraphQl({
      query: `
        mutation Build($input: QrInput!) {
          buildPayload(input: $input) {
            empty
            payload
            validation { ok message }
          }
        }
      `,
      variables: {
        input: {
          type: "url",
          url: { url: "example.com" },
        },
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.buildPayload).toEqual({
      empty: false,
      payload: "https://example.com",
      validation: { ok: true, message: null },
    });
  });

  it("returns validation errors without payloads", async () => {
    const result = await executeQrPixelGraphQl({
      query: `
        query Preview($input: QrInput!) {
          preview(input: $input) {
            payload
            validation { ok field message }
          }
        }
      `,
      variables: {
        input: {
          type: "phone",
          phone: { phone: "x" },
        },
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.preview).toEqual({
      payload: null,
      validation: {
        ok: false,
        field: "phone",
        message: "Enter a valid phone number",
      },
    });
  });
});
