import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import TProduct from "../../src/types/product";
import formatCurrency from "@/utils/formatCurrecy";
import Button from "./Button";
import { FiArrowLeft, FiMinus, FiPlus } from "react-icons/fi";
import { useState } from "react";

type TProductModal = {
  product: TProduct | null;
  onClose: () => void;
  onAdd: (productId: string, quantity: number) => void;
};

const ProductModal: React.FC<TProductModal> = ({ product, onClose, onAdd }) => {
  const [quantity, setQuantity] = useState(1);

  return (
    <Dialog open={product !== null} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="w-full h-full p-0 bg-foreground transition-all"
      >
        {product && (
          <div>
            <div>
              <DialogClose className="absolute top-4 left-4 p-3 rounded-full bg-background">
                <FiArrowLeft size={18} />
              </DialogClose>
              {product.photos && product.photos[0] && (
                <img
                  src={product.photos[0]?.url}
                  alt={`${product.name} photo`}
                  className="h-100 object-cover"
                />
              )}
            </div>
            <div className="pt-6 px-4 flex flex-col gap-3 leading-4">
              <span className="text-2xl font-bold">{product.name}</span>
              <p className="text-lightText ">{product.description}</p>
              <div className="flex flex-row gap-2 text-[20px]">
                {product.price && (
                  <span className="font-extrabold">
                    {formatCurrency(product.price)}
                  </span>
                )}
                {product.comparedAtPrice && (
                  <span className="font-semibold line-through">
                    {formatCurrency(product.comparedAtPrice)}
                  </span>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 py-5 px-4 bg-background w-full flex flex-row items-center justify-between">
              <QuantitySelector
                onChange={(value) => setQuantity(value)}
                value={quantity}
              />
              <Button
                onClick={() => onAdd(product.id, quantity)}
                className="text-[16px] font-bold bg-brandBackground py-3 px-8 leading-5"
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  small?: boolean;
};

function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  disabled = false,
  small,
}: QuantitySelectorProps) {
  const decrease = () => {
    const nextValue = value - step;
    if (nextValue < min) return;
    onChange(nextValue);
  };

  const increase = () => {
    const nextValue = value + step;
    if (typeof max === "number" && nextValue > max) return;
    onChange(nextValue);
  };

  return (
    <div className="inline-flex items-center">
      <button
        type="button"
        onClick={decrease}
        disabled={disabled || value <= min}
        className={`flex ${small ? "p-1 bg-transparent" : "py-2.5 px-3.5 bg-brandBackground text-white"} rounded-xl  items-center justify-center text-lg disabled:opacity-40`}
      >
        <FiMinus size={small ? 18 : 22} />
      </button>

      <span
        className={`${small ? "min-w-6" : "min-w-10"} text-center text-lg font-medium`}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={increase}
        disabled={disabled || (typeof max === "number" && value >= max)}
        className={`flex ${small ? "p-1 bg-transparent" : "py-2.5 px-3.5 bg-brandBackground text-white"} rounded-xl items-center justify-center text-lg disabled:opacity-40`}
      >
        <FiPlus size={small ? 18 : 22} />
      </button>
    </div>
  );
}

export default ProductModal;
export { QuantitySelector };
