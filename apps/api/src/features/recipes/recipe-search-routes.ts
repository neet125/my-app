import type { FastifyPluginAsync } from "fastify";
import { searchRecipesByFlavorId } from "./recipe-search-repository";
import type { RecipeSearchResponse } from "./recipe-search-types";

type RouteErrorResponse = {
  message: string;
};

function parseFlavorId(rawFlavorId: unknown) {
  if (typeof rawFlavorId !== "string" || rawFlavorId.trim() === "") {
    return null;
  }

  const flavorId = Number(rawFlavorId);

  if (!Number.isInteger(flavorId) || flavorId < 1) {
    return null;
  }

  return flavorId;
}

export const recipeSearchRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { flavor_id?: string }; Reply: RecipeSearchResponse | RouteErrorResponse }>(
    "/recipes/search",
    async (request, reply) => {
      const flavorId = parseFlavorId(request.query.flavor_id);

      if (flavorId === null) {
        return reply.code(400).send({
          message: "flavor_id を正しく指定してください"
        });
      }

      try {
        return await searchRecipesByFlavorId(flavorId);
      } catch (error) {
        app.log.error(error);

        return reply.code(500).send({
          message: "エラーが発生しました。やり直してください"
        });
      }
    }
  );
};
