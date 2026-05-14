export type ProductManagerTranslations = Record<string, Record<string, string>>;

export type ProductManagerModifierGroupItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  translations: ProductManagerTranslations | null;
  photoUrl: string | null;
};

export type ProductManagerModifierGroup = {
  id: string;
  title: string;
  required: boolean;
  type: "MULTI" | "SINGLE" | null;
  minSelection: number | null;
  maxSelection: number | null;
  translations: ProductManagerTranslations | null;
  items: ProductManagerModifierGroupItem[];
};

export type ProductManagerProductItemType = "PRODUCT" | "COMBO";

export type ProductManagerComboItem = {
  productId: string;
  productName: string;
  quantity: number;
};

export type ProductManagerFixedComboProduct = {
  productId: string;
  productName: string;
  quantity: number;
};

export type ProductManagerComboSlotOption = {
  productId: string;
  productName: string;
  extraPrice: number;
  sortIndex: number | null;
};

export type ProductManagerComboSlot = {
  id: string;
  name: string;
  translations: ProductManagerTranslations | null;
  minSelect: number;
  maxSelect: number;
  allowDuplicates: boolean;
  sortIndex: number | null;
  options: ProductManagerComboSlotOption[];
};

export type ProductManagerProduct = {
  id: string;
  itemType: ProductManagerProductItemType;
  name: string;
  visible: boolean;
  description: string | null;
  price: number | null;
  comparedAtPrice: number | null;
  categoryId: string | null;
  categoryIndex: number | null;
  createdAt: string;
  translations: ProductManagerTranslations | null;
  photoUrls: string[];
  mainPhotoUrl: string | null;
  modifierGroups: ProductManagerModifierGroup[];
  products: ProductManagerFixedComboProduct[];
  comboItems: ProductManagerComboItem[];
  comboSlots: ProductManagerComboSlot[];
};

export type ProductManagerCategory = {
  id: string;
  title: string;
  menuIndex: number | null;
  products: ProductManagerProduct[];
};

export type ProductManagerListResponse = {
  categories: ProductManagerCategory[];
  uncategorized: ProductManagerProduct[];
  lookupModifierGroups: ProductManagerModifierGroup[];
};
