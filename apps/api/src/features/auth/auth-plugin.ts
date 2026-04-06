import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

const authPlugin: FastifyPluginAsync = async (app) => {
};

export { authPlugin };
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.authUser) {
    reply.code(401).send({
      message: "ログインが必要です"
    });
  }
}
