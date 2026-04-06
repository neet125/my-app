import { getPool } from "../../db/pool";
import type { RecipeSearchItem, RecipeSearchResponse } from "./recipe-search-types";

type MyRecipeRow = {
  flavorId: number;
  flavorName: string;
  recipeId: number;
  recipeName: string;
};

function buildRecipeList(rows: MyRecipeRow[]): RecipeSearchResponse {
  const recipes = new Map<number, RecipeSearchItem>();

  for (const row of rows) {
    const existingRecipe = recipes.get(row.recipeId);

    if (existingRecipe) {
      existingRecipe.flavors.push({
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

export async function fetchMyBookmarks(userId: string): Promise<RecipeSearchResponse> {
  const result = await getPool().query<MyRecipeRow>(
    `
      SELECT
        r.id AS "recipeId",
        r.name AS "recipeName",
        f.id AS "flavorId",
        f.name AS "flavorName"
      FROM bookmarks b
      INNER JOIN recipes r
        ON r.id = b.recipe_id
      INNER JOIN recipe_flavors rf
        ON rf.recipe_id = r.id
      INNER JOIN flavors f
        ON f.id = rf.flavor_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC, r.id ASC, f.id ASC
    `,
    [userId]
  );

  return buildRecipeList(result.rows);
}

export async function fetchMyRecipes(userId: string): Promise<RecipeSearchResponse> {
  const result = await getPool().query<MyRecipeRow>(
    `
      SELECT
        r.id AS "recipeId",
        r.name AS "recipeName",
        f.id AS "flavorId",
        f.name AS "flavorName"
      FROM recipes r
      INNER JOIN recipe_flavors rf
        ON rf.recipe_id = r.id
      INNER JOIN flavors f
        ON f.id = rf.flavor_id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC, r.id ASC, f.id ASC
    `,
    [userId]
  );

  return buildRecipeList(result.rows);
}
