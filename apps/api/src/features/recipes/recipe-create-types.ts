export type RecipeSize = "short" | "regular" | "special";

export type RecipeCreateFlavorInput = {
  flavor_id: number;
  gram: number;
};

export type RecipeCreateBody = {
  alcohol_id: number | null;
  flavors: RecipeCreateFlavorInput[];
  has_alcohol_bottle: boolean;
  has_ice_hose: boolean;
  memo: string | null;
  name: string;
  size: RecipeSize;
};

export type RecipeCreateResponse = {
  id: number;
};

export type FieldErrors = Partial<Record<
  | "alcohol_id"
  | "flavors"
  | "has_alcohol_bottle"
  | "has_ice_hose"
  | "memo"
  | "name"
  | "size",
  string[]
>>;

export type ValidationErrorResponse = {
  field_errors: FieldErrors;
  message: string;
};
