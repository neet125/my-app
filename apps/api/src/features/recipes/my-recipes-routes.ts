import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../auth/auth-plugin";
import { fetchMyBookmarks, fetchMyRecipes } from "./my-recipes-repository";
import type { RecipeSearchResponse } from "./recipe-search-types";

type RouteErrorResponse = {
  message: string;
};

export const myRecipesRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Reply: RecipeSearchResponse | RouteErrorResponse }>("/me/bookmarks", async (request, reply) => {
    await requireAuth(request, reply);

    if (reply.sent || !request.authUser) {
      return;
    }

    try {
      return await fetchMyBookmarks(request.authUser.userId);
    } catch (error) {
      app.log.error(error);

      return reply.code(500).send({
        message: "エラーが発生しました。やり直してください"
      });
    }
  });

  app.get<{ Reply: RecipeSearchResponse | RouteErrorResponse }>("/me/recipes", async (request, reply) => {
    await requireAuth(request, reply);

    if (reply.sent || !request.authUser) {
      return;
    }

    try {
      return await fetchMyRecipes(request.authUser.userId);
    } catch (error) {
      app.log.error(error);

      return reply.code(500).send({
        message: "エラーが発生しました。やり直してください"
      });
    }
  });
};
