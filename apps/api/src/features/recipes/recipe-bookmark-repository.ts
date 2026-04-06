import { getPool } from "../../db/pool";

type ExistsRow = {
  exists: boolean;
};

type InsertBookmarkRow = {
  id: string;
};

type DeleteBookmarkRow = {
  id: string;
};

export async function recipeExists(recipeId: number) {
  const result = await getPool().query<ExistsRow>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM recipes
        WHERE id = $1
      ) AS "exists"
    `,
    [recipeId]
  );

  return result.rows[0]?.exists ?? false;
}

export async function createBookmark(input: { recipeId: number; userId: string }) {
  const result = await getPool().query<InsertBookmarkRow>(
    `
      INSERT INTO bookmarks (user_id, recipe_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, recipe_id) DO NOTHING
      RETURNING id
    `,
    [input.userId, input.recipeId]
  );

  return result.rows[0] ?? null;
}

export async function deleteBookmark(input: { recipeId: number; userId: string }) {
  const result = await getPool().query<DeleteBookmarkRow>(
    `
      DELETE FROM bookmarks
      WHERE user_id = $1
        AND recipe_id = $2
      RETURNING id
    `,
    [input.userId, input.recipeId]
  );

  return result.rows[0] ?? null;
}
