export type RecipeSearchFlavor = {
  id: number;
  name: string;
};

export type RecipeSearchItem = {
  id: number;
  name: string;
  flavors: RecipeSearchFlavor[];
};

export type RecipeSearchResponse = RecipeSearchItem[];

export type RecipeDetailFlavor = {
  gram: number;
  id: number;
  name: string;
};

type RecipeDetailBase = {
  alcohol_name: string | null;
  creator_name: string;
  flavors: RecipeDetailFlavor[];
  has_alcohol_bottle: boolean;
  has_ice_hose: boolean;
  id: number;
  memo: string | null;
  name: string;
  size: "short" | "regular" | "special";
};

export type PublicRecipeDetailResponse = RecipeDetailBase;

export type AuthenticatedRecipeDetailResponse = RecipeDetailBase & {
  is_bookmarked: boolean;
};

export type RecipeDetailResponse =
  | PublicRecipeDetailResponse
  | AuthenticatedRecipeDetailResponse;
