import { Image } from "./file";
import { TPreparationStep } from "./station";

type TProduct = {
  id: string;
  itemType?: "PRODUCT" | "COMBO";
  name: string;
  visible?: boolean;
  photos?: Image[];
  price?: number | null;
  description?: string | null;
  categoryId?: string | null;
  categoryIndex?: number | null;
  comparedAtPrice?: number | null;
  modifierGroups?: TModifierGroup[];
  comboSlots?: TComboSlot[];
  preparationStep?: TPreparationStep[];
  translations?: {
    [key: string]: {
      [key: string];
    };
  };
};

type TComboSlot = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  allowDuplicates: boolean;
  sortIndex?: number | null;
  options: TComboSlotOption[];
};

type TComboSlotOption = {
  id: string;
  productId: string;
  productName: string;
  productPhotoUrl?: string;
  extraPrice: number;
  sortIndex?: number | null;
};

type TModifierGroup = {
  id: string;
  title: string;
  translations?: {
    [key: string]: {
      [key: string]: string;
    };
  };
  required: boolean;
  type?: "MULTI" | "SINGLE" | null;
  minSelection?: number | null;
  maxSelection?: number | null;
  items: TModifierGroupItem[];
};

type TModifierGroupItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  photo?: {
    id: string;
    url: string;
  };
  translations?: {
    [key: string]: {
      [key: string]: string;
    };
  };
};

export default TProduct;
export { TModifierGroup, TModifierGroupItem, TComboSlot, TComboSlotOption };
