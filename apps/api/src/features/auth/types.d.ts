import type { FastifyReply, FastifyRequest } from "fastify";

type SessionUser = {
  exp: number;
  googleUserId: string;
  name: string;
  userId: string;
};

declare module "fastify" {
  interface FastifyRequest {
    authUser: SessionUser | null;
  }
}
