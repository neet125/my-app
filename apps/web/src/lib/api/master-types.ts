export type MasterItem = {
  id: number;
  name: string;
};

export type FlavorItem = MasterItem & {
  category: string | null;
  sort_order: number;
};

export type FlavorsResponse = FlavorItem[];

export type AlcoholsResponse = MasterItem[];
