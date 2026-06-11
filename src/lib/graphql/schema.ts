import { buildSchema, graphql } from "graphql";

import {
  buildPayload,
  createDefaultState,
  createEmptyFields,
  QR_TYPE_LABELS,
  type QrFields,
  type QrType,
  type ValidationResult,
  validate,
} from "@/lib/qr";

export const qrPixelSchema = buildSchema(`
  enum QrType {
    url
    text
    email
    phone
    wifi
  }

  enum WifiEncryption {
    WPA
    WEP
    nopass
  }

  input UrlInput {
    url: String
  }

  input TextInput {
    text: String
  }

  input EmailInput {
    to: String
    subject: String
    body: String
  }

  input PhoneInput {
    phone: String
  }

  input WifiInput {
    ssid: String
    password: String
    encryption: WifiEncryption
    hidden: Boolean
  }

  input QrInput {
    type: QrType!
    url: UrlInput
    text: TextInput
    email: EmailInput
    phone: PhoneInput
    wifi: WifiInput
  }

  type QrTypeInfo {
    id: QrType!
    label: String!
  }

  type Validation {
    ok: Boolean!
    field: String
    message: String
  }

  type PayloadResult {
    type: QrType!
    empty: Boolean!
    payload: String
    validation: Validation!
  }

  type Health {
    ok: Boolean!
    name: String!
  }

  type Query {
    health: Health!
    qrTypes: [QrTypeInfo!]!
    preview(input: QrInput!): PayloadResult!
  }

  type Mutation {
    buildPayload(input: QrInput!): PayloadResult!
  }
`);

interface GraphQlQrInput {
  type: QrType;
  url?: Partial<QrFields["url"]>;
  text?: Partial<QrFields["text"]>;
  email?: Partial<QrFields["email"]>;
  phone?: Partial<QrFields["phone"]>;
  wifi?: Partial<QrFields["wifi"]>;
}

interface PayloadResult {
  type: QrType;
  empty: boolean;
  payload: string | null;
  validation: ValidationResult;
}

function fieldsFromInput(input: GraphQlQrInput): QrFields {
  const fields = createEmptyFields();
  return {
    url: { ...fields.url, ...input.url },
    text: { ...fields.text, ...input.text },
    email: { ...fields.email, ...input.email },
    phone: { ...fields.phone, ...input.phone },
    wifi: { ...fields.wifi, ...input.wifi },
  };
}

function isGraphQlInputEmpty(type: QrType, fields: QrFields): boolean {
  switch (type) {
    case "url":
      return fields.url.url.trim() === "";
    case "text":
      return fields.text.text.trim() === "";
    case "email":
      return fields.email.to.trim() === "";
    case "phone":
      return fields.phone.phone.trim() === "";
    case "wifi":
      return fields.wifi.ssid.trim() === "";
  }
}

function resolvePayload(input: GraphQlQrInput): PayloadResult {
  const fields = fieldsFromInput(input);
  const empty = isGraphQlInputEmpty(input.type, fields);
  const validation = empty
    ? { ok: true as const }
    : validate(input.type, fields);

  return {
    type: input.type,
    empty,
    validation,
    payload: !empty && validation.ok ? buildPayload(input.type, fields) : null,
  };
}

export const qrPixelRoot = {
  health: () => ({ ok: true, name: "QR Pixel GraphQL" }),
  qrTypes: () =>
    Object.entries(QR_TYPE_LABELS).map(([id, label]) => ({
      id,
      label,
    })),
  preview: ({ input }: { input: GraphQlQrInput }) => resolvePayload(input),
  buildPayload: ({ input }: { input: GraphQlQrInput }) => resolvePayload(input),
  defaultState: () => createDefaultState(),
};

export async function executeQrPixelGraphQl({
  query,
  variables,
  operationName,
}: {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}) {
  return graphql({
    schema: qrPixelSchema,
    source: query,
    rootValue: qrPixelRoot,
    variableValues: variables,
    operationName,
  });
}
