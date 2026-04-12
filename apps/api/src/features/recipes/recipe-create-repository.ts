import type { PoolClient } from "pg";
import { getPool } from "../../db/pool.js";
import type { RecipeCreateBody } from "./recipe-create-types.js";

export async function createRecipeWithFlavors(input: {
  recipe: RecipeCreateBody;
  userId: string;
}) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const recipeId = await insertRecipe(client, input);
    await insertRecipeFlavors(client, recipeId, input.recipe.flavors);
    await client.query("COMMIT");

    return {
      id: recipeId
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function insertRecipe(
  client: PoolClient,
  input: {
    recipe: RecipeCreateBody;
    userId: string;
  }
) {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO recipes (
        name,
        size,
        has_ice_hose,
        has_alcohol_bottle,
        alcohol_id,
        memo,
        user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `,
    [
      input.recipe.name,
      input.recipe.size,
      input.recipe.has_ice_hose,
      input.recipe.has_alcohol_bottle,
      input.recipe.alcohol_id,
      input.recipe.memo,
      input.userId
    ]
  );

  return result.rows[0].id;
}

async function insertRecipeFlavors(
  client: PoolClient,
  recipeId: string,
  flavors: RecipeCreateBody["flavors"]
) {
  for (const flavor of flavors) {
    await client.query(
      `
        INSERT INTO recipe_flavors (recipe_id, flavor_id, gram)
        VALUES ($1, $2, $3)
      `,
      [recipeId, flavor.flavor_id, flavor.gram]
    );
  }
}
