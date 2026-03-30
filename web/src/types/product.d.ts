import { Image } from "./file";

type TProduct = {
  id: string;
  name: string;
  photos?: Image[];
  price?: number;
  description?: string;
  comparedAtPrice?: number;
  modifierGroups?: TModifierGroup[];
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
