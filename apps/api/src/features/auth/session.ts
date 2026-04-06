import type { FastifyReply } from "fastify";
import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE_NAME = "app_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  exp: number;
  googleUserId: string;
  name: string;
  userId: string;
};

export type SessionIdentity = Omit<SessionPayload, "exp">;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is required.");
  }

  return secret;
}

function encode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAgeSeconds() {
  return SESSION_MAX_AGE_SECONDS;
}

export function createSessionToken(input: SessionIdentity) {
  const payload: SessionPayload = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  };
  const encodedPayload = encode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function setAuthSession(reply: FastifyReply, user: SessionIdentity) {
  reply.setCookie(getSessionCookieName(), createSessionToken(user), {
    httpOnly: true,
    maxAge: getSessionMaxAgeSeconds(),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  const parsed = JSON.parse(decode(encodedPayload)) as SessionPayload;

  if (parsed.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return parsed;
}
