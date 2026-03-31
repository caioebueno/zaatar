import { Image } from "./file";
import { TPreparationStep } from "./station";

type TProduct = {
  id: string;
  name: string;
  photos?: Image[];
  price?: number;
  description?: string;
  categoryId?: string;
  comparedAtPrice?: number;
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
  items: TModifierGroupItem[];
};

type TModifierGroupItem = {
  id: string;
  name: string;
  price: number;
};

export default TProduct;
export { TModifierGroup, TModifierGroupItem };
