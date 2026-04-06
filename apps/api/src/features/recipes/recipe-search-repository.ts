import { getPool } from "../../db/pool";
import type { RecipeSearchItem, RecipeSearchResponse } from "./recipe-search-types";

type RecipeSearchRow = {
  flavorId: number;
  flavorName: string;
  recipeId: number;
  recipeName: string;
};

export async function searchRecipesByFlavorId(flavorId: number): Promise<RecipeSearchResponse> {
  const result = await getPool().query<RecipeSearchRow>(
    `
      SELECT
        r.id AS "recipeId",
        r.name AS "recipeName",
        f_all.id AS "flavorId",
        f_all.name AS "flavorName"
      FROM recipes r
      INNER JOIN recipe_flavors rf_all
        ON rf_all.recipe_id = r.id
      INNER JOIN flavors f_all
        ON f_all.id = rf_all.flavor_id
      WHERE EXISTS (
        SELECT 1
        FROM recipe_flavors rf_filter
        WHERE rf_filter.recipe_id = r.id
          AND rf_filter.flavor_id = $1
      )
      ORDER BY r.created_at DESC, r.id ASC, f_all.id ASC
    `,
    [flavorId]
  );

  const recipes = new Map<number, RecipeSearchItem>();

  for (const row of result.rows) {
    const recipe = recipes.get(row.recipeId);

    if (recipe) {
      recipe.flavors.push({
        id: row.flavorId,
        name: row.flavorName
      });
      continue;
    }

    recipes.set(row.recipeId, {
      id: row.recipeId,
      name: row.recipeName,
      flavors: [
        {
          id: row.flavorId,
          name: row.flavorName
        }
      ]
    });
  }

  return [...recipes.values()];
}
