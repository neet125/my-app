import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { authPlugin } from "../features/auth/auth-plugin.js";
import { getSessionCookieName, verifySessionToken } from "../features/auth/session.js";
import { authRoutes } from "../features/auth/auth-routes.js";
import { masterRoutes } from "../features/masters/master-routes.js";
import { myRecipesRoutes } from "../features/recipes/my-recipes-routes.js";
import { recipeBookmarkRoutes } from "../features/recipes/recipe-bookmark-routes.js";
import { recipeDeleteRoutes } from "../features/recipes/recipe-delete-routes.js";
import { recipeDetailRoutes } from "../features/recipes/recipe-detail-routes.js";
import { recipeCreateRoutes } from "../features/recipes/recipe-create-routes.js";
import { recipeSearchRoutes } from "../features/recipes/recipe-search-routes.js";

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
