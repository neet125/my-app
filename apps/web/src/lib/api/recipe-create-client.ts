import type {
  RecipeCreateBody,
  RecipeCreateResponse,
  RecipeCreateValidationErrorResponse
} from "./recipe-create-types";
import { API_BASE_URL } from "../env";

export class RecipeCreateValidationError extends Error {
  fieldErrors: RecipeCreateValidationErrorResponse["field_errors"];

  constructor(payload: RecipeCreateValidationErrorResponse) {
    super(payload.message);
    this.name = "RecipeCreateValidationError";
    this.fieldErrors = payload.field_errors;
  }
}

export async function createRecipe(body: RecipeCreateBody) {
  const response = await fetch(`${API_BASE_URL}/recipes`, {
    body: JSON.stringify(body),
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (response.status === 422) {
    throw new RecipeCreateValidationError(
      (await response.json()) as RecipeCreateValidationErrorResponse
    );
  }

  if (!response.ok) {
    throw new Error("Failed to create recipe.");
  }

  return (await response.json()) as RecipeCreateResponse;
}
