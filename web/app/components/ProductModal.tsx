import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import TProduct, { TModifierGroupItem } from "../../src/types/product";
import formatCurrency from "@/utils/formatCurrecy";
import Button from "./Button";
import ProductImage from "./ProductImage";
import { FiArrowLeft, FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { useMemo, useState } from "react";
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
  const [activeModifierGroupIndex, setActiveModifierGroupIndex] = useState<
    number | null
  >(null);
  const [pendingModifiers, setPendingModifiers] = useState<TSelectedModifier[]>(
    [],
  );
  const [description, setDescription] = useState("");

  const orderedModifierGroups = useMemo(
    () =>
      [...(product?.modifierGroups ?? [])].sort((a, b) => {
        if (a.required === b.required) return 0;
        return a.required ? -1 : 1;
      }),
    [product?.modifierGroups],
  );

  const handleConfirm = () => {
    if (!product) return;
    if (orderedModifierGroups.length > 0) {
      setPendingModifiers([]);
      setActiveModifierGroupIndex(0);
    } else {
      setPendingModifiers([]);
      setActiveModifierGroupIndex(null);
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
    setActiveModifierGroupIndex(null);
    setPendingModifiers([]);
    onClose();
  };

  const handleModifier = (groupModifiers: TSelectedModifier[]) => {
    if (!product) return;
    if (activeModifierGroupIndex === null) return;

    const nextModifiers = [...pendingModifiers, ...groupModifiers];
    const nextGroupIndex = activeModifierGroupIndex + 1;

    if (nextGroupIndex < orderedModifierGroups.length) {
      setPendingModifiers(nextModifiers);
      setActiveModifierGroupIndex(nextGroupIndex);
      return;
    }

    setPendingModifiers([]);
    setActiveModifierGroupIndex(null);
    onAdd(
      product.id,
      quantity,
      nextModifiers,
      description.length > 0 ? description : undefined,
    );
  };

  const productImageUrl = product?.photos?.[0]?.url ?? null;
  const isProductModalOpen = product !== null;
  const isModifierModalOpen =
    isProductModalOpen && activeModifierGroupIndex !== null;

  return (
    <Dialog
      open={isProductModalOpen}
      onOpenChange={(value) => {
        if (!value) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-full h-full p-0 bg-foreground transition-all"
      >
        <DialogTitle className="sr-only">
          {product ? product.name : "Product details"}
        </DialogTitle>
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
          key={orderedModifierGroups[activeModifierGroupIndex ?? -1]?.id || "none"}
          open={isModifierModalOpen}
          onOpenChange={(value) => {
            if (value === false) {
              setActiveModifierGroupIndex(null);
              setPendingModifiers([]);
            }
          }}
          product={product}
          modifierId={
            activeModifierGroupIndex !== null
              ? orderedModifierGroups[activeModifierGroupIndex]?.id
              : undefined
          }
          lg={lg}
          hasNextModifierGroup={
            activeModifierGroupIndex !== null &&
            activeModifierGroupIndex < orderedModifierGroups.length - 1
          }
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
  lg: string;
  hasNextModifierGroup?: boolean;
  product: TProduct | null;
  onConfirm: (value: TSelectedModifier[]) => void;
};

const ModifierModal: React.FC<TModifierModal> = ({
  onOpenChange,
  open,
  product,
  modifierId,
  lg,
  hasNextModifierGroup,
  onConfirm,
}) => {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const modifierGroup = product?.modifierGroups?.find(
    (item) => item.id === modifierId,
  );
  const isMulti = modifierGroup?.type === "MULTI";
  const minSelection = modifierGroup?.minSelection ?? (modifierGroup?.required ? 1 : 0);
  const maxSelection = isMulti ? modifierGroup?.maxSelection : 1;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedItemIds([]);
    }
    onOpenChange(nextOpen);
  };

  const toggleSelectedItem = (itemId: string) => {
    setSelectedItemIds((currentIds) => {
      const isSelected = currentIds.includes(itemId);

      if (isMulti) {
        if (isSelected) {
          return currentIds.filter((id) => id !== itemId);
        }

        if (
          typeof maxSelection === "number" &&
          maxSelection > 0 &&
          currentIds.length >= maxSelection
        ) {
          return currentIds;
        }

        return [...currentIds, itemId];
      }

      if (isSelected) {
        return [];
      }

      return [itemId];
    });
  };

  const handleConfirm = () => {
    if (!modifierId) return;
    if (selectedItemIds.length < minSelection) return;
    onConfirm(
      selectedItemIds.map((modifierItemId) => ({
        modifierId,
        modifierItemId,
      })),
    );
  };

  const handleSkip = () => {
    if (minSelection > 0) return;
    onConfirm([]);
  };

  const reachedMaxSelection =
    typeof maxSelection === "number" &&
    maxSelection > 0 &&
    selectedItemIds.length >= maxSelection;

  const canConfirm = selectedItemIds.length >= minSelection;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full h-full min-h-0 flex flex-col p-0 bg-foreground transition-all gap-0"
      >
        <DialogTitle className="sr-only">
          {modifierGroup?.title || "Modifier options"}
        </DialogTitle>
        <div className="py-8 flex flex-col items-center">
          <span className="text-[22px] font-bold">
            {modifierGroup?.title || "Select options"}
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
            {modifierGroup?.items.map((item) => (
              <ModifierItem
                key={item.id}
                modifierItem={item}
                active={selectedItemIds.includes(item.id)}
                lg={lg}
                disabled={reachedMaxSelection && !selectedItemIds.includes(item.id)}
                onSelect={toggleSelectedItem}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-row h-fit py-6 px-4 gap-3">
          {!modifierGroup?.required && (
            <Button
              className="bg-background! text-text! flex-1 disabled:opacity-50"
              onClick={handleSkip}
            >
              No, Thanks
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="bg-brandBackground py-2 flex-1 disabled:opacity-50"
          >
            {hasNextModifierGroup ? "Next" : "Add"}
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
  disabled?: boolean;
  lg: string;
};

const ModifierItem: React.FC<TModifierItemProps> = ({
  modifierItem,
  active,
  disabled,
  lg,
  onSelect,
}) => {
  const label =
    modifierItem.translations?.[lg]?.title ||
    modifierItem.translations?.["en"]?.title ||
    modifierItem.name;

  return (
    <div
      className={`${active ? "border-brandBackground" : "border-background"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} transition bg-background border-2 rounded-xl px-4 py-3 flex flex-col items-center gap-2`}
      onClick={() => !disabled && onSelect(modifierItem.id)}
    >
      {modifierItem.photo?.url && (
        <ProductImage
          src={modifierItem.photo.url}
          alt={`${label} photo`}
          className="w-full rounded-lg object-cover bg-white"
          quality={80}
          sizes="80px"
        />
      )}
      <span className="font-bold text-[16px] text-center">{label}</span>
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
