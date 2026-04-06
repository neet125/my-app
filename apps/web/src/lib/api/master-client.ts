import type { AlcoholsResponse, FlavorsResponse } from "./master-types";
import { API_BASE_URL } from "../env";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}.`);
  }

  return (await response.json()) as T;
}

export function getFlavors() {
  return fetchJson<FlavorsResponse>("/flavors");
}

export function getAlcohols() {
  return fetchJson<AlcoholsResponse>("/alcohols");
}
