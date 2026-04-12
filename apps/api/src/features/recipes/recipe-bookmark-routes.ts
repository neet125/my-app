import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../auth/auth-plugin.js";
import {
  createBookmark,
  deleteBookmark,
  recipeExists
} from "./recipe-bookmark-repository.js";

function parseRecipeId(value: string) {
  const recipeId = Number(value);

  if (!Number.isInteger(recipeId) || recipeId < 1) {
    return null;
  }

  return recipeId;
}

export const recipeBookmarkRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Params: { recipeId: string } }>(
    "/recipes/:recipeId/bookmark",
    async (request, reply) => {
      await requireAuth(request, reply);

      if (reply.sent || !request.authUser) {
        return;
      }

      const recipeId = parseRecipeId(request.params.recipeId);

      if (recipeId === null || !(await recipeExists(recipeId))) {
        return reply.code(404).send({
          message: "レシピが見つかりません"
        });
      }

      try {
        const bookmark = await createBookmark({
          recipeId,
          userId: request.authUser.userId
        });

        if (!bookmark) {
          return reply.code(409).send({
            message: "すでに保存済みです"
          });
        }

        return reply.code(201).send({
          id: bookmark.id
        });
      } catch (error) {
        app.log.error(error);

        return reply.code(500).send({
          message: "エラーが発生しました。やり直してください"
        });
      }
    }
  );

  app.delete<{ Params: { recipeId: string } }>(
    "/recipes/:recipeId/bookmark",
    async (request, reply) => {
      await requireAuth(request, reply);

      if (reply.sent || !request.authUser) {
        return;
      }

      const recipeId = parseRecipeId(request.params.recipeId);

      if (recipeId === null || !(await recipeExists(recipeId))) {
        return reply.code(404).send({
          message: "レシピが見つかりません"
        });
      }

      try {
        await deleteBookmark({
          recipeId,
          userId: request.authUser.userId
        });

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
