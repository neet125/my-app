import { getPool } from "../../db/pool";
import type { AlcoholsResponse, FlavorItem, FlavorsResponse, MasterItem } from "./master-types";

async function fetchAlcoholMasterItems(): Promise<MasterItem[]> {
  const result = await getPool().query<MasterItem>(
    "SELECT id, name FROM alcohols ORDER BY id ASC"
  );

  return result.rows;
}

export async function fetchFlavors(): Promise<FlavorsResponse> {
  const result = await getPool().query<FlavorItem>(
    `
      SELECT
        id,
        name,
        category,
        sort_order
      FROM flavors
      ORDER BY category ASC NULLS LAST, sort_order ASC, id ASC
    `
  );

  return result.rows;
}

export async function fetchAlcohols(): Promise<AlcoholsResponse> {
  return fetchAlcoholMasterItems();
}
