import type { FlavorItem } from "./api/master-types";

const CATEGORY_ORDER = [
  "スイーツ系",
  "フルーツ系",
  "フラワー系",
  "コーヒー/紅茶系",
  "ミント系",
  "カクテル系",
  "スパイス系",
  "数量限定",
  "ノンニコチン"
] as const;

type FlavorGroup = {
  category: string;
  items: FlavorItem[];
};

export function groupFlavorsByCategory(flavors: FlavorItem[]): FlavorGroup[] {
  const groupMap = new Map<string, FlavorItem[]>();

  for (const flavor of flavors) {
    const category = flavor.category?.trim() || "その他";
    const currentItems = groupMap.get(category) ?? [];

    currentItems.push(flavor);
    groupMap.set(category, currentItems);
  }

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((category) => groupMap.has(category)),
    ...[...groupMap.keys()]
      .filter((category) => !CATEGORY_ORDER.includes(category as (typeof CATEGORY_ORDER)[number]))
      .sort((left, right) => left.localeCompare(right, "ja"))
  ];

  return orderedCategories.map((category) => ({
    category,
    items: [...(groupMap.get(category) ?? [])].sort((left, right) => {
      if (left.sort_order !== right.sort_order) {
        return left.sort_order - right.sort_order;
      }

      return left.name.localeCompare(right.name, "ja");
    })
  }));
}
