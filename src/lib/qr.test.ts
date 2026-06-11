import { describe, expect, it } from "vitest";

import {
  buildPayload,
  createDefaultState,
  isContentEmpty,
  validate,
} from "@/lib/qr";

describe("QR content model", () => {
  it("treats a new URL state as empty", () => {
    const state = createDefaultState();

    expect(isContentEmpty(state.type, state.fields)).toBe(true);
  });

  it("normalizes bare domains into https URLs", () => {
    const state = createDefaultState();
    state.fields.url.url = "example.com/path";

    expect(validate("url", state.fields)).toEqual({ ok: true });
    expect(buildPayload("url", state.fields)).toBe("https://example.com/path");
  });

  it("rejects incomplete public hostnames", () => {
    const state = createDefaultState();
    state.fields.url.url = "example";

    expect(validate("url", state.fields)).toEqual({
      ok: false,
      field: "url",
      message: "Enter a full domain, e.g. example.com",
    });
  });

  it("builds encoded email payloads", () => {
    const state = createDefaultState();
    state.fields.email = {
      to: "hello@example.com",
      subject: "Hello QR",
      body: "Line one & line two",
    };

    expect(validate("email", state.fields)).toEqual({ ok: true });
    expect(buildPayload("email", state.fields)).toBe(
      "mailto:hello@example.com?subject=Hello%20QR&body=Line%20one%20%26%20line%20two",
    );
  });

  it("requires secured Wi-Fi payloads to include passwords", () => {
    const state = createDefaultState();
    state.fields.wifi = {
      ssid: "Studio",
      password: "",
      encryption: "WPA",
      hidden: false,
    };

    expect(validate("wifi", state.fields)).toEqual({
      ok: false,
      field: "password",
      message: "Password is required for a secured network",
    });
  });

  it("escapes Wi-Fi separator characters in payloads", () => {
    const state = createDefaultState();
    state.fields.wifi = {
      ssid: "Studio;Main",
      password: "pa:ss,word",
      encryption: "WPA",
      hidden: true,
    };

    expect(buildPayload("wifi", state.fields)).toBe(
      "WIFI:T:WPA;S:Studio\\;Main;P:pa\\:ss\\,word;H:true;;",
    );
  });
});
