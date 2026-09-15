import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import TProduct, {
  TComboSlot,
  TComboSlotOption,
  TModifierGroup,
  TModifierGroupItem,
} from "../../src/types/product";
import formatCurrency from "@/utils/formatCurrecy";
import Button from "./Button";
import ProductImage from "./ProductImage";
import { FiArrowLeft, FiCheck, FiMinus, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

const resolveModifierItemTitle = (
  modifierItem: TModifierGroupItem | undefined,
  lg: string,
) =>
  modifierItem?.translations?.[lg]?.title ||
  modifierItem?.translations?.["en"]?.title ||
  modifierItem?.name ||
  "";

/** Required groups first, mirroring how stand-alone products step through them. */
const orderModifierGroups = (modifierGroups: TModifierGroup[] | undefined) =>
  [...(modifierGroups ?? [])].sort((a, b) => {
    if (a.required === b.required) return 0;
    return a.required ? -1 : 1;
  });

const getModifierGroupMinSelection = (modifierGroup: TModifierGroup) =>
  modifierGroup.minSelection ?? (modifierGroup.required ? 1 : 0);

const getModifierGroupMaxSelection = (modifierGroup: TModifierGroup) =>
  modifierGroup.type === "MULTI"
    ? modifierGroup.maxSelection ?? modifierGroup.items.length
    : 1;

const sortComboSlotOptions = (options: TComboSlotOption[]) =>
  [...options].sort((leftOption, rightOption) => {
    const leftIndex = leftOption.sortIndex ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = rightOption.sortIndex ?? Number.MAX_SAFE_INTEGER;

    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return leftOption.productId.localeCompare(rightOption.productId);
  });

const formatTemplate = (
  template: string | undefined,
  values: { [key: string]: string | number },
  fallback: string,
) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
    template || fallback,
  );

/** One filled slot position of a combo. */
type TComboSeat = {
  optionProductId: string;
  modifiers: TSelectedModifier[];
};

/**
 * Which seat the picker is editing, and which step it is on: `"item"` picks the
 * product, a number picks that index of the chosen product's modifier groups.
 */
type TComboPickerTarget = {
  slotId: string;
  seatIndex: number;
  stage: "item" | number;
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
  const [comboSeatsBySlotId, setComboSeatsBySlotId] = useState<
    Record<string, (TComboSeat | null)[]>
  >({});
  const [comboPickerTarget, setComboPickerTarget] =
    useState<TComboPickerTarget | null>(null);
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

  const isCombo =
    product?.itemType === "COMBO" && orderedComboSlots.length > 0;

  const slotById = useMemo(
    () => new Map(orderedComboSlots.map((slot) => [slot.id, slot])),
    [orderedComboSlots],
  );

  /** Seats for a slot, padded to maxSelect so every position renders a card. */
  const getSeatsForSlot = (slot: TComboSlot): (TComboSeat | null)[] => {
    const seatCount = Math.max(1, slot.maxSelect ?? 1);
    const storedSeats = comboSeatsBySlotId[slot.id] ?? [];

    return Array.from(
      { length: seatCount },
      (_, seatIndex) => storedSeats[seatIndex] ?? null,
    );
  };

  const getSlotOption = (slot: TComboSlot, optionProductId: string) =>
    slot.options.find((option) => option.productId === optionProductId);

  const getSeatModifierGroups = (slot: TComboSlot, seat: TComboSeat | null) =>
    seat
      ? orderModifierGroups(getSlotOption(slot, seat.optionProductId)?.modifierGroups)
      : [];

  const getSeatExtraPrice = (slot: TComboSlot, seat: TComboSeat | null) => {
    if (!seat) return 0;

    const option = getSlotOption(slot, seat.optionProductId);
    if (!option) return 0;

    const modifierPriceByItemId = new Map<string, number>();
    for (const modifierGroup of option.modifierGroups ?? []) {
      for (const modifierItem of modifierGroup.items) {
        modifierPriceByItemId.set(modifierItem.id, modifierItem.price);
      }
    }

    return seat.modifiers.reduce(
      (sum, modifier) =>
        sum + (modifierPriceByItemId.get(modifier.modifierItemId) ?? 0),
      option.extraPrice,
    );
  };

  /** True while a seat still owes a required modifier group. */
  const isSeatIncomplete = (slot: TComboSlot, seat: TComboSeat | null) => {
    if (!seat) return false;

    return getSeatModifierGroups(slot, seat).some((modifierGroup) => {
      const selectedCount = seat.modifiers.filter(
        (modifier) => modifier.modifierId === modifierGroup.id,
      ).length;

      return selectedCount < getModifierGroupMinSelection(modifierGroup);
    });
  };

  const getSeatModifierLabels = (slot: TComboSlot, seat: TComboSeat | null) => {
    if (!seat) return [];

    const labels: string[] = [];

    for (const modifierGroup of getSeatModifierGroups(slot, seat)) {
      for (const modifierItem of modifierGroup.items) {
        const isSelected = seat.modifiers.some(
          (modifier) =>
            modifier.modifierId === modifierGroup.id &&
            modifier.modifierItemId === modifierItem.id,
        );

        if (isSelected) labels.push(resolveModifierItemTitle(modifierItem, lg));
      }
    }

    return labels;
  };

  const writeSeat = (
    slot: TComboSlot,
    seatIndex: number,
    seat: TComboSeat | null,
  ) => {
    setComboSeatsBySlotId((currentSeatsBySlotId) => {
      const seatCount = Math.max(1, slot.maxSelect ?? 1);
      const storedSeats = currentSeatsBySlotId[slot.id] ?? [];
      const nextSeats = Array.from(
        { length: seatCount },
        (_, index) => storedSeats[index] ?? null,
      );
      nextSeats[seatIndex] = seat;

      return { ...currentSeatsBySlotId, [slot.id]: nextSeats };
    });
  };

  /**
   * Flat cart shape: one entry per filled seat, so two seats holding the same
   * option stay distinct (different modifiers) and both get priced.
   */
  const comboSelections = useMemo<TSelectedComboSlotOption[]>(() => {
    if (!isCombo) return [];

    const selections: TSelectedComboSlotOption[] = [];

    for (const slot of orderedComboSlots) {
      const seatCount = Math.max(1, slot.maxSelect ?? 1);
      const storedSeats = comboSeatsBySlotId[slot.id] ?? [];

      for (let seatIndex = 0; seatIndex < seatCount; seatIndex += 1) {
        const seat = storedSeats[seatIndex];
        if (!seat) continue;

        const option = slot.options.find(
          (slotOption) => slotOption.productId === seat.optionProductId,
        );
        if (!option) continue;

        selections.push({
          slotId: slot.id,
          optionProductId: seat.optionProductId,
          quantity: 1,
          extraPrice: option.extraPrice,
          slotName: slot.name,
          optionProductName: resolveComboOptionTitle(option, lg),
          seatIndex,
          modifiers: seat.modifiers,
        });
      }
    }

    return selections;
  }, [isCombo, orderedComboSlots, comboSeatsBySlotId, lg]);

  /** Extra cost of every filled seat, per combo unit. */
  const comboExtrasUnitPrice = useMemo(() => {
    if (!isCombo) return 0;

    return orderedComboSlots.reduce(
      (sum, slot) =>
        sum +
        getSeatsForSlot(slot).reduce(
          (slotSum, seat) => slotSum + getSeatExtraPrice(slot, seat),
          0,
        ),
      0,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCombo, orderedComboSlots, comboSeatsBySlotId]);

  /** First unmet combo requirement, or null when the combo is ready to add. */
  const comboBlocker = useMemo(() => {
    if (!isCombo) return null;

    for (const slot of orderedComboSlots) {
      const seats = getSeatsForSlot(slot);
      const filledCount = seats.filter(Boolean).length;
      // Never demand more than the slot actually has seats for.
      const requiredCount = Math.min(
        Math.max(0, slot.minSelect ?? 0),
        seats.length,
      );

      if (filledCount < requiredCount) {
        const emptySeatIndex = seats.findIndex((seat) => !seat);

        return {
          slotId: slot.id,
          seatIndex: emptySeatIndex === -1 ? 0 : emptySeatIndex,
          stage: "item" as const,
          message: formatTemplate(
            content["comboSelectSlotFirst"],
            { slot: resolveComboSlotTitle(slot, 0, lg) },
            "Choose {slot} to continue",
          ),
        };
      }

      const incompleteSeatIndex = seats.findIndex((seat) =>
        isSeatIncomplete(slot, seat),
      );

      if (incompleteSeatIndex !== -1) {
        const seat = seats[incompleteSeatIndex];
        const option = seat ? getSlotOption(slot, seat.optionProductId) : undefined;

        return {
          slotId: slot.id,
          seatIndex: incompleteSeatIndex,
          stage: 0,
          message: formatTemplate(
            content["comboCompleteOptions"],
            { item: resolveComboOptionTitle(option, lg) },
            "Complete the options for {item}",
          ),
        };
      }
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCombo, orderedComboSlots, comboSeatsBySlotId, content, lg]);

  const comboIncludedItems = useMemo(() => {
    if (!isCombo) return [];

    return (product?.products ?? []).map((includedProduct) => {
      const title =
        includedProduct.productTranslations?.[lg]?.title ||
        includedProduct.productTranslations?.["en"]?.title ||
        includedProduct.productName ||
        "";

      return {
        productId: includedProduct.productId,
        quantity: includedProduct.quantity,
        title,
        initials: title
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
          .toUpperCase(),
      };
    });
  }, [isCombo, product?.products, lg]);

  const comboSavingAmount =
    isCombo &&
    typeof product?.comparedAtPrice === "number" &&
    typeof product?.price === "number" &&
    product.comparedAtPrice > product.price
      ? product.comparedAtPrice - product.price
      : 0;

  const comboTotalPrice = ((product?.price ?? 0) + comboExtrasUnitPrice) * quantity;

  const handleConfirm = () => {
    if (!product) return;

    if (comboBlocker) {
      setComboPickerTarget({
        slotId: comboBlocker.slotId,
        seatIndex: comboBlocker.seatIndex,
        stage: comboBlocker.stage,
      });
      return;
    }

    if (orderedModifierGroups.length > 0) {
      setPendingModifiers([]);
      setActiveModifierGroupIndex(0);
    } else {
      setPendingModifiers([]);
      setActiveModifierGroupIndex(null);
      setComboPickerTarget(null);
      onAdd(
        product.id,
        quantity,
        [],
        comboSelections,
        description.length > 0 ? description : undefined,
      );
    }
  };

  const handleClose = () => {
    setQuantity(1);
    setDescription("");
    setActiveModifierGroupIndex(null);
    setPendingModifiers([]);
    setComboSeatsBySlotId({});
    setComboPickerTarget(null);
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
      comboSelections,
      description.length > 0 ? description : undefined,
    );
  };

  /**
   * Picking an option resets that seat's modifiers and, when the option has
   * modifier groups, walks straight into the first of them.
   */
  const handleChooseSeatOption = (
    slot: TComboSlot,
    seatIndex: number,
    optionProductId: string,
  ) => {
    writeSeat(slot, seatIndex, { optionProductId, modifiers: [] });

    const modifierGroups = orderModifierGroups(
      getSlotOption(slot, optionProductId)?.modifierGroups,
    );

    setComboPickerTarget(
      modifierGroups.length > 0
        ? { slotId: slot.id, seatIndex, stage: 0 }
        : null,
    );
  };

  const handleToggleSeatModifier = (
    slot: TComboSlot,
    seatIndex: number,
    modifierGroup: TModifierGroup,
    modifierItemId: string,
  ) => {
    const seat = getSeatsForSlot(slot)[seatIndex];
    if (!seat) return;

    const groupModifiers = seat.modifiers.filter(
      (modifier) => modifier.modifierId === modifierGroup.id,
    );
    const otherModifiers = seat.modifiers.filter(
      (modifier) => modifier.modifierId !== modifierGroup.id,
    );
    const isSelected = groupModifiers.some(
      (modifier) => modifier.modifierItemId === modifierItemId,
    );
    const maxSelection = getModifierGroupMaxSelection(modifierGroup);

    let nextGroupModifiers: TSelectedModifier[];

    if (maxSelection === 1) {
      nextGroupModifiers = isSelected
        ? []
        : [{ modifierId: modifierGroup.id, modifierItemId }];
    } else if (isSelected) {
      nextGroupModifiers = groupModifiers.filter(
        (modifier) => modifier.modifierItemId !== modifierItemId,
      );
    } else if (groupModifiers.length >= maxSelection) {
      nextGroupModifiers = groupModifiers;
    } else {
      nextGroupModifiers = [
        ...groupModifiers,
        { modifierId: modifierGroup.id, modifierItemId },
      ];
    }

    writeSeat(slot, seatIndex, {
      ...seat,
      modifiers: [...otherModifiers, ...nextGroupModifiers],
    });
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
  const [visibleViewportHeight, setVisibleViewportHeight] = useState("100svh");

  useEffect(() => {
    if (!isProductModalOpen) return;

    const updateVisibleViewportHeight = () => {
      const viewportHeight =
        window.visualViewport?.height && Number.isFinite(window.visualViewport.height)
          ? window.visualViewport.height
          : window.innerHeight;
      if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return;

      setVisibleViewportHeight(`${Math.floor(viewportHeight)}px`);
    };

    updateVisibleViewportHeight();
    window.addEventListener("resize", updateVisibleViewportHeight);
    window.addEventListener("orientationchange", updateVisibleViewportHeight);
    window.visualViewport?.addEventListener("resize", updateVisibleViewportHeight);
    window.visualViewport?.addEventListener("scroll", updateVisibleViewportHeight);

    return () => {
      window.removeEventListener("resize", updateVisibleViewportHeight);
      window.removeEventListener("orientationchange", updateVisibleViewportHeight);
      window.visualViewport?.removeEventListener(
        "resize",
        updateVisibleViewportHeight,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        updateVisibleViewportHeight,
      );
    };
  }, [isProductModalOpen]);

  const fullscreenModalStyle = useMemo<CSSProperties>(
    () => ({
      height: visibleViewportHeight,
      maxHeight: visibleViewportHeight,
    }),
    [visibleViewportHeight],
  );

  const isModifierModalOpen =
    isProductModalOpen && activeModifierGroupIndex !== null;
  const comboPickerSlot = comboPickerTarget
    ? slotById.get(comboPickerTarget.slotId)
    : undefined;
  const comboPickerSeat =
    comboPickerSlot && comboPickerTarget
      ? getSeatsForSlot(comboPickerSlot)[comboPickerTarget.seatIndex] ?? null
      : null;
  const isComboPickerOpen = isProductModalOpen && Boolean(comboPickerSlot);
  /** Options already taken by other seats, hidden when the slot forbids repeats. */
  const otherSeatOptionProductIds =
    comboPickerSlot && comboPickerTarget && !comboPickerSlot.allowDuplicates
      ? getSeatsForSlot(comboPickerSlot)
          .map((seat, seatIndex) =>
            seat && seatIndex !== comboPickerTarget.seatIndex
              ? seat.optionProductId
              : null,
          )
          .filter((optionProductId): optionProductId is string =>
            Boolean(optionProductId),
          )
      : [];

  return (
    <Dialog
      open={isProductModalOpen}
      onOpenChange={(value) => {
        if (!value) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="!top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !w-screen !max-w-none !h-[100svh] !max-h-[100svh] !p-0 !gap-0 bg-foreground transition-all overflow-hidden rounded-none"
        style={fullscreenModalStyle}
      >
        <DialogTitle className="sr-only">
          {product ? product.name : "Product details"}
        </DialogTitle>
        {product && (
          <div className="h-full min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:flex-1 lg:p-4">
                  <DialogClose className="absolute top-4 left-4 p-3 rounded-full bg-background">
                    <FiArrowLeft size={18} />
                  </DialogClose>
                  {isCombo && (
                    <span className="absolute top-4 right-4 z-10 inline-flex h-7 items-center rounded-full bg-brandBackground px-3 text-[11.5px] font-bold tracking-[0.04em] text-white">
                      {content["comboBadge"] || "COMBO"}
                    </span>
                  )}
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
                  <div className="flex flex-row items-baseline gap-2 text-[20px]">
                    {product.price && (
                      <span className="font-extrabold">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                    {product.comparedAtPrice && (
                      <span className="font-semibold text-lightText line-through">
                        {formatCurrency(product.comparedAtPrice)}
                      </span>
                    )}
                    {comboSavingAmount > 0 && (
                      <span className="inline-flex h-[22px] items-center rounded-full bg-[#DCFCE7] px-2 text-[11.5px] font-bold text-[#16A34A]">
                        {formatTemplate(
                          content["comboSave"],
                          { amount: formatCurrency(comboSavingAmount) },
                          "Save {amount}",
                        )}
                      </span>
                    )}
                  </div>
                  {isCombo && comboIncludedItems.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-lightText">
                        {content["comboIncludedTitle"] || "Included in the combo"}
                      </span>
                      <div className="overflow-hidden rounded-xl border border-[#E4E4E4] bg-background">
                        {comboIncludedItems.map((includedItem, includedIndex) => (
                          <div
                            key={`${includedItem.productId}-${includedIndex}`}
                            className={`flex items-center gap-3 px-3 py-2.5 ${
                              includedIndex === 0 ? "" : "border-t border-[#F1F1F1]"
                            }`}
                          >
                            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-foreground text-[12px] font-semibold text-lightText">
                              {includedItem.initials}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text">
                              {includedItem.title}
                            </span>
                            <span className="shrink-0 text-[12px] text-lightText">
                              {includedItem.quantity}x
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isCombo && (
                    <div className="flex flex-col gap-5 pt-2">
                      {orderedComboSlots.map((slot, slotIndex) => {
                        const seats = getSeatsForSlot(slot);
                        const filledCount = seats.filter(Boolean).length;
                        const requiredCount = Math.min(
                          Math.max(0, slot.minSelect ?? 0),
                          seats.length,
                        );
                        const isSlotRequired = requiredCount > 0;
                        const isSlotSatisfied = filledCount >= requiredCount;
                        const slotTitle = resolveComboSlotTitle(slot, slotIndex, lg);

                        return (
                          <div key={slot.id} className="flex flex-col gap-2.5">
                            <div className="flex items-start gap-2.5">
                              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                <span className="text-[15px] font-semibold text-text">
                                  {slotTitle}
                                </span>
                                <span
                                  className={`inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-bold ${
                                    isSlotRequired
                                      ? "bg-brandBackground/10 text-brandBackground"
                                      : "bg-foreground text-lightText"
                                  }`}
                                >
                                  {isSlotRequired
                                    ? content["comboRequired"] || "Required"
                                    : content["comboOptional"] || "Optional"}
                                </span>
                              </div>
                              <span
                                className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11.5px] font-semibold ${
                                  isSlotSatisfied
                                    ? "bg-[#DCFCE7] text-[#16A34A]"
                                    : "bg-foreground text-lightText"
                                }`}
                              >
                                {filledCount}/{seats.length}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2.5">
                              {seats.map((seat, seatIndex) => {
                                const option = seat
                                  ? getSlotOption(slot, seat.optionProductId)
                                  : undefined;
                                const seatIncomplete = isSeatIncomplete(slot, seat);
                                const seatModifierLabels = getSeatModifierLabels(
                                  slot,
                                  seat,
                                );
                                const seatHasModifierGroups =
                                  getSeatModifierGroups(slot, seat).length > 0;
                                const seatExtraPrice = getSeatExtraPrice(slot, seat);

                                if (!seat || !option) {
                                  return (
                                    <button
                                      key={`${slot.id}-${seatIndex}`}
                                      type="button"
                                      onClick={() =>
                                        setComboPickerTarget({
                                          slotId: slot.id,
                                          seatIndex,
                                          stage: "item",
                                        })
                                      }
                                      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[#C9C9C9] px-3 py-3.5 text-left transition hover:border-brandBackground"
                                    >
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[12.5px] font-bold text-lightText">
                                        {seatIndex + 1}
                                      </span>
                                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="truncate text-[13.5px] font-semibold text-text">
                                          {formatTemplate(
                                            content["comboChoose"],
                                            { item: slotTitle.toLowerCase() },
                                            "Choose {item}",
                                          )}
                                        </span>
                                        <span className="text-[11.5px] text-lightText">
                                          {seatIndex < requiredCount
                                            ? content["comboRequired"] || "Required"
                                            : content["comboOptional"] || "Optional"}
                                        </span>
                                      </span>
                                      <FiPlus
                                        size={18}
                                        className="shrink-0 text-brandBackground"
                                      />
                                    </button>
                                  );
                                }

                                return (
                                  <div
                                    key={`${slot.id}-${seatIndex}`}
                                    className={`overflow-hidden rounded-xl border bg-background ${
                                      seatIncomplete
                                        ? "border-brandBackground"
                                        : "border-[#E4E4E4]"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 px-3 py-3">
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brandBackground text-[12.5px] font-bold text-white">
                                        {seatIndex + 1}
                                      </span>
                                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="truncate text-[13.5px] font-semibold text-text">
                                          {resolveComboOptionTitle(option, lg)}
                                        </span>
                                        <span
                                          className={`truncate text-[11.5px] ${
                                            seatIncomplete
                                              ? "font-semibold text-brandBackground"
                                              : "text-lightText"
                                          }`}
                                        >
                                          {seatIncomplete
                                            ? content["comboMissingOptions"] ||
                                              "Missing required options"
                                            : seatModifierLabels.length > 0
                                              ? seatModifierLabels.join(" \u00b7 ")
                                              : content["comboNoExtras"] ||
                                                "No extras"}
                                        </span>
                                      </span>
                                      <span className="shrink-0 text-[12px] text-lightText">
                                        {seatExtraPrice > 0
                                          ? `+${formatCurrency(seatExtraPrice)}`
                                          : content["comboIncludedLabel"] ||
                                            "Included"}
                                      </span>
                                      <button
                                        type="button"
                                        title={content["comboRemove"] || "Remove"}
                                        aria-label={content["comboRemove"] || "Remove"}
                                        onClick={() => writeSeat(slot, seatIndex, null)}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lightText transition hover:bg-foreground"
                                      >
                                        <FiX size={16} />
                                      </button>
                                    </div>
                                    <div className="flex gap-2 px-3 pb-3">
                                      {seatHasModifierGroups && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setComboPickerTarget({
                                              slotId: slot.id,
                                              seatIndex,
                                              stage: 0,
                                            })
                                          }
                                          className={`h-11 rounded-full px-4 text-[12.5px] font-semibold transition ${
                                            seatIncomplete
                                              ? "bg-brandBackground text-white"
                                              : "border border-[#E4E4E4] bg-background text-text"
                                          }`}
                                        >
                                          {seatIncomplete
                                            ? content["comboSelectOptions"] ||
                                              "Choose options"
                                            : content["comboEditOptions"] ||
                                              "Edit options"}
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setComboPickerTarget({
                                            slotId: slot.id,
                                            seatIndex,
                                            stage: "item",
                                          })
                                        }
                                        className="h-11 rounded-full border border-[#E4E4E4] bg-background px-4 text-[12.5px] font-semibold text-text transition"
                                      >
                                        {content["comboSwap"] || "Swap item"}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
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
                className={`text-[16px] font-bold bg-brandBackground py-3 px-8 leading-5 lg:px-12 ${
                  isCombo ? "flex flex-1 items-center justify-center gap-3 lg:flex-none" : ""
                }`}
              >
                <span>{content["add"]}</span>
                {isCombo && <span>{formatCurrency(comboTotalPrice)}</span>}
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
          fullscreenModalStyle={fullscreenModalStyle}
          onConfirm={handleModifier}
        />
        <ComboSeatPickerModal
          open={isComboPickerOpen}
          onOpenChange={(value) => {
            if (value === false) setComboPickerTarget(null);
          }}
          slot={comboPickerSlot}
          seatIndex={comboPickerTarget?.seatIndex ?? 0}
          stage={comboPickerTarget?.stage ?? "item"}
          seat={comboPickerSeat}
          otherSeatOptionProductIds={otherSeatOptionProductIds}
          lg={lg}
          content={content}
          fullscreenModalStyle={fullscreenModalStyle}
          onChooseOption={handleChooseSeatOption}
          onToggleModifier={handleToggleSeatModifier}
          onStageChange={(stage) => {
            setComboPickerTarget((currentTarget) =>
              currentTarget ? { ...currentTarget, stage } : currentTarget,
            );
          }}
          onDone={() => setComboPickerTarget(null)}
        />
      </DialogContent>
    </Dialog>
  );
};

type TComboSeatPickerModal = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  slot?: TComboSlot;
  seatIndex: number;
  stage: "item" | number;
  seat: TComboSeat | null;
  otherSeatOptionProductIds: string[];
  lg: string;
  content: {
    [key: string]: string;
  };
  fullscreenModalStyle: CSSProperties;
  onChooseOption: (
    slot: TComboSlot,
    seatIndex: number,
    optionProductId: string,
  ) => void;
  onToggleModifier: (
    slot: TComboSlot,
    seatIndex: number,
    modifierGroup: TModifierGroup,
    modifierItemId: string,
  ) => void;
  onStageChange: (stage: "item" | number) => void;
  onDone: () => void;
};

/**
 * Fills a single combo seat: first the product, then one step per modifier
 * group that product defines. Selections are written straight to the parent, so
 * closing mid-flow keeps whatever was already chosen.
 */
const ComboSeatPickerModal: React.FC<TComboSeatPickerModal> = ({
  open,
  onOpenChange,
  slot,
  seatIndex,
  stage,
  seat,
  otherSeatOptionProductIds,
  lg,
  content,
  fullscreenModalStyle,
  onChooseOption,
  onToggleModifier,
  onStageChange,
  onDone,
}) => {
  // Once the target clears there is nothing left to render, and falling through
  // would briefly show placeholder copy while the dialog closes.
  if (!slot) return null;

  const selectedOption = seat
    ? slot.options.find((option) => option.productId === seat.optionProductId)
    : undefined;
  const modifierGroups = orderModifierGroups(selectedOption?.modifierGroups);

  const isItemStage = stage === "item" || modifierGroups.length === 0;
  const groupIndex = isItemStage
    ? -1
    : Math.max(0, Math.min(stage as number, modifierGroups.length - 1));
  const modifierGroup = groupIndex === -1 ? undefined : modifierGroups[groupIndex];

  const selectedModifierItemIds =
    modifierGroup && seat
      ? seat.modifiers
          .filter((modifier) => modifier.modifierId === modifierGroup.id)
          .map((modifier) => modifier.modifierItemId)
      : [];

  const minSelection = modifierGroup
    ? getModifierGroupMinSelection(modifierGroup)
    : 0;
  const maxSelection = modifierGroup
    ? getModifierGroupMaxSelection(modifierGroup)
    : 0;
  const isLastGroup = groupIndex === modifierGroups.length - 1;

  const canAdvance = isItemStage
    ? Boolean(seat)
    : selectedModifierItemIds.length >= minSelection;

  const availableOptions = sortComboSlotOptions(slot.options).filter(
    (option) =>
      !otherSeatOptionProductIds.includes(option.productId) ||
      option.productId === seat?.optionProductId,
  );

  const slotTitle = resolveComboSlotTitle(slot, seatIndex, lg);
  const stepCount = 1 + modifierGroups.length;
  const activeStepIndex = isItemStage ? 0 : groupIndex + 1;

  const title = isItemStage
    ? slotTitle
    : resolveModifierGroupTitle(modifierGroup, lg);
  const subtitle = isItemStage
    ? formatTemplate(
        content["comboSeatOf"],
        { current: seatIndex + 1, total: Math.max(1, slot.maxSelect ?? 1) },
        "Slot {current} of {total}",
      )
    : `${resolveComboOptionTitle(selectedOption, lg)} \u00b7 ${
        maxSelection === 1
          ? content["comboChooseOne"] || "choose 1 option"
          : formatTemplate(
              content["comboChooseUpTo"],
              { max: maxSelection },
              "up to {max} options",
            )
      }`;

  const handleBack = () => {
    if (groupIndex <= 0) {
      onStageChange("item");
      return;
    }

    onStageChange(groupIndex - 1);
  };

  const handleNext = () => {
    if (!canAdvance) return;

    if (isItemStage) {
      if (modifierGroups.length > 0) onStageChange(0);
      else onDone();
      return;
    }

    if (isLastGroup) onDone();
    else onStageChange(groupIndex + 1);
  };

  const nextLabel = isItemStage
    ? seat
      ? content["comboKeepChoice"] || "Keep choice"
      : content["comboPickItem"] || "Choose an item"
    : isLastGroup
      ? content["confirm"] || "Confirm"
      : content["next"] || "Next";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !w-screen sm:!max-w-[900px] !h-[100svh] !max-h-[100svh] !min-h-0 !flex !flex-col !p-0 !gap-0 bg-foreground transition-all"
        style={fullscreenModalStyle}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="relative flex shrink-0 flex-col items-center gap-1 px-16 pt-6 pb-3.5">
          {!isItemStage && (
            <button
              type="button"
              onClick={handleBack}
              aria-label={content["back"] || "Back"}
              className="absolute left-3.5 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-background text-text"
            >
              <FiArrowLeft size={17} />
            </button>
          )}
          <span className="text-center text-[21px] font-bold text-text">
            {title}
          </span>
          <span className="text-center text-[12.5px] text-lightText">
            {subtitle}
          </span>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-3.5 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-background text-text"
            >
              <FiX size={16} />
            </button>
          </DialogClose>
        </div>

        {stepCount > 1 && (
          <div className="flex shrink-0 items-center gap-1.5 px-4 pb-3">
            {Array.from({ length: stepCount }, (_, stepIndex) => (
              <span
                key={stepIndex}
                className={`h-[3px] flex-1 rounded-full ${
                  stepIndex <= activeStepIndex
                    ? "bg-brandBackground"
                    : "bg-[#DCDCDC]"
                }`}
              />
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 gap-3 min-[600px]:grid-cols-3">
            {isItemStage
              ? availableOptions.map((option) => {
                  const active = seat?.optionProductId === option.productId;

                  return (
                    <ComboChoiceCard
                      key={option.id}
                      active={active}
                      title={resolveComboOptionTitle(option, lg)}
                      photoUrl={option.productPhotoUrl}
                      price={option.extraPrice}
                      includedLabel={
                        content["comboIncludedLabel"] || "Included"
                      }
                      onSelect={() =>
                        onChooseOption(slot, seatIndex, option.productId)
                      }
                    />
                  );
                })
              : modifierGroup?.items.map((modifierItem) => {
                  const active = selectedModifierItemIds.includes(modifierItem.id);
                  const reachedMax =
                    !active && selectedModifierItemIds.length >= maxSelection;

                  return (
                    <ComboChoiceCard
                      key={modifierItem.id}
                      active={active}
                      disabled={maxSelection > 1 && reachedMax}
                      title={resolveModifierItemTitle(modifierItem, lg)}
                      photoUrl={modifierItem.photo?.url}
                      price={modifierItem.price}
                      includedLabel={
                        content["comboIncludedLabel"] || "Included"
                      }
                      onSelect={() =>
                        onToggleModifier(
                          slot,
                          seatIndex,
                          modifierGroup,
                          modifierItem.id,
                        )
                      }
                    />
                  );
                })}
          </div>
        </div>

        <div className="shrink-0 px-4 pt-3 pb-[max(1.125rem,env(safe-area-inset-bottom))]">
          <Button
            onClick={handleNext}
            disabled={!canAdvance}
            className="h-13 w-full bg-brandBackground py-3.5 text-[16px] font-bold disabled:opacity-50"
          >
            {nextLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

type TComboChoiceCardProps = {
  active: boolean;
  disabled?: boolean;
  title: string;
  photoUrl?: string;
  price: number;
  includedLabel: string;
  onSelect: () => void;
};

const ComboChoiceCard: React.FC<TComboChoiceCardProps> = ({
  active,
  disabled,
  title,
  photoUrl,
  price,
  includedLabel,
  onSelect,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onSelect}
    className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 bg-background p-3 transition disabled:opacity-50 ${
      active ? "border-brandBackground" : "border-transparent"
    }`}
  >
    <span className="block aspect-square w-full overflow-hidden rounded-lg bg-foreground">
      {photoUrl ? (
        <ProductImage
          src={photoUrl}
          alt={`${title} photo`}
          className="h-full w-full object-cover"
          quality={80}
          sizes="(max-width: 640px) 50vw, 200px"
        />
      ) : null}
    </span>
    <span className="text-center text-[13.5px] font-bold text-text">{title}</span>
    <span
      className={
        price > 0
          ? "text-[16px] font-bold text-text"
          : "text-[12.5px] font-medium text-lightText"
      }
    >
      {price > 0 ? `+ ${formatCurrency(price)}` : includedLabel}
    </span>
    {active && (
      <span className="absolute right-2 top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-brandBackground text-white">
        <FiCheck size={12} strokeWidth={3} />
      </span>
    )}
  </button>
);

type TModifierModal = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  modifierId?: string;
  lg: string;
  content: {
    [key: string]: string;
  };
  fullscreenModalStyle: CSSProperties;
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
  fullscreenModalStyle,
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
        style={fullscreenModalStyle}
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
