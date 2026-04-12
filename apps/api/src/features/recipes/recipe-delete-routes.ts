import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../auth/auth-plugin.js";
import { deleteRecipeByOwner } from "./recipe-delete-repository.js";

function parseRecipeId(value: string) {
  const recipeId = Number(value);

  if (!Number.isInteger(recipeId) || recipeId < 1) {
    return null;
  }

  return recipeId;
}

export const recipeDeleteRoutes: FastifyPluginAsync = async (app) => {
  app.delete<{ Params: { recipeId: string } }>(
    "/recipes/:recipeId",
    async (request, reply) => {
      await requireAuth(request, reply);

      if (reply.sent || !request.authUser) {
        return;
      }

      const recipeId = parseRecipeId(request.params.recipeId);

      if (recipeId === null) {
        return reply.code(404).send({
          message: "レシピが見つかりません"
        });
      }

      try {
        const result = await deleteRecipeByOwner({
          recipeId,
          userId: request.authUser.userId
        });

        if (result.status === "not_found") {
          return reply.code(404).send({
            message: "レシピが見つかりません"
          });
        }

        if (result.status === "forbidden") {
          return reply.code(403).send({
            message: "投稿者本人のみ削除できます"
          });
        }

        return reply.code(204).send();
      } catch (error) {
        app.log.error(error);

        return reply.code(500).send({
          message: "エラーが発生しました。やり直してください"
        });
      }
    }
  );
};
