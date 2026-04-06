import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { authPlugin } from "../features/auth/auth-plugin";
import { getSessionCookieName, verifySessionToken } from "../features/auth/session";
import { authRoutes } from "../features/auth/auth-routes";
import { masterRoutes } from "../features/masters/master-routes";
import { myRecipesRoutes } from "../features/recipes/my-recipes-routes";
import { recipeBookmarkRoutes } from "../features/recipes/recipe-bookmark-routes";
import { recipeDeleteRoutes } from "../features/recipes/recipe-delete-routes";
import { recipeDetailRoutes } from "../features/recipes/recipe-detail-routes";
import { recipeCreateRoutes } from "../features/recipes/recipe-create-routes";
import { recipeSearchRoutes } from "../features/recipes/recipe-search-routes";

export function createApp() {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
    credentials: true
  });

  app.decorateRequest("authUser", null);
  app.register(cookie);
  app.addHook("onRequest", async (request) => {
    const token = request.cookies[getSessionCookieName()];

    if (!token) {
      request.authUser = null;
      return;
    }

    request.authUser = verifySessionToken(token);
  });

  app.register(authPlugin);
  app.register(authRoutes);
  app.register(masterRoutes);
  app.register(recipeSearchRoutes);
  app.register(recipeDetailRoutes);
  app.register(recipeCreateRoutes);
  app.register(recipeBookmarkRoutes);
  app.register(myRecipesRoutes);
  app.register(recipeDeleteRoutes);

  return app;
}
