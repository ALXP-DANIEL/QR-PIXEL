import { executeQrPixelGraphQl } from "@/lib/graphql/schema";

export const runtime = "nodejs";

interface GraphQlRequestBody {
  query?: unknown;
  variables?: unknown;
  operationName?: unknown;
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
    ...init,
  });
}

function isVariables(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  return json({
    name: "QR Pixel GraphQL",
    endpoint: "/api/graphql",
    methods: ["POST"],
    example: {
      query:
        "mutation Build($input: QrInput!) { buildPayload(input: $input) { payload validation { ok message } } }",
      variables: { input: { type: "url", url: { url: "example.com" } } },
    },
  });
}

export async function POST(request: Request) {
  let body: GraphQlRequestBody;

  try {
    body = (await request.json()) as GraphQlRequestBody;
  } catch {
    return json(
      { errors: [{ message: "Request body must be JSON" }] },
      { status: 400 },
    );
  }

  if (typeof body.query !== "string" || body.query.trim() === "") {
    return json(
      { errors: [{ message: "`query` is required" }] },
      { status: 400 },
    );
  }

  const result = await executeQrPixelGraphQl({
    query: body.query,
    variables: isVariables(body.variables) ? body.variables : undefined,
    operationName:
      typeof body.operationName === "string" ? body.operationName : undefined,
  });

  return json(result, { status: result.errors ? 400 : 200 });
}
