import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import TProduct, { TModifierGroupItem } from "../../src/types/product";
import formatCurrency from "@/utils/formatCurrecy";
import Button from "./Button";
import ProductImage from "./ProductImage";
import { FiArrowLeft, FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { useState } from "react";
import { TSelectedModifier } from "@/types/cart";

type TProductModal = {
  product: TProduct | null;
  onClose: () => void;
  onAdd: (
    productId: string,
    quantity: number,
    selectedModifiers: TSelectedModifier[],
    description?: string,
  ) => void;
  content: {
    [key: string]: string;
  };
  lg: string;
};

const ProductModal: React.FC<TProductModal> = ({
  product,
  onClose,
  onAdd,
  content,
  lg,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifier, setSelectedModifier] = useState<null | string>(null);
  const [modifiers, setModifiers] = useState<TSelectedModifier[]>([]);
  const [description, setDescription] = useState("");

  const handleConfirm = () => {
    if (!product) return;
    if (product.modifierGroups && product.modifierGroups.length > 0) {
      const modiferGroup = product.modifierGroups[0];
      setSelectedModifier(modiferGroup.id);
    } else {
      onAdd(
        product.id,
        quantity,
        [],
        description.length > 0 ? description : undefined,
      );
    }
  };

  const handleClose = () => {
    setQuantity(1);
    setDescription("");
    onClose();
  };

  const handleModifier = (modifier: TSelectedModifier) => {
    if (!product) return;
    onAdd(
      product.id,
      quantity,
      [modifier],
      description.length > 0 ? description : undefined,
    );
  };

  const productImageUrl = product?.photos?.[0]?.url ?? null;

  return (
    <Dialog open={product !== null} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="w-full h-full p-0 bg-foreground transition-all"
      >
        {product && (
          <div>
            <div className="flex flex-col lg:flex-row">
              <div className="lg:flex-1 lg:p-4">
              <DialogClose className="absolute top-4 left-4 p-3 rounded-full bg-background">
                <FiArrowLeft size={18} />
              </DialogClose>
              <ProductImage
                src={productImageUrl}
                alt={`${product.name} photo`}
                className="h-100 w-full object-cover bg-background lg:w-full lg:h-auto lg:rounded-xl"
                quality={85}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="pt-6 px-4 flex flex-col gap-3 leading-4 lg:flex-1 lg:pt-8">
              <span className="text-2xl font-bold">
                {product.translations
                  ? product.translations[lg] && product.translations[lg]["title"] || product.name
                  : product.name}
              </span>
              <p className="text-lightText text-sm">
                {" "}
                {product.translations
                  ?  product.translations[lg] &&  product.translations[lg]["description"] ||
                    product.description
                  : product.description}
              </p>
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
              <div className="flex flex-col gap-2 pt-3">
                <span className="font-semibold text-[16px]">
                  {content["comments"]}
                </span>
                <textarea
                  className="bg-background rounded-lg text-[16px] py-3 px-3 border-2 border-background transition focus:border-brandBackground focus:outline-0"
                  rows={4}
                  placeholder={content["optional"]}
                  name=""
                  id=""
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
            </div>
            </div>
            <div className="absolute bottom-0 py-5 px-4 bg-background w-full flex flex-row items-center justify-between lg:justify-end lg:gap-4">
              <QuantitySelector
                onChange={(value) => setQuantity(value)}
                value={quantity}
                noTrash
              />
              <Button
                onClick={() => handleConfirm()}
                className="text-[16px] font-bold bg-brandBackground py-3 px-8 leading-5 lg:px-12"
              >
                {content["add"]}
              </Button>
            </div>
          </div>
        )}
        <ModifierModal
          open={selectedModifier !== null}
          onOpenChange={(value) => value === false && setSelectedModifier(null)}
          product={product}
          modifierId={selectedModifier || undefined}
          onConfirm={handleModifier}
        />
      </DialogContent>
    </Dialog>
  );
};

type TModifierModal = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  modifierId?: string;
  product: TProduct | null;
  onConfirm: (value: TSelectedModifier) => void;
};

const ModifierModal: React.FC<TModifierModal> = ({
  onOpenChange,
  open,
  product,
  modifierId,
  onConfirm,
}) => {
  const [selectedItem, setSelectedItem] = useState<null | string>(null);

  const modifierGroup = product?.modifierGroups?.find(
    (item) => item.id === modifierId,
  );

  const handleConfirm = () => {
    if (!modifierId || !selectedItem) return;
    onConfirm({
      modifierId: modifierId,
      modifierItemId: selectedItem,
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full h-full flex flex-col p-0 bg-foreground transition-all"
      >
        <div className="py-8 flex flex-col items-center">
          <span className="text-[22px] font-bold">
            Do you want filled crust?
          </span>
        </div>
        <div className="flex-1 px-4">
          <div className="grid grid-cols-2 gap-3">
            {modifierGroup?.items.map((item) => (
              <ModifierItem
                key={item.id}
                modifierItem={item}
                active={selectedItem === item.id}
                onSelect={setSelectedItem}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-row h-fit py-6 px-4 gap-3">
          <Button className="bg-background! text-text! flex-1">
            No, Thanks
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-brandBackground py-2 flex-1"
          >
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

type TModifierItemProps = {
  modifierItem: TModifierGroupItem;
  onSelect: (value: string) => void;
  active: boolean;
};

const ModifierItem: React.FC<TModifierItemProps> = ({
  modifierItem,
  active,
  onSelect,
}) => {
  return (
    <div
      className={`${active ? "border-brandBackground" : "border-background"} transition bg-background border-2 rounded-xl px-4 py-3 flex flex-col items-center`}
      onClick={() => onSelect(modifierItem.id)}
    >
      <span className="font-bold text-[16px]">{modifierItem.name}</span>
      <span className="font-bold text-[20px]">
        {formatCurrency(modifierItem.price)}
      </span>
    </div>
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
  noTrash?: boolean;
};

function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  disabled = false,
  small,
  noTrash,
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
        {value === 1 ? (
          noTrash ? (
            <FiMinus size={small ? 18 : 22} />
          ) : (
            <FiTrash2 size={small ? 18 : 22} />
          )
        ) : (
          <FiMinus size={small ? 18 : 22} />
        )}
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
