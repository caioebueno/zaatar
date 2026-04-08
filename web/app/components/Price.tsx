"use client";

import { DEFAULT_BRANCH_ID } from "@/constants/branch";
import { calculateCartWithProgressiveDiscount } from "@/utils/calculatePrice";
import { useCart } from "./CartContext";
import formatCurrency from "@/utils/formatCurrecy";
import { isOperationHoursOpenAt } from "@/src/modules/branch/domain/branch.types";
import { TGetProductsResponse } from "../../src/getProducts";
import TCart, { TCartItem } from "@/types/cart";
import Button from "./Button";
import ProductImage from "./ProductImage";
import {
  FiArrowLeft,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiPlus,
  FiShoppingBag,
  FiTruck,
  FiX,
} from "react-icons/fi";
import { FaStar } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { findProductById } from "./MenuPage";
import { calculateProductPriceWithProgressiveDiscount } from "@/utils/calculateProductPriceWithProgressiveDiscount";
import { QuantitySelector } from "./ProductModal";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import PhoneInput, { PhoneValue } from "./PhoneInput";
import getCustomerData from "../../src/getCustomerData";
import { useEffect, useMemo, useState } from "react";
import TCustomer from "../../src/types/customer";
import TextInput from "./TextInput";
import { Dialog } from "radix-ui";
import AddressAutocompleteInput, { TAddressValue } from "./AddressInput";
import addNewDeliveryAddress from "../../src/addNewDeliveryAddress";
import TAddress from "../../src/types/address";
import updateCustomerName from "../../src/updateCustomerName";
import {
  TOrder,
  TOrderProgressiveDiscountSnapshot,
  TOrderType,
  TPaymentMethod,
} from "../../src/types/order";
import createOrder from "../../src/createOrder";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import TProduct from "@/src/types/product";
import type { TOperationHours } from "@/src/types/operationHours";
import { weekDays, type WeekDay } from "@/src/modules/branch/domain/branch.types";
import {
  clearStoredCustomerSession,
  getStoredCustomerSession,
  setStoredCustomerSession,
} from "@/utils/customerSession";
import text from "@/constants/text";
import type { TProgressiveDiscountPrize } from "@/src/types/progressiveDiscount";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const formatDiscountOffLabel = (discountAmount: number) => {
  const discountInDollars = discountAmount / 100;

  if (discountInDollars < 1) {
    return `$${discountInDollars.toFixed(2)} off`;
  }

  return `$${Math.floor(discountInDollars)} off`;
};

type TSummaryModifierItem = {
  id: string;
  title: string;
  price: number;
};

type TSummaryModifierGroup = {
  id: string;
  title: string;
  items: TSummaryModifierItem[];
};

const resolveModifierItemTitle = (
  modifierItem: {
    name: string;
    translations?: {
      [key: string]: {
        [key: string]: string;
      };
    };
  },
  lg: string,
) =>
  modifierItem.translations?.[lg]?.title ||
  modifierItem.translations?.["en"]?.title ||
  modifierItem.name;

const buildSelectedModifierGroupsFromCartItem = (
  product: TProduct | null | undefined,
  cartItem: TCartItem,
  lg: string,
): TSummaryModifierGroup[] =>
  product?.modifierGroups
    ?.map((modifierGroup) => {
      const selectedModifierItems = cartItem.modifiers
        ?.filter((modifier) => modifier.modifierId === modifierGroup.id)
        .map((modifier) =>
          modifierGroup.items.find(
            (modifierItem) => modifierItem.id === modifier.modifierItemId,
          ),
        )
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      if (!selectedModifierItems || selectedModifierItems.length === 0) {
        return null;
      }

      return {
        id: modifierGroup.id,
        title: modifierGroup.title,
        items: selectedModifierItems.map((item) => ({
          id: item.id,
          title: resolveModifierItemTitle(item, lg),
          price: item.price,
        })),
      };
    })
    .filter((group): group is TSummaryModifierGroup => Boolean(group)) || [];

const buildSelectedModifierGroupsFromOrderProduct = (
  orderProduct: TOrder["orderProducts"][number],
  lg: string,
  fallbackGroupTitle: string,
): TSummaryModifierGroup[] => {
  const selectedModifierItems = orderProduct.selectedModifierGroupItems || [];
  if (selectedModifierItems.length === 0) return [];

  const productModifierGroups = orderProduct.product?.modifierGroups || [];
  if (productModifierGroups.length === 0) {
    return [
      {
        id: `fallback-${orderProduct.id}`,
        title: fallbackGroupTitle,
        items: selectedModifierItems.map((item) => ({
          id: item.id,
          title: resolveModifierItemTitle(item, lg),
          price: item.price,
        })),
      },
    ];
  }

  return productModifierGroups
    .map((modifierGroup) => {
      const groupItems = selectedModifierItems
        .filter((selectedItem) =>
          modifierGroup.items.some((groupItem) => groupItem.id === selectedItem.id),
        )
        .map((item) => ({
          id: item.id,
          title: resolveModifierItemTitle(item, lg),
          price: item.price,
        }));

      if (groupItems.length === 0) return null;

      return {
        id: modifierGroup.id,
        title: modifierGroup.title,
        items: groupItems,
      };
    })
    .filter((group): group is TSummaryModifierGroup => Boolean(group));
};

const getPrizeImageUrl = (prize: TProgressiveDiscountPrize): string | null => {
  if (prize.imageUrl) return prize.imageUrl;
  return prize.products[0]?.photos?.[0]?.url || null;
};

const resolvePrizeProductTitle = (
  prizeProduct: TProgressiveDiscountPrize["products"][number],
  lg: string,
) =>
  prizeProduct.translations?.[lg]?.title ||
  prizeProduct.translations?.["en"]?.title ||
  prizeProduct.name;

const getUniquePrizeProducts = (
  prize: TProgressiveDiscountPrize,
): TProgressiveDiscountPrize["products"] => {
  const productMap = new Map<string, TProgressiveDiscountPrize["products"][number]>();

  for (const product of prize.products) {
    if (!productMap.has(product.id)) {
      productMap.set(product.id, product);
    }
  }

  return Array.from(productMap.values());
};

type TPrizeSummaryLineItem = {
  id: string;
  name: string;
  quantity: number;
};

const buildPrizeSummaryLineItems = ({
  availableProducts,
  lg,
  selectedProductCounts,
  selectedProductIds,
}: {
  availableProducts: TProgressiveDiscountPrize["products"];
  lg: string;
  selectedProductCounts?: {
    productId: string;
    quantity: number;
  }[];
  selectedProductIds?: string[];
}): TPrizeSummaryLineItem[] => {
  const productById = new Map(
    availableProducts.map((product) => [product.id, product]),
  );
  const productCountMap = new Map<string, number>();

  if (selectedProductCounts && selectedProductCounts.length > 0) {
    for (const selectedProduct of selectedProductCounts) {
      if (selectedProduct.quantity <= 0) continue;
      productCountMap.set(selectedProduct.productId, selectedProduct.quantity);
    }
  } else {
    for (const productId of selectedProductIds || []) {
      productCountMap.set(productId, (productCountMap.get(productId) || 0) + 1);
    }
  }

  return Array.from(productCountMap.entries())
    .map(([productId, quantity]) => {
      if (quantity <= 0) return null;
      const product = productById.get(productId);
      if (!product) return null;

      return {
        id: productId,
        name: resolvePrizeProductTitle(product, lg),
        quantity,
      };
    })
    .filter((item): item is TPrizeSummaryLineItem => Boolean(item));
};

const ModifierGroupsList: React.FC<{
  modifierGroups: TSummaryModifierGroup[];
}> = ({ modifierGroups }) => (
  <>
    {modifierGroups.map((modifierGroup) => (
      <div key={modifierGroup.id} className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-lightText">
          {modifierGroup.title}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          {modifierGroup.items.map((modifierItem) => (
            <div
              key={modifierItem.id}
              className="flex w-full min-w-0 items-center justify-between gap-2"
            >
              <span
                title={modifierItem.title}
                className="block min-w-0 flex-1 truncate text-xs font-medium text-lightText"
              >
                {modifierItem.title}
              </span>
              <span className="shrink-0 text-xs font-medium text-lightText">
                {formatCurrency(modifierItem.price)}
              </span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </>
);

type TPrice = {
  data: TGetProductsResponse;
  cart: TCart;
  content: {
    [key: string]: string;
  };
};

const Price: React.FC<TPrice> = ({ data, cart, content }) => {
  const price = calculateCartWithProgressiveDiscount(
    data.categories,
    cart,
    data.progressiveDiscount,
  );
  const router = useRouter();

  return (
    <div className="bg-foreground p-4 border-[#B9BFBF] border-b flex flex-row justify-between sticky top-[var(--menu-sticky-offset)] z-10">
      <Button
        onClick={() => router.back()}
        className="p-0! text-[16px] font-semibold text-text! bg-transparent flex flex-row gap-2 items-center"
      >
        <FiArrowLeft size={18} />
        <span>{content["back"]}</span>
      </Button>
      <div className="flex flex-row items-center gap-2.5">
        <div>
          <div className="bg-[#CCD0D0] rounded-md">
            {price.discountAmount > 0 && (
              <span className="text-xs font-semibold text-brandBackground py-1 px-1.5">
                {formatDiscountOffLabel(price.discountAmount)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col">
          {price.fullPrice !== price.discountedPrice && (
            <span className="text-sm font-semibold line-through">
              {formatCurrency(price.fullPrice)}
            </span>
          )}
          <span className="text-[22px] font-bold">
            {formatCurrency(price.discountedPrice)}
          </span>
        </div>
      </div>
    </div>
  );
};

type TCartProduct = {
  data: TGetProductsResponse;
  lg: string;
};

type ScheduleSelection = {
  date: string;
  time: string;
};

type ScheduleTimeOption = {
  value: string;
  label: string;
};

type ScheduleDayOption = {
  value: string;
  label: string;
  times: ScheduleTimeOption[];
};

const SCHEDULE_SLOT_INTERVAL_MINUTES = 30;
const SCHEDULE_DAY_WINDOW = 7;

function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimeInputValue(date: Date): string {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${hours}:${minutes}`;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfDay(date: Date): Date {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function getWeekDay(date: Date): WeekDay {
  return weekDays[(date.getDay() + 6) % 7];
}

function getPreviousWeekDay(day: WeekDay): WeekDay {
  const dayIndex = weekDays.indexOf(day);
  return weekDays[(dayIndex + weekDays.length - 1) % weekDays.length];
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function buildSlotDate(date: Date, minutes: number): Date {
  const slotDate = new Date(date);
  slotDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return slotDate;
}

function addRangeSlots(
  minutesSet: Set<number>,
  startMinutes: number,
  endMinutes: number,
  includeEndMinutes = true,
) {
  const firstAvailableMinute = Math.min(
    startMinutes + SCHEDULE_SLOT_INTERVAL_MINUTES,
    endMinutes,
  );

  for (
    let minute = firstAvailableMinute;
    minute < endMinutes;
    minute += SCHEDULE_SLOT_INTERVAL_MINUTES
  ) {
    minutesSet.add(minute);
  }

  if (includeEndMinutes && endMinutes < 24 * 60) {
    minutesSet.add(endMinutes);
  }
}

function getScheduleMinutesForDate(
  operationHours: TOperationHours,
  date: Date,
): number[] {
  const currentDay = getWeekDay(date);
  const previousDay = getPreviousWeekDay(currentDay);
  const minutesSet = new Set<number>();

  for (const range of operationHours[currentDay]) {
    const fromMinutes = toMinutes(range.from);
    const toMinutesValue = toMinutes(range.to);

    if (fromMinutes === toMinutesValue) {
      addRangeSlots(minutesSet, 0, 24 * 60, false);
      continue;
    }

    if (fromMinutes < toMinutesValue) {
      addRangeSlots(minutesSet, fromMinutes, toMinutesValue);
      continue;
    }

    addRangeSlots(minutesSet, fromMinutes, 24 * 60);
  }

  for (const range of operationHours[previousDay]) {
    const fromMinutes = toMinutes(range.from);
    const toMinutesValue = toMinutes(range.to);

    if (fromMinutes > toMinutesValue) {
      addRangeSlots(minutesSet, 0, toMinutesValue);
    }
  }

  return Array.from(minutesSet).sort((a, b) => a - b);
}

function buildScheduleOptions(
  operationHours: TOperationHours,
  now: Date,
  language: string,
): ScheduleDayOption[] {
  const locale = language === "pt" ? "pt-BR" : "en-US";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  });

  return Array.from({ length: SCHEDULE_DAY_WINDOW }, (_, offset) => {
    const date = addDays(now, offset);
    date.setHours(0, 0, 0, 0);
    const differenceInDays = Math.round(
      (startOfDay(date).getTime() - startOfDay(now).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const label =
      differenceInDays === 0
        ? language === "pt"
          ? "Hoje"
          : "Today"
        : differenceInDays === 1
          ? language === "pt"
            ? "Amanhã"
            : "Tomorrow"
          : dateFormatter.format(date);

    const times = getScheduleMinutesForDate(operationHours, date)
      .map((minutes) => buildSlotDate(date, minutes))
      .filter((slotDate) => slotDate > now)
      .map((slotDate) => ({
        value: formatTimeInputValue(slotDate),
        label: timeFormatter.format(slotDate),
      }));

    return {
      value: formatDateInputValue(date),
      label,
      times,
    };
  }).filter((option) => option.times.length > 0);
}

function formatSelectedScheduleLabel(
  schedule: ScheduleSelection,
  scheduleOptions: ScheduleDayOption[],
): string {
  const selectedDay = scheduleOptions.find(
    (option) => option.value === schedule.date,
  );
  const selectedTime = selectedDay?.times.find(
    (option) => option.value === schedule.time,
  );

  if (!selectedDay || !selectedTime) {
    return `${schedule.date} - ${schedule.time}`;
  }

  return `${selectedDay.label} - ${selectedTime.label}`;
}

function toScheduleForIsoString(
  schedule: ScheduleSelection | null,
): string | undefined {
  if (!schedule) return undefined;

  const parsedDate = new Date(`${schedule.date}T${schedule.time}:00`);
  if (Number.isNaN(parsedDate.getTime())) return undefined;

  return parsedDate.toISOString();
}

const CartList: React.FC<TCartProduct> = ({ data, lg }) => {
  const { cart, clearCart, setSelectedPrize } = useCart();
  const [step, setStep] = useQueryState("step", parseAsInteger.withDefault(1));
  const [orderType, setOrderType] = useQueryState(
    "orderType",
    parseAsStringLiteral(["DELIVERY", "TAKEAWAY"]),
  );
  const [paymentType, setPaymentType] = useState<TPaymentMethod | null>("CARD");
  const [selectedTip, setSelectedTip] = useState<string | null>("15");
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [customer, setCustomer] = useState<TCustomer | null>(null);
  const [loading, setLoading] = useState(false);
  const [openSummaryModal, setOpenSummaryModal] = useState(false);
  const [openPrizeModal, setOpenPrizeModal] = useState(false);
  const [prizeBannerShakeSignal, setPrizeBannerShakeSignal] = useState(0);
  const [name, setName] = useState<null | string>(null);
  const [operationHours, setOperationHours] = useState<TOperationHours | null>(
    null,
  );
  const [isBranchOpen, setIsBranchOpen] = useState<boolean | null>(null);
  const [scheduledAt, setScheduledAt] = useState<ScheduleSelection | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const router = useRouter();
  const content = text[lg];

  useEffect(() => {
    const controller = new AbortController();

    const loadOperationHours = async () => {
      try {
        const response = await fetch(
          `/api/branches/${DEFAULT_BRANCH_ID}/working-hours`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) return;

        const data = (await response.json()) as {
          operationHours?: TOperationHours;
        };

        if (data.operationHours) {
          setOperationHours(data.operationHours);
          setIsBranchOpen(isOperationHoursOpenAt(data.operationHours, new Date()));
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    };

    loadOperationHours();

    return () => controller.abort();
  }, []);

  const price = calculateCartWithProgressiveDiscount(
    data.categories,
    cart,
    data.progressiveDiscount,
  );
  const eligibleGiftStep = useMemo(
    () =>
      data.progressiveDiscount?.steps
        .filter(
          (step) =>
            step.type === "GIFT" &&
            typeof step.amount === "number" &&
            price.fullPrice >= step.amount &&
            Boolean(step.prizes?.length),
        )
        .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0] || null,
    [data.progressiveDiscount, price.fullPrice],
  );
  const availablePrizes = eligibleGiftStep?.prizes || [];
  const prizeSelectionRequired = availablePrizes.length > 0;
  const selectedPrizeId = cart.selectedPrize?.selectedPrizeId || null;
  const selectedPrizeProductIdsByPrizeId =
    cart.selectedPrize?.selectedProductIdsByPrizeId || {};
  const selectedPrize =
    availablePrizes.find((prize) => prize.id === selectedPrizeId) || null;
  const selectedPrizeProductIds = selectedPrize
    ? selectedPrizeProductIdsByPrizeId[selectedPrize.id] || []
    : [];
  const selectedPrizeRequiredSelectionCount = selectedPrize
    ? Math.max(
        0,
        getUniquePrizeProducts(selectedPrize).length > 0
          ? selectedPrize.quantity
          : 0,
      )
    : 0;
  const isSelectedPrizeReady =
    !selectedPrize ||
    selectedPrizeRequiredSelectionCount === 0 ||
    selectedPrizeProductIds.length === selectedPrizeRequiredSelectionCount;
  const scheduleOptions = operationHours
    ? buildScheduleOptions(operationHours, new Date(), lg)
    : [];
  const selectedDeliveryAddress =
    customer?.addresses?.find((address) => address.id === selectedAddress) || null;
  const deliveryFee =
    orderType === "DELIVERY" ? selectedDeliveryAddress?.deliveryFee ?? 0 : 0;
  const taxAmount = 0;
  const tipAmount =
    (Number(selectedTip || 0) * price.discountedPrice) / 100;
  const priceWithTip =
    price.discountedPrice +
    tipAmount;
  const orderTotal = price.discountedPrice + tipAmount + deliveryFee + taxAmount;

  const handleServiceTypeSelection = (type: TOrderType) => {
    if (prizeSelectionRequired && (!selectedPrize || !isSelectedPrizeReady)) {
      setPrizeBannerShakeSignal((currentValue) => currentValue + 1);
      return;
    }

    setStep(2);
    setOrderType(type);
  };

  useEffect(() => {
    if (!scheduledAt) return;

    const isSelectedScheduleAvailable = scheduleOptions.some(
      (dayOption) =>
        dayOption.value === scheduledAt.date &&
        dayOption.times.some((timeOption) => timeOption.value === scheduledAt.time),
    );

    if (!isSelectedScheduleAvailable) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScheduledAt(null);
    }
  }, [scheduleOptions, scheduledAt]);

  const handleConfirm = async () => {
    try {
      if (!paymentType || !customer || !orderType) return;
      if (orderType === "DELIVERY" && !selectedAddress) return;
      if (isBranchOpen === false) {
        if (scheduleOptions.length === 0) {
          setScheduleError(content["noScheduleAvailability"]);
          return;
        }

        if (scheduledAt === null) {
          setScheduleError(content["selectDateAndTime"]);
          return;
        }
      }

      setScheduleError(null);
      setLoading(true);
      const scheduleFor = toScheduleForIsoString(scheduledAt);
      const order = await createOrder({
        cart: cart,
        orderType,
        paymentMethod: paymentType,
        customerId: customer.id,
        addressId: selectedAddress || undefined,
        scheduleFor,
        selectedPrize: selectedPrize
          ? {
              prizeId: selectedPrize.id,
              selectedProductIds: selectedPrizeProductIds,
            }
          : undefined,
        tipAmount: Number(selectedTip || 0),
      });
      clearCart();
      setLoading(false);
      router.push(`/menu/${lg}/confirmation/${order.id}`);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  if (step === 3)
    return (
      <div className="flex flex-col h-dvh overflow-hidden">
        <div className="bg-foreground p-4 border-[#B9BFBF] border-b flex flex-row justify-between">
          <Button
            onClick={() => setStep(2)}
            className="p-0! text-[16px] font-semibold text-text! bg-transparent flex flex-row gap-2 items-center"
          >
            <FiArrowLeft size={18} />
            <span>{content["back"]}</span>
          </Button>
        </div>
        <div className="py-6 px-4 flex flex-1 flex-col gap-4 overflow-y-auto pb-36">
          <div className="py-3 px-4 rounded-xl bg-foreground flex flex-row justify-between items-center mb-2">
            <button
              type="button"
              onClick={() => setOpenSummaryModal(true)}
              className="flex-1 text-left"
            >
              <span className="font-semibold text-sm text-lightText">
                {content["cartSummary"]}
              </span>
              <div>
                <div className={`flex flex-row items-center gap-2.5`}>
                  <div className="flex flex-row gap-2.5">
                    {price.fullPrice !== price.discountedPrice && (
                      <span className="font-semibold line-through">
                        {formatCurrency(price.fullPrice)}
                      </span>
                    )}
                    <span className="font-bold">
                      {formatCurrency(price.discountedPrice)}
                    </span>
                  </div>
                  <div>
                    <div className="bg-[#CCD0D0] rounded-md">
                      {price.discountAmount > 0 && (
                        <span className="text-xs font-semibold text-brandBackground py-1 px-1.5">
                          {formatDiscountOffLabel(price.discountAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </button>
            <div>
              <Button
                onClick={() => setOpenSummaryModal(true)}
                className="bg-brandBackground py-2! px-4 rounded-lg text-sm"
              >
                {content["view"]}
              </Button>
            </div>
          </div>
          <div className="flex flex-row items-end gap-1">
            <TextInput label="Cupom" placeholder="Insert cupom" />
            <Button className="bg-brandBackground h-14">
              {content["verify"]}
            </Button>
          </div>
          {isBranchOpen === false && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-[16px]">
                  {content["scheduleOrder"]}
                </span>
                <span className="text-sm text-lightText">
                  {content["orderForLater"]}
                </span>
              </div>
              <ScheduleSelector
                content={content}
                error={scheduleError}
                onChange={(value) => {
                  setScheduledAt(value);
                  setScheduleError(null);
                }}
                scheduleOptions={scheduleOptions}
                value={scheduledAt}
              />
              {scheduleOptions.length === 0 && (
                <span className="text-sm text-lightText">
                  {content["noScheduleAvailability"]}
                </span>
              )}
            </div>
          )}
          <PaymentTypeSelector
            selectedPaymentType={paymentType}
            onSelect={setPaymentType}
            content={content}
          />
          <TipSelector onSelect={setSelectedTip} tipSelected={selectedTip} />
        </div>
        <div className="bg-foreground pt-4 pb-8 px-4 border-[#B9BFBF] border-t fixed bottom-0 w-full flex flex-col items-center gap-2.5">
          <Button
            onClick={handleConfirm}
            disabled={
              loading || (isBranchOpen === false && scheduleOptions.length === 0)
            }
            className="bg-brandBackground w-full py-3 gap-3"
          >
            <span className="text-lg">
              {loading
                ? content["loading"]
                : `${content["confirm"]} ${formatCurrency(orderTotal)}`}
            </span>
          </Button>
        </div>
        <OrderSummaryModal
          cart={cart}
          content={content}
          customer={customer}
          data={data}
          deliveryFee={deliveryFee}
          open={openSummaryModal}
          onOpenChange={setOpenSummaryModal}
          taxAmount={taxAmount}
          tipAmount={tipAmount}
          total={orderTotal}
          lg={lg}
        />
      </div>
    );

  if (step === 2)
    return (
      <AddressStep
        customer={customer}
        setCustomer={setCustomer}
        selectedAddress={selectedAddress}
        setSelectedAddress={setSelectedAddress}
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
        name={name}
        setName={setName}
        orderType={orderType}
        content={content}
      />
    );

  return (
    <div>
      <Price cart={cart} data={data} content={content} />
      <div className="py-6 px-4 flex flex-col gap-6 pb-55">
        {prizeSelectionRequired && (
          <div
            key={`prize-banner-${prizeBannerShakeSignal}`}
            className="w-full"
            style={
              prizeBannerShakeSignal > 0
                ? { animation: "cart-prize-banner-shake 420ms ease-in-out" }
                : undefined
            }
          >
            {selectedPrize ? (
              <div className="w-full rounded-[12px] bg-[#E7E9E9] px-4 py-3 flex items-center gap-[10px]">
                <ProductImage
                  alt={selectedPrize.name}
                  src={getPrizeImageUrl(selectedPrize)}
                  className="h-[60px] w-[60px] shrink-0 rounded-[8px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[18px] font-bold leading-[1.1] text-[#0C0C0C]">
                    {selectedPrize.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenPrizeModal(true)}
                  className="shrink-0 rounded-[8px] border border-[rgba(20,40,38,0.3)] bg-[#304240] px-4 py-3 text-[14px] font-bold leading-[1.1] text-white"
                >
                  {content["change"] || "Change"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpenPrizeModal(true)}
                className="w-full rounded-[18px] border-2 border-dashed border-[#C4924C] bg-transparent px-[10px] py-4 text-left"
              >
                <div className="flex items-center justify-center gap-[10px]">
                  <FaStar size={26} className="shrink-0 text-[#E0B11C]" />
                  <span className="text-[20px] font-bold leading-none text-black">
                    {content["chooseYourPrize"] || "Choose Your Prize"}
                  </span>
                </div>
              </button>
            )}
          </div>
        )}
        {cart.items.length > 0 ? (
          cart.items.map((item) => (
            <CartListItem
              quantity={item.quantity}
              key={item.productId}
              data={data}
              cart={cart}
              cartItem={item}
              lg={lg}
            />
          ))
        ) : (
          <div className="flex flex-col gap-4 items-center py-12">
            <span className="text-lg font-semibold">{content["yourCart"]}</span>
            <Link href="/menu/en">
              <Button className="w-fit bg-brandBackground">
                {content["backToMenu"]}
              </Button>
            </Link>
          </div>
        )}
      </div>
      {cart.items.length > 0 && (
        <div className="bg-foreground pt-4 pb-8 px-4 border-[#B9BFBF] border-t fixed bottom-0 w-full flex flex-col items-center gap-2.5">
          <span className="font-bold text-lg">{content["selectService"]}</span>
          <Button
            className="bg-brandBackground w-full py-2! gap-3"
            onClick={() => handleServiceTypeSelection("DELIVERY")}
          >
            <FiTruck size={22} />
            <span className="text-lg">{content["delivery"]}</span>
          </Button>
          <Button
            className="bg-brandBackground w-full py-2! gap-3"
            onClick={() => handleServiceTypeSelection("TAKEAWAY")}
          >
            <FiShoppingBag size={22} />
            <span className="text-lg">{content["takeAway"]}</span>
          </Button>
        </div>
      )}
      {prizeSelectionRequired && (
        <PrizeSelectionModal
          key={`prize-modal-${openPrizeModal ? "open" : "closed"}-${selectedPrizeId ?? "none"}`}
          content={content}
          onOpenChange={setOpenPrizeModal}
          onConfirmSelection={(payload) => {
            setSelectedPrize({
              selectedPrizeId: payload.prizeId,
              selectedProductIdsByPrizeId: {
                ...selectedPrizeProductIdsByPrizeId,
                [payload.prizeId]: payload.productIds,
              },
            });
          }}
          lg={lg}
          open={openPrizeModal}
          initialSelectedProductIdsByPrizeId={selectedPrizeProductIdsByPrizeId}
          prizes={availablePrizes}
          selectedPrizeId={selectedPrizeId}
        />
      )}
      <style jsx global>{`
        @keyframes cart-prize-banner-shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-8px);
          }
          40% {
            transform: translateX(8px);
          }
          60% {
            transform: translateX(-5px);
          }
          80% {
            transform: translateX(5px);
          }
        }
      `}</style>
    </div>
  );
};

type TPrizeSelectionModal = {
  content: {
    [key: string]: string;
  };
  initialSelectedProductIdsByPrizeId: Record<string, string[]>;
  lg: string;
  onOpenChange: (value: boolean) => void;
  onConfirmSelection: (payload: { prizeId: string; productIds: string[] }) => void;
  open: boolean;
  prizes: TProgressiveDiscountPrize[];
  selectedPrizeId: string | null;
};

const PrizeSelectionModal: React.FC<TPrizeSelectionModal> = ({
  content,
  initialSelectedProductIdsByPrizeId,
  lg,
  onOpenChange,
  onConfirmSelection,
  open,
  prizes,
  selectedPrizeId,
}) => {
  const [pendingPrizeId, setPendingPrizeId] = useState<string | null>(
    selectedPrizeId,
  );
  const [pendingSelectedProductIdsByPrizeId, setPendingSelectedProductIdsByPrizeId] =
    useState<Record<string, string[]>>(initialSelectedProductIdsByPrizeId);

  const pendingSelectedPrize =
    prizes.find((prize) => prize.id === pendingPrizeId) || null;
  const pendingSelectedPrizeProductIds = pendingPrizeId
    ? pendingSelectedProductIdsByPrizeId[pendingPrizeId] || []
    : [];
  const pendingSelectedPrizeRequiredSelectionCount = pendingSelectedPrize
    ? Math.max(
        0,
        getUniquePrizeProducts(pendingSelectedPrize).length > 0
          ? pendingSelectedPrize.quantity
          : 0,
      )
    : 0;
  const isPendingSelectedPrizeReady =
    !!pendingSelectedPrize &&
    (pendingSelectedPrizeRequiredSelectionCount === 0 ||
      pendingSelectedPrizeProductIds.length ===
        pendingSelectedPrizeRequiredSelectionCount);

  const updatePrizeProductCount = (
    prizeId: string,
    productId: string,
    nextCount: number,
  ) => {
    const targetPrize = prizes.find((prize) => prize.id === prizeId);
    if (!targetPrize) return;
    const uniquePrizeProducts = getUniquePrizeProducts(targetPrize);
    const uniqueProductIdsSet = new Set(uniquePrizeProducts.map((product) => product.id));
    if (!uniqueProductIdsSet.has(productId)) return;

    const requiredSelectionCount = Math.max(
      0,
      uniquePrizeProducts.length > 0 ? targetPrize.quantity : 0,
    );

    setPendingSelectedProductIdsByPrizeId((current) => {
      const currentSelection = (current[prizeId] || []).filter((id) =>
        uniqueProductIdsSet.has(id),
      );
      const currentCountForProduct = currentSelection.filter(
        (id) => id === productId,
      ).length;
      const clampedNextCount = Math.max(0, nextCount);

      if (
        requiredSelectionCount > 0 &&
        currentSelection.length >= requiredSelectionCount &&
        clampedNextCount > currentCountForProduct
      ) {
        const swappedSelection = [...currentSelection];
        let swapsNeeded = clampedNextCount - currentCountForProduct;

        while (swapsNeeded > 0) {
          const removableIndex = swappedSelection.findIndex((id) => id !== productId);
          if (removableIndex === -1) {
            break;
          }

          swappedSelection.splice(removableIndex, 1);
          swappedSelection.push(productId);
          swapsNeeded -= 1;
        }

        if (swappedSelection.length === currentSelection.length) {
          return {
            ...current,
            [prizeId]: swappedSelection,
          };
        }

        return {
          ...current,
          [prizeId]: swappedSelection,
        };
      }

      const otherProductsCount = currentSelection.length - currentCountForProduct;
      const maxCountForProduct = Math.max(0, requiredSelectionCount - otherProductsCount);
      const resolvedNextCount = Math.min(clampedNextCount, maxCountForProduct);

      return {
        ...current,
        [prizeId]: [
          ...currentSelection.filter((id) => id !== productId),
          ...Array.from({ length: resolvedNextCount }, () => productId),
        ],
      };
    });
  };

  const handleConfirm = () => {
    if (!pendingPrizeId || !isPendingSelectedPrizeReady) return;

    onConfirmSelection({
      prizeId: pendingPrizeId,
      productIds: pendingSelectedProductIdsByPrizeId[pendingPrizeId] || [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="w-dvw h-dvh bg-[#E7E9E9] fixed top-0 left-0 z-50 flex flex-col gap-8 p-4">
        <Dialog.Title className="sr-only">
          {content["prizeSelection"] || "Prize selection"}
        </Dialog.Title>
        <div className="flex w-full items-center justify-between">
          <span className="text-[16px] font-bold leading-[1.1] text-[#0C0C0C]">
            {content["choosePrizeModalTitle"] || "Choose you prize"}
          </span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-5 w-5 items-center justify-center text-[#0C0C0C]"
          >
            <FiX size={20} />
          </button>
        </div>
        <div className="flex w-full flex-col gap-2">
          {prizes.map((prize) => {
            const isSelected = pendingPrizeId === prize.id;
            const uniquePrizeProducts = getUniquePrizeProducts(prize);
            const fallbackName = uniquePrizeProducts[0]?.name || "Prize";
            const prizeLabel =
              prize.name?.trim() || `${prize.quantity} ${fallbackName}`;
            const prizeRequiredSelectionCount = Math.max(
              0,
              uniquePrizeProducts.length > 0 ? prize.quantity : 0,
            );
            const uniqueProductIdsSet = new Set(
              uniquePrizeProducts.map((product) => product.id),
            );
            const prizeSelectedProductIds = (
              pendingSelectedProductIdsByPrizeId[prize.id] || []
            ).filter((id) => uniqueProductIdsSet.has(id));
            const progressRatio =
              prizeRequiredSelectionCount > 0
                ? Math.min(
                    1,
                    prizeSelectedProductIds.length / prizeRequiredSelectionCount,
                  )
                : 0;

            return (
              <div
                key={prize.id}
                className={`w-full rounded-[12px] bg-white ${
                  isSelected ? "border-2 border-[#142826]" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setPendingPrizeId(prize.id)}
                  className="flex w-full items-center gap-[10px] px-4 py-3 text-left"
                >
                  <ProductImage
                    alt={prizeLabel}
                    src={getPrizeImageUrl(prize)}
                    className="h-[60px] w-[60px] shrink-0 rounded-[8px] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[18px] font-bold leading-[1.1] text-[#0C0C0C]">
                      {prizeLabel}
                    </span>
                  </div>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? "border-[#142826]" : "border-[#CCCCCC]"
                    }`}
                  >
                    {isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#142826]" />
                    )}
                  </span>
                </button>

                {isSelected && uniquePrizeProducts.length > 0 && (
                  <div className="relative px-4 pb-3">
                    <div className="grid grid-cols-3 gap-[10px]">
                      {uniquePrizeProducts.map((product) => {
                        const productSelectedCount = prizeSelectedProductIds.filter(
                          (id) => id === product.id,
                        ).length;
                        const hasReachedRequiredTotal =
                          prizeRequiredSelectionCount > 0 &&
                          prizeSelectedProductIds.length >=
                            prizeRequiredSelectionCount;
                        const hasAnotherSelectedProduct =
                          prizeSelectedProductIds.some((id) => id !== product.id);
                        const canIncrement =
                          prizeRequiredSelectionCount > 0 &&
                          (!hasReachedRequiredTotal || hasAnotherSelectedProduct);

                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() =>
                              updatePrizeProductCount(
                                prize.id,
                                product.id,
                                productSelectedCount + 1,
                              )
                            }
                            disabled={!canIncrement}
                            className={`flex flex-col items-center gap-2 text-center ${
                              !canIncrement ? "opacity-80" : ""
                            }`}
                          >
                            <div className="relative w-full">
                              <ProductImage
                                alt={resolvePrizeProductTitle(product, lg)}
                                src={product.photos?.[0]?.url}
                                className={`aspect-square w-full rounded-[12px] object-cover ${
                                  productSelectedCount > 0 ? "ring-2 ring-[#142826]" : ""
                                }`}
                              />
                              {productSelectedCount > 0 && (
                                <div className="absolute right-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#304240] px-1">
                                  <span className="text-xs font-bold text-white">
                                    {productSelectedCount}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-[16px] font-bold leading-[1.1] text-black">
                              {resolvePrizeProductTitle(product, lg)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 h-[15px] w-full overflow-hidden rounded-[100px] bg-[#E7E9E9]">
                      <div
                        className="h-full rounded-[100px] bg-[#142826] transition-all"
                        style={{ width: `${progressRatio * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isPendingSelectedPrizeReady}
          className={`h-[52px] w-full rounded-[8px] border border-[rgba(20,40,38,0.3)] bg-[#304240] text-[18px] font-bold leading-[1.1] text-white ${
            !isPendingSelectedPrizeReady ? "opacity-50" : ""
          }`}
        >
          {content["confirm"] || "Confirm"}
        </button>
      </Dialog.Content>
    </Dialog.Root>
  );
};

type TScheduleSelector = {
  content: {
    [key: string]: string;
  };
  error: string | null;
  onChange: (value: ScheduleSelection) => void;
  scheduleOptions: ScheduleDayOption[];
  value: ScheduleSelection | null;
};

const ScheduleSelector: React.FC<TScheduleSelector> = ({
  content,
  error,
  onChange,
  scheduleOptions,
  value,
}) => {
  const errorId = "schedule-selector-error";
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    value?.date || scheduleOptions[0]?.value || null,
  );

  useEffect(() => {
    if (value?.date) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDate(value.date);
      return;
    }

    if (!scheduleOptions.some((option) => option.value === selectedDate)) {
      setSelectedDate(scheduleOptions[0]?.value || null);
    }
  }, [scheduleOptions, selectedDate, value?.date]);

  const selectedDay =
    scheduleOptions.find((option) => option.value === selectedDate) || null;
  const displayValue = value
    ? formatSelectedScheduleLabel(value, scheduleOptions)
    : content["selectDateAndTime"];

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* <label className="text-[16px] font-semibold text-neutral-700">
        {content["scheduleDateTime"]} *
      </label> */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            disabled={scheduleOptions.length === 0}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`w-full flex items-center justify-between rounded-xl bg-foreground text-lg px-3 py-3 transition border-2 ${
              error
                ? "border-red-500"
                : "border-foreground"
            } ${scheduleOptions.length === 0 ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <FiCalendar className="text-neutral-500 shrink-0" />
              <span
                className={`truncate text-left ${
                  value ? "text-text" : "text-lightText"
                }`}
              >
                {displayValue}
              </span>
            </div>
            <FiChevronDown className="text-neutral-500 shrink-0" />
          </button>
        </Dialog.Trigger>
        <Dialog.Content className="w-dvw h-dvh bg-background fixed top-0 left-0 z-50 flex flex-col">
          <Dialog.Title className="sr-only">
            {content["scheduleDateTime"]}
          </Dialog.Title>
          <div className="flex flex-row justify-between items-center px-4 py-3 bg-foreground border-[#CCD0D0] border-b">
            <Button className="p-2! bg-transparent text-text! opacity-0">
              <FiX />
            </Button>
            <span className="font-semibold">{content["scheduleOrder"]}</span>
            <Button
              onClick={() => setOpen(false)}
              className="p-2! bg-transparent text-text!"
            >
              <FiX size={18} />
            </Button>
          </div>
          <div className="px-4 py-4 flex flex-col gap-6 overflow-y-auto">
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-[16px]">
                {content["chooseAvailableDate"]}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {scheduleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedDate(option.value)}
                    className={`rounded-xl border-2 px-3 py-3 text-left transition ${
                      selectedDate === option.value
                        ? "border-brandBackground bg-brandBackground/10"
                        : "border-foreground bg-foreground"
                    }`}
                  >
                    <span className="block font-semibold capitalize">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-[16px]">
                {content["chooseAvailableTime"]}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {selectedDay?.times.map((timeOption) => {
                  const isSelected =
                    value?.date === selectedDay.value &&
                    value.time === timeOption.value;

                  return (
                    <button
                      key={`${selectedDay.value}-${timeOption.value}`}
                      type="button"
                      onClick={() => {
                        onChange({
                          date: selectedDay.value,
                          time: timeOption.value,
                        });
                        setOpen(false);
                      }}
                      className={`rounded-xl border-2 px-3 py-3 text-left transition ${
                        isSelected
                          ? "border-brandBackground bg-brandBackground/10"
                          : "border-foreground bg-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <FiClock className="shrink-0" />
                        {timeOption.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Root>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-[16px] font-medium text-red-500"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
};

type TAddressStep = {
  onBack: () => void;
  onNext: () => void;
  selectedAddress: string | null;
  setSelectedAddress: (value: string | null) => void;
  customer: TCustomer | null;
  setCustomer: (data: TCustomer | null) => void;
  name: string | null;
  setName: (value: string | null) => void;
  orderType: TOrderType | null;
  content: {
    [key: string]: string;
  };
};

type TOrderSummaryModal = {
  cart?: TCart;
  content: {
    [key: string]: string;
  };
  customer?: TCustomer | null;
  data?: TGetProductsResponse;
  deliveryFee?: number;
  lg: string;
  onOpenChange?: (value: boolean) => void;
  open?: boolean;
  order?: TOrder;
  progressiveDiscountSnapshot?: TOrderProgressiveDiscountSnapshot | null;
  showSummaryCard?: boolean;
  taxAmount?: number;
  tipAmount?: number;
  total?: number;
};

export const OrderSummaryModal: React.FC<TOrderSummaryModal> = ({
  cart,
  content,
  data,
  deliveryFee,
  lg,
  onOpenChange,
  open,
  order,
  progressiveDiscountSnapshot,
  showSummaryCard,
  taxAmount,
  tipAmount,
  total,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const resolvedOpen = open ?? internalOpen;
  const resolvedOnOpenChange = onOpenChange ?? setInternalOpen;
  const isOrderMode = Boolean(order);
  const resolvedProgressiveDiscountSnapshot = isOrderMode
    ? progressiveDiscountSnapshot ?? order?.progressiveDiscountSnapshot ?? null
    : null;
  const prizeBadgeLabel = content["prize"] || "Prize";
  const orderPrizeSummaryLineItems = isOrderMode
    ? buildPrizeSummaryLineItems({
        availableProducts:
          resolvedProgressiveDiscountSnapshot?.selectedPrize?.availableProducts || [],
        lg,
        selectedProductCounts:
          resolvedProgressiveDiscountSnapshot?.selectedPrize?.selectedProductCounts ||
          [],
        selectedProductIds:
          resolvedProgressiveDiscountSnapshot?.selectedPrize?.selectedProductIds || [],
      })
    : [];
  const cartPrizeSummaryLineItems =
    !isOrderMode &&
    cart?.selectedPrize?.selectedPrizeId &&
    data?.progressiveDiscount
      ? (() => {
          const availablePrizes = data.progressiveDiscount.steps.flatMap(
            (step) => step.prizes || [],
          );
          const selectedPrize = availablePrizes.find(
            (prize) => prize.id === cart.selectedPrize?.selectedPrizeId,
          );
          if (!selectedPrize) return [];

          return buildPrizeSummaryLineItems({
            availableProducts: selectedPrize.products,
            lg,
            selectedProductIds:
              cart.selectedPrize?.selectedProductIdsByPrizeId?.[selectedPrize.id] ||
              [],
          });
        })()
      : [];
  const prizeSummaryLineItems = isOrderMode
    ? orderPrizeSummaryLineItems
    : cartPrizeSummaryLineItems;
  const orderProductsFullSubtotal = order?.orderProducts.reduce(
    (sum, item) => sum + item.fullAmount * item.quantity,
    0,
  ) ?? 0;
  const orderProductsDiscountedSubtotal = order?.orderProducts.reduce(
    (sum, item) => sum + item.amount * item.quantity,
    0,
  ) ?? 0;
  const cartPricingSummary =
    cart && data
      ? calculateCartWithProgressiveDiscount(
          data.categories,
          cart,
          data.progressiveDiscount,
        )
      : null;
  const baseProductCount = isOrderMode
    ? order?.orderProducts.reduce((sum, item) => sum + item.quantity, 0) ?? 0
    : cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const prizeProductCount = prizeSummaryLineItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const productCount = baseProductCount + prizeProductCount;
  const resolvedDeliveryFee = order?.deliveryFee ?? deliveryFee ?? 0;
  const resolvedTaxAmount = taxAmount ?? 0;
  const subtotal = isOrderMode
    ? resolvedProgressiveDiscountSnapshot?.fullPrice ?? orderProductsFullSubtotal
    : cartPricingSummary?.fullPrice ?? 0;
  const discountedSubtotal = isOrderMode
    ? resolvedProgressiveDiscountSnapshot?.discountedPrice ??
      order?.subtotalAmount ??
      orderProductsDiscountedSubtotal
    : cartPricingSummary?.discountedPrice ?? 0;
  const resolvedDiscountAmount = isOrderMode
    ? resolvedProgressiveDiscountSnapshot?.discountAmount ??
      Math.max(0, subtotal - discountedSubtotal)
    : cartPricingSummary?.discountAmount ?? 0;
  const totalWithoutFees = Math.max(0, subtotal - resolvedDiscountAmount);
  const resolvedTipAmount = isOrderMode
    ? Math.round((totalWithoutFees * (order?.tipAmount ?? 0)) / 100)
    : tipAmount ?? 0;
  const resolvedTotal = isOrderMode
    ? order?.totalAmount ??
      totalWithoutFees + resolvedDeliveryFee + resolvedTipAmount + resolvedTaxAmount
    : total ??
      totalWithoutFees + resolvedDeliveryFee + resolvedTipAmount + resolvedTaxAmount;
  const title = isOrderMode ? content["billSummary"] : content["cartSummary"];
  const [productsExpanded, setProductsExpanded] = useState(true);

  return (
    <>
      {showSummaryCard && (
        <div className="w-full max-w-[900px] px-4">
          <button
            type="button"
            onClick={() => resolvedOnOpenChange(true)}
            className={`flex w-full items-center justify-between gap-4 border-t border-t-[#E6E6E6] py-6 text-left ${montserrat.className}`}
          >
            <div className="flex flex-col">
              <span className="text-base font-bold text-text">{title}</span>
              <span className="text-lightText font-medium">
                {productCount} {content["products"]}
              </span>
            </div>
            <FiChevronRight className="text-text" />
          </button>
        </div>
      )}
      <Dialog.Root open={resolvedOpen} onOpenChange={resolvedOnOpenChange}>
        <Dialog.Overlay className="bg-black/40 fixed inset-0 z-40" />
        <Dialog.Content
          className={`w-dvw h-dvh bg-background fixed top-0 left-0 z-50 flex flex-col max-w-[900px] right-0 mx-auto ${montserrat.className}`}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <div className="flex flex-row items-center gap-3 px-4 py-4 bg-foreground border-[#E6E6E6] border-b justify-between">
            
            <span className="font-semibold text-lg leading-none">{title}</span>
            <Button
              onClick={() => resolvedOnOpenChange(false)}
              className="p-0! bg-transparent text-text! min-w-0 h-auto"
            >
              <FiX size={18} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setProductsExpanded((value) => !value)}
                className="flex items-center justify-between gap-3 text-left"
              >
                <span className="font-semibold text-xl leading-tight text-text">
                  {content["yourProducts"]} ({productCount})
                </span>
                <FiChevronDown
                  size={20}
                  className={`shrink-0 transition-transform ${
                    productsExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              {productsExpanded && (
                <div className="flex flex-col">
                  {isOrderMode
                    ? order?.orderProducts.map((item, index) => {
                        const productName =
                          item.product?.translations?.[lg]?.title ||
                          item.product?.name ||
                          "";
                        const lineTotal = item.fullAmount * item.quantity;
                        const modifierGroups = buildSelectedModifierGroupsFromOrderProduct(
                          item,
                          lg,
                          content["modifiers"] || "Modifiers",
                        );
                        const totalOrderSummaryLines =
                          (order?.orderProducts.length || 0) +
                          orderPrizeSummaryLineItems.length;

                        return (
                          <OrderSummaryLineItem
                            key={item.id}
                            comments={item.comments}
                            modifierGroups={modifierGroups}
                            name={productName}
                            price={lineTotal}
                            quantity={item.quantity}
                            showDivider={index < (totalOrderSummaryLines - 1)}
                          />
                        );
                      }).concat(
                        orderPrizeSummaryLineItems.map((item, index) => {
                          const orderItemsLength = order?.orderProducts.length || 0;
                          const totalOrderSummaryLines =
                            orderItemsLength + orderPrizeSummaryLineItems.length;
                          const currentLineIndex = orderItemsLength + index;

                          return (
                            <OrderSummaryLineItem
                              key={`prize-${item.id}-${index}`}
                              badgeLabel={prizeBadgeLabel}
                              modifierGroups={[]}
                              name={item.name}
                              price={0}
                              quantity={item.quantity}
                              showDivider={currentLineIndex < (totalOrderSummaryLines - 1)}
                            />
                          );
                        }),
                      )
                    : cart &&
                      data &&
                      cart.items.map((item, index) => (
                        <OrderSummaryItem
                          cart={cart}
                          cartItem={item}
                          content={content}
                          data={data}
                          key={item.cartId || item.productId}
                          lg={lg}
                          showDivider={
                            index <
                            cart.items.length + cartPrizeSummaryLineItems.length - 1
                          }
                        />
                      )).concat(
                        cartPrizeSummaryLineItems.map((item, index) => {
                          const currentLineIndex = cart.items.length + index;
                          const totalCartSummaryLines =
                            cart.items.length + cartPrizeSummaryLineItems.length;

                          return (
                            <OrderSummaryLineItem
                              key={`prize-${item.id}-${index}`}
                              badgeLabel={prizeBadgeLabel}
                              modifierGroups={[]}
                              name={item.name}
                              price={0}
                              quantity={item.quantity}
                              showDivider={currentLineIndex < (totalCartSummaryLines - 1)}
                            />
                          );
                        }),
                      )}
                </div>
              )}
            </div>
            <div className="border-t border-[#E6E6E6] pt-6 flex flex-col gap-3">
              <SummaryRow
                label={content["totalProducts"]}
                value={formatCurrency(subtotal)}
                muted
              />
              {resolvedDiscountAmount > 0 && (
                <SummaryRow
                  label={content["discount"] || "Discount"}
                  value={`-${formatCurrency(resolvedDiscountAmount)}`}
                  muted
                />
              )}
              <SummaryRow
                label={content["deliveryFee"]}
                value={formatCurrency(resolvedDeliveryFee)}
              />
              {resolvedTipAmount > 0 && (
                <SummaryRow
                  label={content["tip"]}
                  value={formatCurrency(resolvedTipAmount)}
                />
              )}
              <SummaryRow
                label={content["salesTax"] || "Sales tax"}
                value={formatCurrency(resolvedTaxAmount)}
              />
              <div className="border-t border-[#E6E6E6] border-dashed pt-3">
                <SummaryRow
                  label={content["totalLabel"]}
                  value={formatCurrency(resolvedTotal)}
                  strong
                />
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

type TSummaryRow = {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
};

const SummaryRow: React.FC<TSummaryRow> = ({
  label,
  value,
  strong,
  muted,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 font-medium">
      <span
        className={
          strong
            ? "font-bold text-base tracking-tight text-text"
            : muted
              ? "text-[#7A7A7A] text-[16px]"
              : "text-text text-base"
        }
      >
        {label}
      </span>
      <span
        className={
          strong
            ? "font-bold text-base tracking-tight text-text"
            : muted
              ? "font-medium text-[#7A7A7A] text-[16px]"
              : "font-medium text-text text-base"
        }
      >
        {value}
      </span>
    </div>
  );
};

export type TInputError = {
  field: string;
  message: string;
} | null;

const AddressStep: React.FC<TAddressStep> = ({
  onBack,
  onNext,
  selectedAddress,
  setSelectedAddress,
  customer,
  setCustomer,
  name,
  setName,
  orderType,
  content,
}) => {
  const [phoneData, setPhoneData] = useState<PhoneValue | null>(null);
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<PhoneValue["country"]>("US");
  const [loading, setLoading] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);
  const [error, setError] = useState<TInputError>(null);

  useEffect(() => {
    const storedSession = getStoredCustomerSession();
    if (!storedSession) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhoneValue(storedSession.phone);
    setPhoneCountry(
      (storedSession.phoneCountry as PhoneValue["country"] | undefined) || "US",
    );
    setPhoneData({
      country:
        (storedSession.phoneCountry as PhoneValue["country"] | undefined) || "US",
      raw: storedSession.phone,
      formatted: storedSession.phone,
      e164: null,
      isValid: true,
    });
    setCustomer(storedSession.customer);
    setName(storedSession.customer.name);

    if (
      storedSession.selectedAddressId &&
      storedSession.customer.addresses?.some(
        (address) => address.id === storedSession.selectedAddressId,
      )
    ) {
      setSelectedAddress(storedSession.selectedAddressId);
    }
  }, [setCustomer, setName, setSelectedAddress]);

  useEffect(() => {
    if (!customer || !phoneData?.raw) return;

    setStoredCustomerSession({
      customer,
      phone: phoneData.raw,
      phoneCountry: phoneData.country,
      selectedAddressId: selectedAddress || undefined,
    });
  }, [customer, phoneData?.raw, selectedAddress]);

  const handleConfirm = async () => {
    if (phoneData === null)
      return setError({
        field: "phone",
        message: content["validPhone"],
      });
    if (phoneData.isValid === false)
      return setError({
        field: "phone",
        message: content["validPhone"],
      });
    setError(null);
    if (!customer) {
      setLoading(true);
      const customer = await getCustomerData({
        phone: phoneData.raw,
      });
      setName(customer.name);
      setCustomer(customer);
      setStoredCustomerSession({
        customer,
        phone: phoneData.raw,
        phoneCountry: phoneData.country,
        selectedAddressId: selectedAddress || undefined,
      });
      setLoading(false);
    } else {
      if (!name || name.length === 0)
        return setError({
          field: "name",
          message: content["insertName"],
        });
      if (orderType === "DELIVERY") {
        if (!selectedAddress)
          return setError({
            field: "address",
            message: content["selectAddress"],
          });
      }
      if (!customer.name || customer.name.length === 0) {
        setLoading(true);
        const updatedCustomer = await updateCustomerName({
          customerId: customer.id,
          name: name,
        });
        setCustomer({
          ...customer,
          name: updatedCustomer.name,
        });
        setStoredCustomerSession({
          customer: {
            ...customer,
            name: updatedCustomer.name,
          },
          phone: phoneData.raw,
          phoneCountry: phoneData.country,
          selectedAddressId: selectedAddress || undefined,
        });
        setLoading(false);
      }

      onNext();
    }
  };

  const handleConfirmAddress = async (data: TAddress) => {
    if (!phoneData) return;
    const customer = await getCustomerData({
      phone: phoneData.raw,
    });
    setCustomer(customer);
    setSelectedAddress(data.id);
    setStoredCustomerSession({
      customer,
      phone: phoneData.raw,
      phoneCountry: phoneData.country,
      selectedAddressId: data.id,
    });
    // if (!data.address.raw.address?.house_number || !customer) return;
    // await addNewDeliveryAddress({
    //   address: {
    //     id: "",
    //     city: data.address.city,
    //     description: data.address.raw.display_name,
    //     lat: data.address.lat.toString(),
    //     lng: data.address.lon.toString(),
    //     number: data.address.raw.address?.house_number,
    //     state: data.address.state,
    //     street: data.address.street1,
    //     zipCode: data.address.zip,
    //     numberComplement: data.number || undefined,
    //     complement: data.complement || undefined,
    //     createdAt: "",
    //     customerId: customer.id,
    //   },
    // });
  };

  return (
    <>
      <div
        className="flex flex-col overflow-hidden"
        style={{
          height: "calc(100dvh - var(--menu-sticky-offset))",
        }}
      >
        <div className="bg-foreground p-4 border-[#B9BFBF] border-b flex flex-row justify-between">
          <Button
            onClick={() => onBack()}
            className="p-0! text-[16px] font-semibold text-text! bg-transparent flex flex-row gap-2 items-center"
          >
            <FiArrowLeft size={18} />
            <span>{content["back"]}</span>
          </Button>
        </div>
        <div className="pt-6 px-4 flex flex-1 flex-col gap-6 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-[16px]">
              {content["phone"]}
            </span>
            <PhoneInput
              defaultCountry={phoneCountry}
              onClear={() => {
                clearStoredCustomerSession();
                setCustomer(null);
                setPhoneData(null);
                setPhoneValue("");
                setPhoneCountry("US");
                setName(null);
                setSelectedAddress(null);
              }}
              value={phoneValue}
              onChange={(value) => {
                setPhoneData(value);
                setPhoneCountry(value.country);
              }}
              block={customer !== null}
            />
            {error?.field === "phone" && (
              <span className="text-red-600 text-sm">{error.message}</span>
            )}
          </div>
          {customer && (
            <>
              <TextInput
                label="Name"
                error={error?.field === "name" ? error.message : undefined}
                placeholder={content["yourName"]}
                disabled={customer.name !== null}
                value={name || ""}
                onChange={(e) => {
                  setError(null);
                  setName(e.target.value);
                }}
              />
              {orderType === "DELIVERY" && (
                <div className="flex flex-col gap-2 pb-8">
                  <span className="font-semibold">
                    {content["deliveryAddress"]}
                  </span>
                  {!customer.addresses || customer.addresses.length === 0 ? (
                    <div className="py-2 flex flex-col items-center">
                      <span className="font-medium text-lightText">
                        {content["noAddress"]}
                      </span>
                    </div>
                  ) : (
                    <AddressSelector
                      addresses={customer.addresses}
                      content={content}
                      onSelect={setSelectedAddress}
                      selectedAddress={selectedAddress}
                    />
                  )}
                  <Button
                    onClick={() => setOpenAddress(true)}
                    className="text-[16px]! py-3  bg-brandBackground flex flex-row gap-2"
                  >
                    <FiPlus size={18} />
                    {content["addNew"]}
                  </Button>
                  {error && error.field === "address" && (
                    <span className="text-lg text-red-600">{error.message}</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="bg-foreground pt-4 pb-8 px-4 border-[#B9BFBF] border-t w-full flex flex-col items-center gap-2.5 sticky bottom-0">
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-brandBackground w-full py-3 gap-3"
          >
            <span className="text-lg">
              {loading ? content["loading"] : content["confirm"]}
            </span>
          </Button>
        </div>
        {orderType === "DELIVERY" && (
          <FindAddressModal
            onConfirm={handleConfirmAddress}
            onOpenChange={setOpenAddress}
            open={openAddress}
            custumerId={customer?.id}
            content={content}
          />
        )}
      </div>
    </>
  );
};

type TTipSelector = {
  tipSelected: string | null;
  onSelect: (value: string) => void;
};

const TipSelector: React.FC<TTipSelector> = ({ onSelect, tipSelected }) => {
  const customTipValue =
    tipSelected && !["10", "15", "20"].includes(tipSelected) ? tipSelected : "";

  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold">Tip</span>
      <div className="flex flex-rowa gap-2">
        <div
          onClick={() => onSelect("10")}
          className={`px-3 py-3 rounded-xl bg-foreground font-medium text-lg flex flex-row justify-between items-center border-2 transition ${"10" === tipSelected ? "border-brandBackground" : "border-foreground"}`}
        >
          <div>
            <span className="flex-1">%10</span>
          </div>
        </div>
        <div
          onClick={() => onSelect("15")}
          className={`px-3 py-3 rounded-xl bg-foreground font-medium text-lg flex flex-row justify-between items-center border-2 transition ${"15" === tipSelected ? "border-brandBackground" : "border-foreground"}`}
        >
          <div>
            <span className="flex-1">%15</span>
          </div>
        </div>
        <div
          onClick={() => onSelect("20")}
          className={`px-3 py-3 rounded-xl bg-foreground font-medium text-lg flex flex-row justify-between items-center border-2 transition ${"20" === tipSelected ? "border-brandBackground" : "border-foreground"}`}
        >
          <div>
            <span className="flex-1">%20</span>
          </div>
        </div>
        <div>
          <TextInput
            prefix="%"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={customTipValue}
            onChange={(e) => onSelect(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              const allowedKeys = [
                "Backspace",
                "Delete",
                "ArrowLeft",
                "ArrowRight",
                "Tab",
                "Home",
                "End",
              ];

              if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
                return;
              }

              if (!/^\d$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pastedValue = e.clipboardData
                .getData("text")
                .replace(/\D/g, "");
              onSelect(pastedValue);
            }}
            leftIcon="%"
            placeholder="Other"
          />
        </div>
      </div>
    </div>
  );
};

type TPaymentTypeSelector = {
  selectedPaymentType: TPaymentMethod | null;
  onSelect: (value: TPaymentMethod) => void;
  content: {
    [key: string]: string;
  };
};

const PaymentTypeSelector: React.FC<TPaymentTypeSelector> = ({
  onSelect,
  selectedPaymentType,
  content,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold">{content["paymentMethod"]}</span>
      <div
        onClick={() => onSelect("CASH")}
        className={`px-3 py-3 rounded-xl bg-foreground font-medium text-lg flex flex-row justify-between items-center border-2 transition ${"CASH" === selectedPaymentType ? "border-brandBackground" : "border-foreground"}`}
      >
        <div>
          <span className="flex-1">{content["cash"]}</span>
        </div>
        <div
          className={`h-5 w-5 flex items-center justify-center ${"CASH" === selectedPaymentType ? "border-brandBackground" : "border-[#CCD0D0]"} border-2 rounded-full`}
        >
          <div
            className={`h-3 w-3 rounded-full ${"CASH" === selectedPaymentType ? "bg-brandBackground" : "bg-transparent"}`}
          ></div>
        </div>
      </div>
      <div
        onClick={() => onSelect("CARD")}
        className={`px-3 py-3 rounded-xl bg-foreground font-medium text-lg flex flex-row justify-between items-center border-2 transition ${"CARD" === selectedPaymentType ? "border-brandBackground" : "border-foreground"}`}
      >
        <div>
          <span className="flex-1">{content["card"]}</span>
        </div>
        <div
          className={`h-5 w-5 flex items-center justify-center ${"CARD" === selectedPaymentType ? "border-brandBackground" : "border-[#CCD0D0]"} border-2 rounded-full`}
        >
          <div
            className={`h-3 w-3 rounded-full ${"CARD" === selectedPaymentType ? "bg-brandBackground" : "bg-transparent"}`}
          ></div>
        </div>
      </div>
    </div>
  );
};

type TAddressSelector = {
  addresses: TAddress[];
  content: {
    [key: string]: string;
  };
  selectedAddress: string | null;
  onSelect: (value: string) => void;
};

const AddressSelector: React.FC<TAddressSelector> = ({
  addresses,
  content,
  onSelect,
  selectedAddress,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {addresses.map((address) => (
        <div
          onClick={() => onSelect(address.id)}
          key={address.id}
          className={`px-3 py-3 rounded-xl bg-foreground font-medium text-[16px] flex flex-row justify-between items-center border-2 transition ${selectedAddress === address.id ? "border-brandBackground" : "border-foreground"}`}
        >
          <div className="flex flex-1 items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="flex-1">{`${address.street}, ${address.city}`}</span>
               {typeof address.deliveryFee === "number" && (
              <div className="shrink-0 self-start whitespace-nowrap text-sm text-lightText">
                {formatCurrency(address.deliveryFee)} {content["deliveryFee"]}
              </div>
            )}
              {address.complement && (
                <div className="text-sm text-lightText">{address.complement}</div>
              )}
            </div>
           
          </div>
          <div
            className={`h-5 w-5 flex items-center justify-center ${address.id === selectedAddress ? "border-brandBackground" : "border-[#CCD0D0]"} border-2 rounded-full`}
          >
            <div
              className={`h-3 w-3 rounded-full ${address.id === selectedAddress ? "bg-brandBackground" : "bg-transparent"}`}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

type TFindAddressModal = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onConfirm: (data: TAddress) => Promise<void>;
  custumerId?: string;
  content: {
    [key: string]: string;
  };
};

const FindAddressModal: React.FC<TFindAddressModal> = ({
  onOpenChange,
  open,
  onConfirm,
  custumerId,
  content,
}) => {
  const [selectedAddress, setSelectedAddress] = useState<TAddressValue | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedAddress) return;
    if (!selectedAddress.raw.address?.house_number) return;
    setLoading(true);
    setError(null);
    try {
      const address = await addNewDeliveryAddress({
        address: {
          id: "",
          city: selectedAddress.city,
          description: selectedAddress.raw.display_name,
          lat: selectedAddress.lat.toString(),
          lng: selectedAddress.lon.toString(),
          number: selectedAddress.raw.address?.house_number,
          state: selectedAddress.state,
          street: selectedAddress.street1,
          zipCode: selectedAddress.zip,
          numberComplement: number || undefined,
          complement: complement || undefined,
          createdAt: "",
          customerId: custumerId,
        },
      });
      await onConfirm(address);
      onOpenChange(false);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "OUTSIDE_DELIVERY_COVERAGE_AREA"
      ) {
        setError(content["outsideCoverageArea"]);
      } else {
        setError(content["addressSaveError"]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="w-dvw h-dvh bg-background fixed top-0">
        <Dialog.Title className="sr-only">
          {content["addAddress"]}
        </Dialog.Title>
        <div className="flex flex-row justify-between items-center px-4 py-3 bg-foreground border-[#CCD0D0] border-b">
          <Button className="p-2! bg-transparent text-text! opacity-0">
            <FiX />
          </Button>
          <span className="font-semibold">{content["addAddress"]}</span>
          <Button
            onClick={() => onOpenChange(false)}
            className="p-2! bg-transparent text-text!"
          >
            <FiX size={18} />
          </Button>
        </div>
        <div className="py-4 px-4 flex flex-col gap-3">
          <AddressAutocompleteInput
            onSelect={(value) => {
              setSelectedAddress(value);
              setError(null);
            }}
            selected={selectedAddress}
          />
          {selectedAddress !== null && (
            <>
              <TextInput
                value={number}
                onChange={(e) => {
                  setNumber(e.target.value);
                  setError(null);
                }}
                label={content["numberAppartment"]}
              />
              <TextInput
                value={complement}
                onChange={(e) => {
                  setComplement(e.target.value);
                  setError(null);
                }}
                label={content["reference"]}
              />
            </>
          )}
          {error && <span className="text-red-600 text-sm">{error}</span>}
        </div>
        <div className="bottom-0 bg-foreground pt-4 px-4 pb-8 w-full fixed border-t border-[#CCD0D0]">
          <Button
            disabled={selectedAddress === null || loading}
            onClick={() => handleConfirm()}
            className="bg-brandBackground w-full disabled:opacity-50"
          >
            {loading ? content["loading"] : content["confirmAddress"]}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

type TCartListItem = {
  data: TGetProductsResponse;
  cartItem: TCartItem;
  quantity: number;
  cart: TCart;
  lg: string;
};

type TOrderSummaryItem = {
  cart: TCart;
  cartItem: TCartItem;
  content: {
    [key: string]: string;
  };
  data: TGetProductsResponse;
  lg: string;
  showDivider?: boolean;
};

const OrderSummaryItem: React.FC<TOrderSummaryItem> = ({
  cart,
  cartItem,
  data,
  lg,
  showDivider,
}) => {
  const findProduct = findProductById(data.categories, cartItem.productId);
  const selectedModifierGroups = buildSelectedModifierGroupsFromCartItem(
    findProduct,
    cartItem,
    lg,
  );
  const price = calculateProductPriceWithProgressiveDiscount(
    cartItem.productId,
    data.progressiveDiscount,
    cart,
    data.categories,
    { cartItem },
  );
  const itemTotal = price ? price.fullPrice * cartItem.quantity : 0;

  return (
    <OrderSummaryLineItem
      comments={cartItem.description}
      modifierGroups={selectedModifierGroups}
      name={
        findProduct?.translations
          ? findProduct.translations[lg] && findProduct.translations[lg]["title"] || findProduct.name
          : findProduct?.name || ""
      }
      price={itemTotal}
      quantity={cartItem.quantity}
      showDivider={showDivider}
    />
  );
};

type TOrderSummaryLineItem = {
  badgeLabel?: string;
  comments?: string;
  modifierGroups: TSummaryModifierGroup[];
  name: string;
  price: number;
  quantity: number;
  showDivider?: boolean;
};

const OrderSummaryLineItem: React.FC<TOrderSummaryLineItem> = ({
  badgeLabel,
  comments,
  modifierGroups,
  name,
  price,
  quantity,
  showDivider,
}) => {
  return (
    <div
      className={`py-3 ${showDivider ? "border-b border-dashed border-[#D8D8D8]" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-base text-text leading-tight">
              {quantity} {name}
            </span>
            {badgeLabel && (
              <span className="rounded-full bg-[#FFE8B8] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#7A4A00]">
                {badgeLabel}
              </span>
            )}
          </div>
          <ModifierGroupsList modifierGroups={modifierGroups} />
          {comments && (
            <span className="text-[16px] text-[#6E6E6E]">{comments}</span>
          )}
        </div>
        <span className="font-semibold text-base text-text whitespace-nowrap">
          {formatCurrency(price)}
        </span>
      </div>
    </div>
  );
};

const CartListItem: React.FC<TCartListItem> = ({
  data,
  cartItem,
  cart,
  quantity,
  lg,
}) => {
  // const [quantity, setQuantity] = useState(cart.quantity)
  const { updateItemQuantity } = useCart();
  const price = calculateProductPriceWithProgressiveDiscount(
    cartItem.productId,
    data.progressiveDiscount,
    cart,
    data.categories,
    { cartItem },
  );

  const findProduct = findProductById(data.categories, cartItem.productId);
  const image = findProduct?.photos?.[0]?.url ?? null;
  const selectedModifierGroups = buildSelectedModifierGroupsFromCartItem(
    findProduct,
    cartItem,
    lg,
  );

  return (
    <div className="flex w-full flex-row items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-row items-start gap-3">
        <ProductImage
          src={image}
          alt={findProduct?.name || "Product image"}
          className="h-20 w-20 rounded-lg object-cover bg-foreground aspect-square shrink-0"
          iconClassName="h-6 w-6"
        />
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="font-semibold ">
            {findProduct?.translations
              ? findProduct?.translations[lg] && findProduct?.translations[lg]["title"] || findProduct?.name
              : findProduct?.name}
          </span>
          <ModifierGroupsList modifierGroups={selectedModifierGroups} />
          {cartItem.description && (
            <p className="text-sm text-lightText font-medium">
              {cartItem.description}
            </p>
          )}
          <div>
            <div className={`flex flex-row items-center gap-2 pt-1`}>
              <div>
                <div className="bg-[#CCD0D0] rounded-md">
                  {price && price.discountAmount > 0 && (
                    <span className="text-xs font-semibold text-brandBackground py-0.5 px-1">
                      {formatDiscountOffLabel(price.discountAmount)}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[16px] font-bold">
                {price && formatCurrency(price.discountedPrice)}
              </span>
              {price && price.fullPrice !== price.discountedPrice && (
                <span className="text-sm font-semibold line-through">
                  {formatCurrency(price.fullPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="shrink-0">
        <QuantitySelector
          value={quantity}
          onChange={(value) => updateItemQuantity(cartItem.cartId, value)}
          small
          min={0}
        />
      </div>
    </div>
  );
};

export default Price;
export { CartList };
