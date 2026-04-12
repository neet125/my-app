import type { FastifyPluginAsync } from "fastify";
import { fetchAlcohols, fetchFlavors } from "./master-repository.js";
import type { AlcoholsResponse, FlavorsResponse } from "./master-types.js";

type RouteErrorResponse = {
  message: string;
};

export const masterRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Reply: FlavorsResponse | RouteErrorResponse }>("/flavors", async (_request, reply) => {
    try {
      return await fetchFlavors();
    } catch (error) {
      app.log.error(error);
      reply.code(500);

      return {
        message: "エラーが発生しました。やり直してください"
      };
    }
  });

  app.get<{ Reply: AlcoholsResponse | RouteErrorResponse }>("/alcohols", async (_request, reply) => {
    try {
      return await fetchAlcohols();
    } catch (error) {
      app.log.error(error);
      reply.code(500);

      return {
        message: "エラーが発生しました。やり直してください"
      };
    }
  });
};
