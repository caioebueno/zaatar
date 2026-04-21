import { Image } from "./file";
import { TPreparationStep } from "./station";

type TProduct = {
  id: string;
  name: string;
  visible?: boolean;
  photos?: Image[];
  price?: number | null;
  description?: string | null;
  categoryId?: string | null;
  categoryIndex?: number | null;
  comparedAtPrice?: number | null;
  modifierGroups?: TModifierGroup[];
  preparationStep?: TPreparationStep[];
  translations?: {
    [key: string]: {
      [key: string];
    };
  };
};

type TModifierGroup = {
  id: string;
  title: string;
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
export { TModifierGroup, TModifierGroupItem };
