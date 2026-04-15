import TProduct from "./product";

type TCategory = {
  id: string;
  title: string;
  menuIndex?: number | null;
  translations?: {
    [key: string]: {
      [key: string]: string;
    };
  };
  products: TProduct[];
};

export default TCategory;
