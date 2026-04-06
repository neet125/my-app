import type { PoolClient } from "pg";
import { getPool } from "../../db/pool";

type RecipeOwnerRow = {
  userId: string;
};

type CascadeCountRow = {
  count: string;
};

type DeleteRecipeResult =
  | {
      status: "forbidden";
    }
  | {
      status: "not_found";
    }
  | {
      status: "deleted";
    };

export async function deleteRecipeByOwner(input: {
  recipeId: number;
  userId: string;
}): Promise<DeleteRecipeResult> {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    const recipeOwner = await client.query<RecipeOwnerRow>(
      `
        SELECT user_id AS "userId"
        FROM recipes
        WHERE id = $1
        FOR UPDATE
      `,
      [input.recipeId]
    );

    if (recipeOwner.rows.length === 0) {
      await client.query("ROLLBACK");
      return { status: "not_found" };
    }

    if (recipeOwner.rows[0].userId !== input.userId) {
      await client.query("ROLLBACK");
      return { status: "forbidden" };
    }

    await client.query("DELETE FROM recipes WHERE id = $1", [input.recipeId]);

    await assertCascadeDeleted(client, "recipe_flavors", input.recipeId);
    await assertCascadeDeleted(client, "bookmarks", input.recipeId);

    await client.query("COMMIT");
    return { status: "deleted" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function assertCascadeDeleted(
  client: PoolClient,
  tableName: "bookmarks" | "recipe_flavors",
  recipeId: number
) {
  const result = await client.query<CascadeCountRow>(
    `SELECT COUNT(*) AS "count" FROM ${tableName} WHERE recipe_id = $1`,
    [recipeId]
  );

  if (Number(result.rows[0]?.count ?? 0) !== 0) {
    throw new Error(`Cascade delete verification failed for ${tableName}.`);
  }
}
