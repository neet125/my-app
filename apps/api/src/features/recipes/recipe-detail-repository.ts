import { getPool } from "../../db/pool.js";
import type { RecipeDetailResponse } from "./recipe-search-types.js";

type RecipeDetailRow = {
  alcoholName: string | null;
  creatorName: string;
  flavorGram: number;
  flavorId: number;
  flavorName: string;
  hasAlcoholBottle: boolean;
  hasIceHose: boolean;
  memo: string | null;
  recipeId: number;
  recipeName: string;
  size: "short" | "regular" | "special";
};

type RecipeBookmarkRow = {
  isBookmarked: boolean;
};

export async function findRecipeDetail(
  recipeId: number,
  authUserId?: string
): Promise<RecipeDetailResponse | null> {
  const detailResult = await getPool().query<RecipeDetailRow>(
    `
      SELECT
        r.id AS "recipeId",
        r.name AS "recipeName",
        r.size AS "size",
        r.has_ice_hose AS "hasIceHose",
        r.has_alcohol_bottle AS "hasAlcoholBottle",
        r.memo AS "memo",
        u.name AS "creatorName",
        a.name AS "alcoholName",
        f.id AS "flavorId",
        f.name AS "flavorName",
        rf.gram AS "flavorGram"
      FROM recipes r
      INNER JOIN users u
        ON u.id = r.user_id
      INNER JOIN recipe_flavors rf
        ON rf.recipe_id = r.id
      INNER JOIN flavors f
        ON f.id = rf.flavor_id
      LEFT JOIN alcohols a
        ON a.id = r.alcohol_id
      WHERE r.id = $1
      ORDER BY f.id ASC
    `,
    [recipeId]
  );

  if (detailResult.rows.length === 0) {
    return null;
  }

  const [firstRow] = detailResult.rows;
  const baseResponse: RecipeDetailResponse = {
    alcohol_name: firstRow.alcoholName,
    creator_name: firstRow.creatorName,
    flavors: detailResult.rows.map((row: RecipeDetailRow) => ({
      gram: row.flavorGram,
      id: row.flavorId,
      name: row.flavorName
    })),
    has_alcohol_bottle: firstRow.hasAlcoholBottle,
    has_ice_hose: firstRow.hasIceHose,
    id: firstRow.recipeId,
    memo: firstRow.memo,
    name: firstRow.recipeName,
    size: firstRow.size
  };

  if (!authUserId) {
    return baseResponse;
  }

  const bookmarkResult = await getPool().query<RecipeBookmarkRow>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM bookmarks
        WHERE user_id = $1
          AND recipe_id = $2
      ) AS "isBookmarked"
    `,
    [authUserId, recipeId]
  );

  return {
    ...baseResponse,
    is_bookmarked: bookmarkResult.rows[0]?.isBookmarked ?? false
  };
}
