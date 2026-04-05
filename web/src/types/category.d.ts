import TProduct from "./product";

type TCategory = {
  id: string;
  title: string;
  translations?: {
    [key: string]: {
      [key: string]: string;
    };
  };
  products: TProduct[];
};

export default TCategory;
