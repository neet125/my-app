import type { RecipeDetailResponse, RecipeSearchResponse } from "./recipe-types";
import { API_BASE_URL } from "../env";

export class RecipeDetailNotFoundError extends Error {
  constructor() {
    super("Recipe detail was not found.");
    this.name = "RecipeDetailNotFoundError";
  }
}

export class RecipeBookmarkConflictError extends Error {
  constructor() {
    super("Recipe bookmark already exists.");
    this.name = "RecipeBookmarkConflictError";
  }
}

export class RecipeDeleteForbiddenError extends Error {
  constructor() {
    super("Recipe can only be deleted by the owner.");
    this.name = "RecipeDeleteForbiddenError";
  }
}

export async function searchRecipesByFlavorId(flavorId: number) {
  const response = await fetch(
    `${API_BASE_URL}/recipes/search?flavor_id=${encodeURIComponent(String(flavorId))}`,
    {
      credentials: "include"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch recipe search results.");
  }

  return (await response.json()) as RecipeSearchResponse;
}

export async function getRecipeDetail(recipeId: number) {
  const response = await fetch(
    `${API_BASE_URL}/recipes/${encodeURIComponent(recipeId)}`,
    {
      credentials: "include"
    }
  );

  if (response.status === 404) {
    throw new RecipeDetailNotFoundError();
  }

  if (!response.ok) {
    throw new Error("Failed to fetch recipe detail.");
  }

  return (await response.json()) as RecipeDetailResponse;
}

export async function bookmarkRecipe(recipeId: number) {
  const response = await fetch(
    `${API_BASE_URL}/recipes/${encodeURIComponent(recipeId)}/bookmark`,
    {
      credentials: "include",
      method: "POST"
    }
  );

  if (response.status === 404) {
    throw new RecipeDetailNotFoundError();
  }

  if (response.status === 409) {
    throw new RecipeBookmarkConflictError();
  }

  if (!response.ok) {
    throw new Error("Failed to bookmark recipe.");
  }
}

export async function unbookmarkRecipe(recipeId: number) {
  const response = await fetch(
    `${API_BASE_URL}/recipes/${encodeURIComponent(recipeId)}/bookmark`,
    {
      credentials: "include",
      method: "DELETE"
    }
  );

  if (response.status === 404) {
    throw new RecipeDetailNotFoundError();
  }

  if (!response.ok) {
    throw new Error("Failed to unbookmark recipe.");
  }
}

export async function getMyBookmarks() {
  const response = await fetch(`${API_BASE_URL}/me/bookmarks`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Failed to fetch bookmarked recipes.");
  }

  return (await response.json()) as RecipeSearchResponse;
}

export async function getMyRecipes() {
  const response = await fetch(`${API_BASE_URL}/me/recipes`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Failed to fetch my recipes.");
  }

  return (await response.json()) as RecipeSearchResponse;
}

export async function deleteRecipe(recipeId: number) {
  const response = await fetch(`${API_BASE_URL}/recipes/${encodeURIComponent(recipeId)}`, {
    credentials: "include",
    method: "DELETE"
  });

  if (response.status === 404) {
    throw new RecipeDetailNotFoundError();
  }

  if (response.status === 403) {
    throw new RecipeDeleteForbiddenError();
  }

  if (!response.ok) {
    throw new Error("Failed to delete recipe.");
  }
}
