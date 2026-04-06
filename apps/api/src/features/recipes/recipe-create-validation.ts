import { getPool } from "../../db/pool";
import type {
  FieldErrors,
  RecipeCreateBody,
  RecipeCreateFlavorInput,
  RecipeSize
} from "./recipe-create-types";

const SIZE_GRAMS: Record<RecipeSize, number> = {
  regular: 12,
  short: 8,
  special: 15
};

function addFieldError(fieldErrors: FieldErrors, field: keyof FieldErrors, message: string) {
  fieldErrors[field] ??= [];
  fieldErrors[field].push(message);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1;
}

function isRecipeSize(value: unknown): value is RecipeSize {
  return value === "short" || value === "regular" || value === "special";
}

export async function validateRecipeCreateBody(body: unknown) {
  const fieldErrors: FieldErrors = {};

  if (!body || typeof body !== "object") {
    addFieldError(fieldErrors, "name", "レシピ名を入力してください");
    addFieldError(fieldErrors, "size", "サイズを選択してください");
    addFieldError(fieldErrors, "flavors", "フレーバーを1つ以上選択してください");

    return {
      data: null,
      fieldErrors
    };
  }

  const input = body as Partial<RecipeCreateBody>;
  const normalizedName = typeof input.name === "string" ? input.name.trim() : "";
  const normalizedMemo =
    input.memo === null || input.memo === undefined
      ? null
      : typeof input.memo === "string"
        ? input.memo.trim()
        : input.memo;

  if (!normalizedName) {
    addFieldError(fieldErrors, "name", "レシピ名を入力してください");
  }

  if (!isRecipeSize(input.size)) {
    addFieldError(fieldErrors, "size", "サイズを選択してください");
  }

  const flavors = Array.isArray(input.flavors) ? input.flavors : null;

  if (!flavors || flavors.length === 0) {
    addFieldError(fieldErrors, "flavors", "フレーバーを1つ以上選択してください");
  } else {
    if (flavors.length > 4) {
      addFieldError(fieldErrors, "flavors", "フレーバーは4件以下で選択してください");
    }

    const seenFlavorIds = new Set<number>();

    for (const flavor of flavors) {
      const item = flavor as Partial<RecipeCreateFlavorInput>;
      const flavorId = item.flavor_id;

      if (!isPositiveInteger(flavorId)) {
        addFieldError(fieldErrors, "flavors", "フレーバーを1つ以上選択してください");
        continue;
      }

      if (seenFlavorIds.has(flavorId)) {
        addFieldError(fieldErrors, "flavors", "同じフレーバーは選択できません");
      }

      seenFlavorIds.add(flavorId);

      if (!isPositiveInteger(item.gram)) {
        addFieldError(fieldErrors, "flavors", "グラム数を入力してください");
      }
    }
  }

  if (normalizedMemo !== null && typeof normalizedMemo !== "string") {
    addFieldError(fieldErrors, "memo", "メモは30文字以内で入力してください");
  } else if (typeof normalizedMemo === "string" && normalizedMemo.length > 30) {
    addFieldError(fieldErrors, "memo", "メモは30文字以内で入力してください");
  }

  if (typeof input.has_alcohol_bottle !== "boolean") {
    addFieldError(fieldErrors, "has_alcohol_bottle", "入力内容を確認してください");
  }

  if (typeof input.has_ice_hose !== "boolean") {
    addFieldError(fieldErrors, "has_ice_hose", "入力内容を確認してください");
  }

  if (input.has_alcohol_bottle === true && !isPositiveInteger(input.alcohol_id)) {
    addFieldError(fieldErrors, "alcohol_id", "アルコールを選択してください");
  }

  if (input.has_alcohol_bottle === false && input.alcohol_id !== null) {
    addFieldError(fieldErrors, "alcohol_id", "アルコールを選択してください");
  }

  if (isRecipeSize(input.size) && flavors && flavors.length > 0) {
    const hasValidGramShape = flavors.every((flavor) => isPositiveInteger((flavor as Partial<RecipeCreateFlavorInput>).gram));

    if (hasValidGramShape) {
      const totalGram = flavors.reduce(
        (sum, flavor) => sum + (flavor as RecipeCreateFlavorInput).gram,
        0
      );

      if (totalGram !== SIZE_GRAMS[input.size]) {
        addFieldError(fieldErrors, "flavors", "グラム合計をサイズ規定値に合わせてください");
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !isRecipeSize(input.size) || !flavors) {
    return {
      data: null,
      fieldErrors
    };
  }

  const flavorIds = flavors.map((flavor) => (flavor as RecipeCreateFlavorInput).flavor_id);
  const flavorMasterResult = await getPool().query<{ id: number }>(
    "SELECT id FROM flavors WHERE id = ANY($1::bigint[])",
    [flavorIds]
  );
  const foundFlavorIds = new Set(flavorMasterResult.rows.map((row: { id: number }) => row.id));

  if (foundFlavorIds.size !== flavorIds.length) {
    addFieldError(fieldErrors, "flavors", "フレーバーを1つ以上選択してください");
  }

  if (input.has_alcohol_bottle === true && isPositiveInteger(input.alcohol_id)) {
    const alcoholResult = await getPool().query<{ id: number }>(
      "SELECT id FROM alcohols WHERE id = $1",
      [input.alcohol_id]
    );

    if (alcoholResult.rows.length === 0) {
      addFieldError(fieldErrors, "alcohol_id", "アルコールを選択してください");
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      data: null,
      fieldErrors
    };
  }

  return {
    data: {
      alcohol_id: input.has_alcohol_bottle ? (input.alcohol_id as number) : null,
      flavors: flavors as RecipeCreateFlavorInput[],
      has_alcohol_bottle: input.has_alcohol_bottle as boolean,
      has_ice_hose: input.has_ice_hose as boolean,
      memo: normalizedMemo,
      name: normalizedName,
      size: input.size
    } satisfies RecipeCreateBody,
    fieldErrors
  };
}
