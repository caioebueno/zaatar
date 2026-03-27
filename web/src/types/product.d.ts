import { Image } from "./file";

type TProduct = {
  id: string;
  name: string;
  photos?: Image[];
  price?: number;
  description?: string;
  comparedAtPrice?: number;
};

export default TProduct;
