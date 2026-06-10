"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog } from "radix-ui";
import { FiX, FiShoppingBag, FiPlus, FiCheck, FiStar } from "react-icons/fi";
import formatCurrency from "@/utils/formatCurrecy";
import { TGetProductsResponse } from "../../src/getProducts";
import { calculateCartWithProgressiveDiscount } from "@/utils/calculatePrice";
import { useCart } from "./CartContext";
import ProductImage from "./ProductImage";
import { TProgressiveDiscountStep } from "../../src/types/progressiveDiscount";

// ── Discount math ─────────────────────────────────────────────────────────────

type TDiscountCalc = {
  curPct: number;
  curDisc: number;
  next: { pct: number; amount: number } | null;
  remaining: number;
  nextDisc: number;
  extraDisc: number;
};

function calcDiscount(
  subtotalCents: number,
  steps: TProgressiveDiscountStep[],
): TDiscountCalc {
  const sorted = steps
    .filter(
      (s): s is TProgressiveDiscountStep & { amount: number; discount: number } =>
        s.type === "PERCENTAGEDISCOUNT" &&
        typeof s.amount === "number" &&
        typeof s.discount === "number",
    )
    .sort((a, b) => a.amount - b.amount);

  let curPct = 0;
  for (const s of sorted) {
    if (subtotalCents >= s.amount) curPct = s.discount;
  }
  const nextStep = sorted.find((s) => s.amount > subtotalCents) ?? null;

  const curDisc = Math.round((subtotalCents * curPct) / 100);
  const next = nextStep ? { pct: nextStep.discount, amount: nextStep.amount } : null;
  const remaining = next ? next.amount - subtotalCents : 0;
  const nextDisc = next ? Math.round((next.amount * next.pct) / 100) : 0;
  const extraDisc = nextDisc - curDisc;

  return { curPct, curDisc, next, remaining, nextDisc, extraDisc };
}

// ── Exact DiscountTrack from design ──────────────────────────────────────────
// Evenly-spaced milestones, segment-by-segment fill.

type TDiscountTrack = {
  subtotalCents: number;
  steps: TProgressiveDiscountStep[];
};

function DiscountTrack({ subtotalCents, steps }: TDiscountTrack) {
  const sorted = steps
    .filter(
      (s): s is TProgressiveDiscountStep & { amount: number; discount: number } =>
        s.type === "PERCENTAGEDISCOUNT" &&
        typeof s.amount === "number" &&
        typeof s.discount === "number",
    )
    .sort((a, b) => a.amount - b.amount);

  const n = sorted.length;
  if (n === 0) return null;

  // goals[0] = 0, goals[1..n] = tier amounts
  const goals = [0, ...sorted.map((t) => t.amount)];

  // Exact fill from design: segment-by-segment
  let fill = 100;
  for (let i = 1; i < goals.length; i++) {
    if (subtotalCents < goals[i]) {
      const seg = (subtotalCents - goals[i - 1]) / (goals[i] - goals[i - 1]);
      fill = (((i - 1) + Math.max(0, Math.min(1, seg))) / n) * 100;
      break;
    }
  }

  // Milestone position: (i+1)/n * 100% for the i-th tier (0-indexed)
  const posFor = (i: number) => `${((i + 1) / n) * 100}%`;

  return (
    <div className="relative" style={{ height: 56, margin: "10px 2px 2px" }}>
      {/* Track background */}
      <div
        className="absolute rounded-full border border-[#E4E8E7] bg-white"
        style={{ top: 9, left: 0, right: 0, height: 8 }}
      />
      {/* Fill bar */}
      <div
        className="absolute rounded-full"
        style={{
          top: 9,
          left: 0,
          height: 8,
          width: `${fill}%`,
          background: "var(--color-brandBackground)",
          transition: "width 0.55s cubic-bezier(.16,1,.3,1)",
        }}
      />
      {/* Start dot */}
      <div
        className="absolute rounded-full"
        style={{
          top: 6,
          left: 0,
          width: 14,
          height: 14,
          background: "var(--color-brandBackground)",
          border: "3px solid #fff",
          boxShadow: "0 0 0 1px #E4E8E7",
        }}
      />
      {/* Milestone markers + pills */}
      {sorted.map((t, i) => {
        const pos = posFor(i);
        const reached = subtotalCents >= t.amount;
        const isLast = i === n - 1;
        return (
          <div key={t.id}>
            {/* Circle */}
            <div
              className="absolute z-10 flex items-center justify-center rounded-full"
              style={{
                top: 3,
                left: pos,
                transform: "translateX(-50%)",
                width: 20,
                height: 20,
                background: reached ? "var(--color-brandBackground)" : "#fff",
                border: `2px solid ${reached ? "var(--color-brandBackground)" : "#E4E8E7"}`,
              }}
            >
              {isLast ? (
                <FiStar
                  size={11}
                  fill={reached ? "#fff" : "#F4B400"}
                  color={reached ? "#fff" : "#F4B400"}
                  strokeWidth={1}
                />
              ) : (
                reached && <FiCheck size={11} color="#fff" strokeWidth={3} />
              )}
            </div>
            {/* % pill */}
            <div
              className="absolute"
              style={{
                top: 28,
                left: pos,
                transform: `translateX(${isLast ? "-100%" : "-50%"})`,
              }}
            >
              <span
                className="inline-block h-5.5 leading-5.5 px-2.25 rounded-full text-[13px] font-bold whitespace-nowrap"
                style={{
                  background: reached ? "var(--color-brandBackground)" : "#fff",
                  color: reached ? "#fff" : "#1A1A1A",
                  border: `1px solid ${reached ? "var(--color-brandBackground)" : "#E4E8E7"}`,
                }}
              >
                {t.discount}% off
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Confetti ──────────────────────────────────────────────────────────────────

function Confetti({ seed }: { seed: number }) {
  const COLORS = ["var(--color-brandBackground)", "#F4B400", "#46B89C", "#FF8A5B"];
  const pieces = Array.from({ length: 16 }, (_, i) => ({
    left: (i * 6.3 + (seed % 5) * 3) % 100,
    delay: (i % 6) * 60,
    color: COLORS[i % COLORS.length],
    width: 6 + (i % 3) * 2,
    height: 8 + (i % 3) * 2,
    round: i % 2 === 0,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      {pieces.map((p, i) => (
        <span
          key={`${i}-${seed}`}
          className="absolute opacity-0"
          style={{
            top: 70,
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            background: p.color,
            borderRadius: p.round ? 6 : 2,
            animation: `upsell-confetti-fall 1.25s ${p.delay}ms cubic-bezier(.2,.6,.4,1) forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ── Upsell product row ────────────────────────────────────────────────────────

type TUpsellItem = {
  name: string;
  price: number;
  imageUrl: string | null;
  addLabel: string;
  onAdd: () => void;
};

function UpsellItem({ name, price, imageUrl, addLabel, onAdd }: TUpsellItem) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#E4E8E7]">
      <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[#E4E8E7]">
        {imageUrl ? (
          <ProductImage src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg,#E8B45A,#C8852E)" }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] text-[#1A1A1A] leading-tight truncate">
          {name}
        </div>
        <div className="mt-0.5 font-bold text-[15px] text-[#1A1A1A]">
          {formatCurrency(price)}
        </div>
      </div>
      <button
        onClick={handleAdd}
        aria-label={`${addLabel} ${name}`}
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border-none cursor-pointer transition-colors duration-150"
        style={{ background: added ? "#D7EAE4" : "var(--color-brandBackground)" }}
      >
        {added ? (
          <FiCheck size={18} strokeWidth={2.8} color="var(--color-brandBackground)" />
        ) : (
          <FiPlus size={18} strokeWidth={2.6} color="#fff" />
        )}
      </button>
    </div>
  );
}

// ── Interpolation helper ──────────────────────────────────────────────────────

function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, v),
    template,
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

type TUpsellModal = {
  data: TGetProductsResponse;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onGoToCart: () => void;
  content: { [key: string]: string };
  lg: string;
};

const UpsellModal: React.FC<TUpsellModal> = ({
  data,
  open,
  onOpenChange,
  onGoToCart,
  content,
  lg,
}) => {
  const { cart, addItem } = useCart();
  const price = calculateCartWithProgressiveDiscount(
    data.categories,
    cart,
    data.progressiveDiscount,
    data.activePromotion?.products,
    data.promotionProductIds,
  );

  const subtotal = price.progressiveDiscountBaseFullPrice;
  const d = useMemo(
    () =>
      data.progressiveDiscount
        ? calcDiscount(subtotal, data.progressiveDiscount.steps)
        : null,
    [subtotal, data.progressiveDiscount],
  );

  const prevDiscPct = useRef(d?.curPct ?? 0);
  const [celebrate, setCelebrate] = useState(0);

  useEffect(() => {
    if (!open) return;
    if (d && d.curPct > prevDiscPct.current) {
      setCelebrate((c) => c + 1);
    }
    prevDiscPct.current = d?.curPct ?? 0;
  }, [d?.curPct, open]);

  const upsellProducts = useMemo(() => {
    const inCart = new Set(cart.items.map((i) => i.productId));
    return data.categories
      .flatMap((cat) => cat.products ?? [])
      .filter((p) => !inCart.has(p.id) && typeof p.price === "number" && (p.price ?? 0) > 0)
      .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
      .slice(0, 4);
  }, [cart.items, data.categories]);

  if (!data.progressiveDiscount || !d) return null;

  const unlocked = !d.next;

  const headline = unlocked
    ? interpolate(content["upsellUnlockedTitle"] ?? "You unlocked {pct}% OFF", {
        pct: String(d.curPct),
      })
    : interpolate(
        content["upsellRemainingFor"] ?? "Only {remaining} more for {pct}% OFF",
        { remaining: formatCurrency(d.remaining), pct: String(d.next!.pct) },
      );

  const subheadline = unlocked
    ? interpolate(
        content["upsellCurrentSavings"] ?? "That's {amount} saved on your order. Enjoy!",
        { amount: formatCurrency(d.curDisc) },
      )
    : interpolate(
        content["upsellSavingsHint"] ??
          "You save {nextDisc} on your entire order — {extraDisc} more than now.",
        {
          nextDisc: formatCurrency(d.nextDisc),
          extraDisc: formatCurrency(d.extraDisc),
        },
      );

  const primaryBtnLabel = unlocked
    ? interpolate(content["upsellCartWithDiscount"] ?? "Go to cart · {pct}% OFF", {
        pct: String(d.curPct),
      })
    : interpolate(content["upsellWantDiscount"] ?? "I want {pct}% OFF", {
        pct: String(d.next!.pct),
      });

  return (
    <>
      <style jsx global>{`
        @keyframes upsell-confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(540px) rotate(540deg); opacity: 0; }
        }
        @keyframes upsell-pop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
          <Dialog.Content
            aria-describedby={undefined}
            className="w-dvw h-dvh max-w-150 bg-[#E9ECEB] fixed top-0 left-0 right-0 mx-auto z-50 flex flex-col duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full"
            style={{ fontFamily: "var(--font-geist-mono), 'Montserrat', sans-serif" }}
          >
            {celebrate > 0 && <Confetti seed={celebrate} />}

            <Dialog.Title className="sr-only">
              {content["progressiveDiscount"]}
            </Dialog.Title>

            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              aria-label={content["cancel"] ?? "Close"}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center border-none cursor-pointer"
            >
              <FiX size={20} color="#1A1A1A" strokeWidth={2.2} />
            </button>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain pt-14 pb-4 px-5">
              {/* Headline */}
              <div
                className="text-center"
                style={unlocked ? { animation: "upsell-pop .4s" } : undefined}
              >
                <h2 className="text-[28px] font-extrabold text-[#1A1A1A] leading-[1.14] tracking-[-0.01em]">
                  {headline}
                </h2>
                <p className="text-[16px] text-[#6B7280] mt-2.5 leading-[1.45]">
                  {subheadline}
                </p>
              </div>

              {/* Progress card */}
              <div className="mt-5 bg-white rounded-2xl border border-[#E4E8E7] px-4 pt-3.5 pb-3">
                <DiscountTrack
                  subtotalCents={subtotal}
                  steps={data.progressiveDiscount.steps}
                />
                <div className="flex justify-between mt-2.5 text-[14px] text-[#6B7280]">
                  <span>
                    {content["upsellYourOrder"] ?? "Your order"}{" "}
                    <b className="text-[#1A1A1A]">{formatCurrency(subtotal)}</b>
                  </span>
                  {!unlocked && (
                    <span>
                      {content["upsellGoal"] ?? "Goal"}{" "}
                      <b className="text-[#1A1A1A]">{formatCurrency(d.next!.amount)}</b>
                    </span>
                  )}
                </div>
              </div>

              {/* Upsell items */}
              {upsellProducts.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[16px] font-bold text-[#1A1A1A]">
                      {unlocked
                        ? (content["upsellSuggestMore"] ?? "How about adding more?")
                        : (content["upsellGetCloser"] ?? "Get there with:")}
                    </span>
                    <span className="flex-1 h-px bg-[#E4E8E7]" />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {upsellProducts.map((product) => (
                      <UpsellItem
                        key={product.id}
                        name={product.translations?.[lg]?.["title"] || product.name}
                        price={product.price ?? 0}
                        imageUrl={product.photos?.[0]?.url ?? null}
                        addLabel={content["add"] ?? "Add"}
                        onAdd={() =>
                          addItem({
                            cartId: crypto.randomUUID(),
                            productId: product.id,
                            quantity: 1,
                            modifiers: [],
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky action bar */}
            <div className="shrink-0 bg-[#E9ECEB] border-t border-[#E4E8E7] px-4 pt-3 pb-6 flex gap-2.5 shadow-[0_-6px_20px_rgba(0,0,0,0.04)]">
              {unlocked ? (
                <>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="shrink-0 min-w-30 px-5 py-3.5 rounded-[13px] cursor-pointer bg-white border border-[#E4E8E7] text-[#1A1A1A] text-[16px] font-semibold"
                  >
                    {content["upsellContinue"] ?? "Continue"}
                  </button>
                  <button
                    onClick={onGoToCart}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-[13px] cursor-pointer border-none text-white text-[16px] font-bold whitespace-nowrap"
                    style={{ background: "var(--color-brandBackground)" }}
                  >
                    <FiShoppingBag size={18} strokeWidth={2.2} />
                    <span>{primaryBtnLabel}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onGoToCart}
                    className="shrink-0 min-w-30 px-5 py-3.5 rounded-[13px] cursor-pointer bg-white border border-[#E4E8E7] text-[#1A1A1A] text-[16px] font-semibold"
                  >
                    {content["upsellGoToCart"] ?? "Go to cart"}
                  </button>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-[13px] cursor-pointer border-none text-white text-[16px] font-bold"
                    style={{ background: "var(--color-brandBackground)" }}
                  >
                    <span>{primaryBtnLabel}</span>
                  </button>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default UpsellModal;
