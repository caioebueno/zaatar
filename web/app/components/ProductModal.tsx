import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import TProduct, {
  TComboSlot,
  TComboSlotOption,
  TModifierGroupItem,
} from "../../src/types/product";
import formatCurrency from "@/utils/formatCurrecy";
import Button from "./Button";
import ProductImage from "./ProductImage";
import { FiArrowLeft, FiMinus, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";
import { TSelectedComboSlotOption, TSelectedModifier } from "@/types/cart";
import { FiAlertCircle } from "react-icons/fi";

type TProductModal = {
  product: TProduct | null;
  isExclusiveDeal?: boolean;
  onClose: () => void;
  onAdd: (
    productId: string,
    quantity: number,
    selectedModifiers: TSelectedModifier[],
    selectedComboSelections: TSelectedComboSlotOption[],
    description?: string,
  ) => void;
  content: {
    [key: string]: string;
  };
  lg: string;
};

const resolveModifierGroupTitle = (
  modifierGroup: NonNullable<TProduct["modifierGroups"]>[number] | undefined,
  lg: string,
) => {
  const localizedTranslation = modifierGroup?.translations?.[lg];
  const englishTranslation = modifierGroup?.translations?.["en"];

  const localizedTitle =
    localizedTranslation?.title ||
    localizedTranslation?.name ||
    (localizedTranslation
      ? Object.values(localizedTranslation).find(
          (value) => typeof value === "string" && value.trim().length > 0,
        )
      : undefined);
  const englishTitle =
    englishTranslation?.title ||
    englishTranslation?.name ||
    (englishTranslation
      ? Object.values(englishTranslation).find(
          (value) => typeof value === "string" && value.trim().length > 0,
        )
      : undefined);

  return localizedTitle || englishTitle || modifierGroup?.title || "Select options";
};

const resolveComboSlotTitle = (
  comboSlot: TComboSlot | undefined,
  index: number,
  lg: string,
) =>
  comboSlot?.translations?.[lg]?.title ||
  comboSlot?.translations?.["en"]?.title ||
  comboSlot?.name?.trim() ||
  `Select option ${index + 1}`;

const resolveComboOptionTitle = (option: TComboSlotOption | undefined, lg: string) =>
  option?.productTranslations?.[lg]?.title ||
  option?.productTranslations?.["en"]?.title ||
  option?.productName ||
  "Selected option";

const sortComboSelections = (selections: TSelectedComboSlotOption[]) =>
  [...selections].sort((a, b) => {
    const aKey = `${a.slotId}:${a.optionProductId}`;
    const bKey = `${b.slotId}:${b.optionProductId}`;
    return aKey.localeCompare(bKey);
  });

const isSameComboSelection = (
  left: TSelectedComboSlotOption[],
  right: TSelectedComboSlotOption[],
) => {
  const sortedLeft = sortComboSelections(left);
  const sortedRight = sortComboSelections(right);

  if (sortedLeft.length !== sortedRight.length) return false;

  return sortedLeft.every((item, index) => {
    const other = sortedRight[index];
    return (
      item.slotId === other.slotId &&
      item.optionProductId === other.optionProductId &&
      item.quantity === other.quantity &&
      (item.extraPrice ?? 0) === (other.extraPrice ?? 0)
    );
  });
};

const ProductModal: React.FC<TProductModal> = ({
  product,
  isExclusiveDeal = false,
  onClose,
  onAdd,
  content,
  lg,
}) => {
  const exclusiveDealDisclaimerByLocale: Record<string, string> = {
    en: "Exclusive deal. Does not count toward progressive discount.",
    pt: "Oferta exclusiva. Nao conta para desconto progressivo.",
    es: "Oferta exclusiva. No cuenta para descuento progresivo.",
  };
  const exclusiveDealDisclaimer =
    exclusiveDealDisclaimerByLocale[lg] ?? exclusiveDealDisclaimerByLocale.en;

  const [quantity, setQuantity] = useState(1);
  const [activeModifierGroupIndex, setActiveModifierGroupIndex] = useState<
    number | null
  >(null);
  const [pendingModifiers, setPendingModifiers] = useState<TSelectedModifier[]>(
    [],
  );
  const [selectedComboSelections, setSelectedComboSelections] = useState<
    TSelectedComboSlotOption[]
  >([]);
  const [activeComboSlotIndex, setActiveComboSlotIndex] = useState<number | null>(
    null,
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

  const orderedComboSlots = useMemo(
    () =>
      [...(product?.comboSlots ?? [])].sort((a, b) => {
        const leftIndex = a.sortIndex ?? Number.MAX_SAFE_INTEGER;
        const rightIndex = b.sortIndex ?? Number.MAX_SAFE_INTEGER;

        if (leftIndex !== rightIndex) return leftIndex - rightIndex;
        return a.id.localeCompare(b.id);
      }),
    [product?.comboSlots],
  );

  const selectionCountBySlotId = useMemo(() => {
    const selectionMap = new Map<string, number>();

    for (const selection of selectedComboSelections) {
      const currentCount = selectionMap.get(selection.slotId) ?? 0;
      selectionMap.set(selection.slotId, currentCount + selection.quantity);
    }

    return selectionMap;
  }, [selectedComboSelections]);

  const missingRequiredComboSlotIndex = useMemo(() => {
    for (let index = 0; index < orderedComboSlots.length; index += 1) {
      const slot = orderedComboSlots[index];
      const selectedCount = selectionCountBySlotId.get(slot.id) ?? 0;
      const requiredCount = Math.max(0, slot.minSelect ?? 0);

      if (selectedCount < requiredCount) {
        return index;
      }
    }

    return -1;
  }, [orderedComboSlots, selectionCountBySlotId]);

  const handleConfirm = () => {
    if (!product) return;

    if (product.itemType === "COMBO" && orderedComboSlots.length > 0) {
      if (missingRequiredComboSlotIndex >= 0) {
        setActiveComboSlotIndex(missingRequiredComboSlotIndex);
        return;
      }
    }

    if (orderedModifierGroups.length > 0) {
      setPendingModifiers([]);
      setActiveModifierGroupIndex(0);
    } else {
      setPendingModifiers([]);
      setActiveModifierGroupIndex(null);
      setActiveComboSlotIndex(null);
      onAdd(
        product.id,
        quantity,
        [],
        selectedComboSelections,
        description.length > 0 ? description : undefined,
      );
    }
  };

  const handleClose = () => {
    setQuantity(1);
    setDescription("");
    setActiveModifierGroupIndex(null);
    setPendingModifiers([]);
    setSelectedComboSelections([]);
    setActiveComboSlotIndex(null);
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
      selectedComboSelections,
      description.length > 0 ? description : undefined,
    );
  };

  const handleSaveComboSlotSelections = (
    slot: TComboSlot,
    selections: TSelectedComboSlotOption[],
  ) => {
    setSelectedComboSelections((currentSelections) => {
      const remainingSelections = currentSelections.filter(
        (selection) => selection.slotId !== slot.id,
      );
      const nextSelections = [...remainingSelections, ...selections];

      if (isSameComboSelection(currentSelections, nextSelections)) {
        return currentSelections;
      }

      return nextSelections;
    });
    setActiveComboSlotIndex(null);
  };

  const productImageUrl = product?.photos?.[0]?.url ?? null;
  const productDescription = product
    ? product.translations
      ? product.translations[lg] && product.translations[lg]["description"]
        ? product.translations[lg]["description"]
        : product.description
      : product.description
    : null;
  const hasProductDescription =
    typeof productDescription === "string" && productDescription.trim().length > 0;
  const isProductModalOpen = product !== null;
  const isModifierModalOpen =
    isProductModalOpen && activeModifierGroupIndex !== null;
  const isComboSlotModalOpen = isProductModalOpen && activeComboSlotIndex !== null;

  return (
    <Dialog
      open={isProductModalOpen}
      onOpenChange={(value) => {
        if (!value) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="!top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !max-w-none !h-[100svh] !max-h-[100svh] !p-0 !gap-0 bg-foreground transition-all overflow-hidden rounded-none"
      >
        <DialogTitle className="sr-only">
          {product ? product.name : "Product details"}
        </DialogTitle>
        {product && (
          <div className="h-full flex flex-col max-h-dvh">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:flex-1 lg:p-4">
                  <DialogClose className="absolute top-4 left-4 p-3 rounded-full bg-background">
                    <FiArrowLeft size={18} />
                  </DialogClose>
                  <ProductImage
                    src={productImageUrl}
                    alt={`${product.name} photo`}
                    className="h-[300px] w-full object-cover bg-background lg:w-full lg:h-[500px] lg:rounded-xl"
                    quality={85}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="pt-6 px-4 pb-4 flex flex-col gap-3 leading-4 lg:flex-1 lg:pt-8">
                  {isExclusiveDeal && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold leading-5 text-amber-900">
                      <div className="flex items-center gap-2">
                        <FiAlertCircle className="h-4 w-4 shrink-0" />
                        <span>{exclusiveDealDisclaimer}</span>
                      </div>
                    </div>
                  )}
                  <span className="text-2xl font-bold">
                    {product.translations
                      ? product.translations[lg] && product.translations[lg]["title"] || product.name
                      : product.name}
                  </span>
                  {hasProductDescription && (
                    <p className="text-lightText text-sm">{productDescription}</p>
                  )}
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
                  {product.itemType === "COMBO" && orderedComboSlots.length > 0 && (
                    <div className="flex flex-col gap-3 pt-2">
                      {orderedComboSlots.map((slot, slotIndex) => {
                        const slotSelections = selectedComboSelections.filter(
                          (selection) => selection.slotId === slot.id,
                        );
                        const slotSelectedCount = selectionCountBySlotId.get(slot.id) ?? 0;
                        const slotRequiredCount = Math.max(0, slot.minSelect ?? 0);
                        const slotHasRequiredSelection =
                          slotRequiredCount === 0 ||
                          slotSelectedCount >= slotRequiredCount;
                        const slotLabel =
                          slotSelections.length > 0
                            ? slotSelections
                                .map((selection) => {
                                  const selectedOption = slot.options.find(
                                    (slotOption) =>
                                      slotOption.productId === selection.optionProductId,
                                  );
                                  const optionLabel =
                                    resolveComboOptionTitle(selectedOption, lg) ||
                                    selection.optionProductName ||
                                    "Selected option";
                                  return selection.quantity > 1
                                    ? `${optionLabel} x${selection.quantity}`
                                    : optionLabel;
                                })
                                .join(", ")
                            : resolveComboSlotTitle(slot, slotIndex, lg);

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setActiveComboSlotIndex(slotIndex)}
                            className={`w-full rounded-3xl border bg-background px-4 py-4 transition ${
                              slotHasRequiredSelection
                                ? "border-[#BFC5C4]"
                                : "border-brandBackground border-[3px]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-extrabold ${
                                  slotHasRequiredSelection
                                    ? "bg-[#D1D4D3] text-[#636A69]"
                                    : "bg-brandBackground text-white"
                                }`}
                              >
                                {slotIndex + 1}
                              </span>
                              <div className="min-w-0 flex-1 text-left">
                                <div className="truncate text-[17px] font-semibold text-[#303636]">
                                  {slotLabel}
                                </div>
                              </div>
                              <span
                                className={`flex h-10 w-10 items-center justify-center rounded-full text-3xl leading-none ${
                                  slotHasRequiredSelection
                                    ? "bg-[#D1D4D3] text-white"
                                    : "bg-brandBackground text-white"
                                }`}
                              >
                                +
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex flex-col gap-2 pt-3">
                    <span className="font-semibold text-[16px]">
                      {content["comments"]}
                    </span>
                    <textarea
                      className="bg-background rounded-lg text-[16px] py-3 px-3 border-2 border-background transition focus:border-brandBackground focus:outline-0"
                      rows={3}
                      placeholder={content["optional"]}
                      name=""
                      id=""
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] px-4 bg-background w-full flex flex-row items-center justify-between lg:justify-end lg:gap-4">
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
          content={content}
          hasNextModifierGroup={
            activeModifierGroupIndex !== null &&
            activeModifierGroupIndex < orderedModifierGroups.length - 1
          }
          onConfirm={handleModifier}
        />
        <ComboSlotModal
          key={orderedComboSlots[activeComboSlotIndex ?? -1]?.id || "none"}
          open={isComboSlotModalOpen}
          onOpenChange={(value) => {
            if (value === false) {
              setActiveComboSlotIndex(null);
            }
          }}
          slot={
            activeComboSlotIndex !== null
              ? orderedComboSlots[activeComboSlotIndex]
              : undefined
          }
          selectedComboSelections={selectedComboSelections}
          lg={lg}
          content={content}
          onConfirm={(slot, selections) =>
            handleSaveComboSlotSelections(slot, selections)
          }
        />
      </DialogContent>
    </Dialog>
  );
};

type TComboSlotModal = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  slot?: TComboSlot;
  selectedComboSelections: TSelectedComboSlotOption[];
  lg: string;
  content: {
    [key: string]: string;
  };
  onConfirm: (
    slot: TComboSlot,
    selections: TSelectedComboSlotOption[],
  ) => void;
};

const ComboSlotModal: React.FC<TComboSlotModal> = ({
  open,
  onOpenChange,
  slot,
  selectedComboSelections,
  lg,
  content,
  onConfirm,
}) => {
  const [selectionQuantityByProductId, setSelectionQuantityByProductId] = useState<
    Record<string, number>
  >({});

  const sortedSlotOptions = useMemo(() => {
    if (!slot) return [];

    return [...slot.options].sort((leftOption, rightOption) => {
      const leftIndex = leftOption.sortIndex ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = rightOption.sortIndex ?? Number.MAX_SAFE_INTEGER;

      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
      return leftOption.productId.localeCompare(rightOption.productId);
    });
  }, [slot]);

  const totalSelectedCount = useMemo(
    () =>
      Object.values(selectionQuantityByProductId).reduce(
        (sum, quantity) => sum + quantity,
        0,
      ),
    [selectionQuantityByProductId],
  );

  const minSelection = Math.max(0, slot?.minSelect ?? 0);
  const maxSelection = Math.max(minSelection, slot?.maxSelect ?? minSelection);
  const canConfirm = totalSelectedCount >= minSelection;

  const buildSelectionStateFromProp = () => {
    if (!slot) return {};

    const nextState: Record<string, number> = {};

    for (const selection of selectedComboSelections) {
      if (selection.slotId !== slot.id) continue;
      const normalizedQuantity =
        typeof selection.quantity === "number" &&
        Number.isInteger(selection.quantity) &&
        selection.quantity > 0
          ? selection.quantity
          : 1;

      nextState[selection.optionProductId] =
        (nextState[selection.optionProductId] ?? 0) + normalizedQuantity;
    }

    return nextState;
  };

  useEffect(() => {
    if (!open) return;
    setSelectionQuantityByProductId(buildSelectionStateFromProp());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slot?.id, selectedComboSelections]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectionQuantityByProductId({});
    } else {
      setSelectionQuantityByProductId(buildSelectionStateFromProp());
    }

    onOpenChange(nextOpen);
  };

  const selectOption = (option: TComboSlotOption) => {
    setSelectionQuantityByProductId({
      [option.productId]: 1,
    });
  };

  const handleConfirm = () => {
    if (!slot) return;
    if (!canConfirm) return;

    const nextSelections = Object.entries(selectionQuantityByProductId)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const option = slot.options.find((item) => item.productId === productId);
        const optionPrice = option?.extraPrice ?? 0;
        const optionName = resolveComboOptionTitle(option, lg);

        return {
          slotId: slot.id,
          optionProductId: productId,
          quantity,
          extraPrice: optionPrice,
          slotName: slot.name,
          optionProductName: optionName,
        };
      });

    onConfirm(slot, nextSelections);
  };

  const handleSkip = () => {
    if (!slot || minSelection > 0) return;
    onConfirm(slot, []);
  };

  const slotTitle =
    slot?.translations?.[lg]?.title ||
    slot?.translations?.["en"]?.title ||
    slot?.name ||
    "Select options";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen sm:!max-w-[900px] !h-[100svh] !max-h-[100svh] !min-h-0 !flex !flex-col !p-0 !gap-0 bg-foreground transition-all"
      >
        <DialogTitle className="sr-only">{slotTitle}</DialogTitle>
        <div className="absolute right-4 top-4 z-10">
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-full bg-background p-2 text-text"
              aria-label="Close combo slot modal"
            >
              <FiX size={18} />
            </button>
          </DialogClose>
        </div>
        <div className="p-4 flex flex-col items-center">
          <span className="text-[22px] font-bold text-center">{slotTitle}</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
            {sortedSlotOptions.map((option) => {
              const selectedQuantity = selectionQuantityByProductId[option.productId] ?? 0;
              const active = selectedQuantity > 0;

              return (
                <div
                  key={option.id}
                  className={`${active ? "border-brandBackground" : "border-background"} cursor-pointer transition bg-background border-2 rounded-xl px-4 py-3 flex flex-col gap-2`}
                  onClick={() => selectOption(option)}
                >
                  {option.productPhotoUrl ? (
                    <ProductImage
                      src={option.productPhotoUrl}
                      alt={`${option.productName} photo`}
                      className="w-full rounded-lg object-cover bg-white aspect-[4/3]"
                      quality={80}
                      sizes="(max-width: 640px) 100vw, 40vw"
                    />
                  ) : null}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[16px]">
                      {resolveComboOptionTitle(option, lg)}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-lightText">
                    {option.extraPrice > 0 ? `+${formatCurrency(option.extraPrice)}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-row h-fit p-4 gap-3">
          {minSelection === 0 && (
            <Button
              className="bg-background! text-text! flex-1 disabled:opacity-50"
              onClick={handleSkip}
            >
              {content["noThanks"] || "No, Thanks"}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="bg-brandBackground py-2 flex-1 disabled:opacity-50"
          >
            {content["confirm"] || "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

type TModifierModal = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  modifierId?: string;
  lg: string;
  content: {
    [key: string]: string;
  };
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
  content,
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
        className="!top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen sm:!max-w-[900px] !h-[100svh] !max-h-[100svh] !min-h-0 !flex !flex-col !p-0 !gap-0 bg-foreground transition-all"
      >
        <DialogTitle className="sr-only">
          {resolveModifierGroupTitle(modifierGroup, lg)}
        </DialogTitle>
        <div className="absolute right-4 top-4 z-10">
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-full bg-background p-2 text-text"
              aria-label="Close modifier modal"
            >
              <FiX size={18} />
            </button>
          </DialogClose>
        </div>
        <div className="py-8 flex flex-col items-center">
          <span className="text-[22px] font-bold">
            {resolveModifierGroupTitle(modifierGroup, lg)}
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
          <div className="grid grid-cols-2 min-[600px]:grid-cols-3 gap-3">
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
        <div className="flex flex-row h-fit pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] px-4 gap-3">
          {!modifierGroup?.required && (
            <Button
              className="bg-background! text-text! flex-1 disabled:opacity-50"
              onClick={handleSkip}
            >
              {content["noThanks"] || "No, Thanks"}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="bg-brandBackground py-2 flex-1 disabled:opacity-50"
          >
            {hasNextModifierGroup
              ? content["next"] || "Next"
              : content["add"] || "Add"}
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
