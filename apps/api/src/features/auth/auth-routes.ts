import type { FastifyPluginAsync } from "fastify";
import { setAuthSession, type SessionIdentity } from "./session";
import { verifyGoogleCredential } from "./google-auth";
import { upsertUserFromGoogleLogin } from "./user-repository";

type GoogleLoginBody = {
  credential?: string;
};

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: GoogleLoginBody }>("/auth/google-login", async (request, reply) => {
    const credential = request.body?.credential?.trim();

    if (!credential) {
      return reply.code(400).send({
        message: "Google credential is required."
      });
    }

    const profile = await verifyGoogleCredential(credential);
    const user = await upsertUserFromGoogleLogin(profile);
    const sessionIdentity: SessionIdentity = {
      googleUserId: user.googleUserId,
      name: user.name,
      userId: user.id
    };

    setAuthSession(reply, sessionIdentity);

    return {
      authenticated: true,
      user: {
        id: user.id,
        name: user.name
      }
    };
  });

  app.get("/auth/session", async (request) => {
    if (!request.authUser) {
      return {
        authenticated: false,
        user: null
      };
    }

    return {
      authenticated: true,
      user: {
        id: request.authUser.userId,
        name: request.authUser.name
      }
    };
  });
};
