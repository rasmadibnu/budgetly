import { cookies } from "next/headers";

import { env } from "@/lib/env";

export const SESSION_COOKIE_NAME = "budgetly_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export interface SessionPayload {
  sub: string;
  email: string;
  role: "owner" | "partner";
  exp: number;
}

function encodeBase64Url(input: Uint8Array) {
  const binary = Array.from(input, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function decodeBase64Url(input: string) {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function signValue(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.AUTH_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return encodeBase64Url(new Uint8Array(signature));
}

export async function createSignedSession(payload: Omit<SessionPayload, "exp">) {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + SESSION_DURATION_MS
  };
  const encodedPayload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const signature = await signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySignedSession(value?: string | null): Promise<SessionPayload | null> {
  if (!value) return null;

  const [payloadPart, signaturePart] = value.split(".");
  if (!payloadPart || !signaturePart) return null;

  const expectedSignature = await signValue(payloadPart);
  if (expectedSignature !== signaturePart) return null;

  try {
    const decoded = new TextDecoder().decode(decodeBase64Url(payloadPart));
    const parsed = JSON.parse(decoded) as SessionPayload;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = cookies();
  return verifySignedSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
