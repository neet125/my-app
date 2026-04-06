import type { FastifyPluginAsync } from "fastify";
import { findRecipeDetail } from "./recipe-detail-repository";
import type { RecipeDetailResponse } from "./recipe-search-types";

type RouteErrorResponse = {
  message: string;
};

function parseRecipeId(value: string) {
  const recipeId = Number(value);

  if (!Number.isInteger(recipeId) || recipeId < 1) {
    return null;
  }

  return recipeId;
}

export const recipeDetailRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { recipeId: string }; Reply: RecipeDetailResponse | RouteErrorResponse }>(
    "/recipes/:recipeId",
    async (request, reply) => {
      const recipeId = parseRecipeId(request.params.recipeId);

      if (recipeId === null) {
        return reply.code(404).send({
          message: "レシピが見つかりません"
        });
      }

      try {
        const recipe = await findRecipeDetail(recipeId, request.authUser?.userId);

        if (!recipe) {
          return reply.code(404).send({
            message: "レシピが見つかりません"
          });
        }

        return recipe;
      } catch (error) {
        app.log.error(error);

        return reply.code(500).send({
          message: "エラーが発生しました。やり直してください"
        });
      }
    }
  );
};
