import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../auth/auth-plugin";
import { createRecipeWithFlavors } from "./recipe-create-repository";
import type {
  RecipeCreateBody,
  ValidationErrorResponse
} from "./recipe-create-types";
import { validateRecipeCreateBody } from "./recipe-create-validation";

export const recipeCreateRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: RecipeCreateBody }>(
    "/recipes",
    async (request, reply) => {
      await requireAuth(request, reply);

      if (reply.sent || !request.authUser) {
        return;
      }

      const validation = await validateRecipeCreateBody(request.body);

      if (!validation.data) {
        return reply.code(422).send({
          field_errors: validation.fieldErrors,
          message: "入力内容を確認してください"
        } satisfies ValidationErrorResponse);
      }

      try {
        const createdRecipe = await createRecipeWithFlavors({
          recipe: validation.data,
          userId: request.authUser.userId
        });

        return reply.code(201).send(createdRecipe);
      } catch (error) {
        app.log.error(error);

        return reply.code(500).send({
          message: "エラーが発生しました。やり直してください"
        });
      }
    }
  );
};
