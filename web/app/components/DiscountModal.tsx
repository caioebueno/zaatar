"use client";

import { useMemo } from "react";
import { Dialog } from "radix-ui";
import formatCurrency from "@/utils/formatCurrecy";
import { TGetProductsResponse } from "../../src/getProducts";
import { calculateCartWithProgressiveDiscount } from "@/utils/calculatePrice";
import { useCart } from "./CartContext";
import ProductImage from "./ProductImage";
import { TProgressiveDiscountStep } from "../../src/types/progressiveDiscount";

// ── Brand tokens (matching design exactly) ────────────────────────────────────
const ZT = {
  teal: "#15806E",
  tealDeep: "#0E5F51",
  tealInk: "#0A3F36",
  tealSoft: "#DCEDE8",
  tealMist: "#EEF6F3",
  ink: "#15211E",
  gray: "#5C6B66",
  grayLite: "#92A09B",
  line: "#E2E9E6",
  paper: "#FFFFFF",
  gold: "#E0A52E",
  goldSoft: "#FBEFD2",
  goldInk: "#8A5A00",
};

// ── Quest math ────────────────────────────────────────────────────────────────

function useQuestCalc(subtotalCents: number, steps: TProgressiveDiscountStep[]) {
  const allStops = useMemo(
    () =>
      [...steps]
        .filter((s) => typeof s.amount === "number")
        .sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0)),
    [steps],
  );

  const curPct = useMemo(() => {
    let pct = 0;
    for (const s of allStops) {
      if (s.type === "PERCENTAGEDISCOUNT" && subtotalCents >= (s.amount ?? 0)) {
        pct = s.discount ?? 0;
      }
    }
    return pct;
  }, [allStops, subtotalCents]);

  const curDisc = Math.round((subtotalCents * curPct) / 100);

  const nextStop = useMemo(
    () => allStops.find((s) => subtotalCents < (s.amount ?? 0)) ?? null,
    [allStops, subtotalCents],
  );

  const remaining = nextStop ? (nextStop.amount ?? 0) - subtotalCents : 0;
  const nextIsGift = nextStop?.type === "GIFT";
  const nextPct = nextStop?.type === "PERCENTAGEDISCOUNT" ? (nextStop.discount ?? 0) : curPct;
  const unlocked = !nextStop;

  const prevGoal = useMemo(() => {
    const reached = allStops.filter((s) => subtotalCents >= (s.amount ?? 0));
    return reached.length > 0 ? (reached[reached.length - 1].amount ?? 0) : 0;
  }, [allStops, subtotalCents]);

  const seg = nextStop
    ? Math.max(0, Math.min(1, (subtotalCents - prevGoal) / ((nextStop.amount ?? 0) - prevGoal)))
    : 1;

  return { allStops, curPct, curDisc, nextStop, remaining, nextIsGift, nextPct, unlocked, seg };
}

// ── SVG icons (matching design's Lucide paths exactly) ────────────────────────


function XIcon({ size = 18, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" style={{ flexShrink: 0, display: "block" }}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function BagIcon({ size = 18, color = "#fff", sw = 2 }: { size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function GiftIcon({ size = 22, color = "#E0A52E", sw = 2 }: { size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

function CheckIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ZapIcon({ size = 20, color = ZT.grayLite, fill = "none" }: { size?: number; color?: string; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}


function PlusIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" style={{ flexShrink: 0, display: "block" }}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── QuestStop ─────────────────────────────────────────────────────────────────

type TQuestStop = {
  step: TProgressiveDiscountStep;
  isLast: boolean;
  isNext: boolean;
  subtotalCents: number;
  content: { [key: string]: string };
};

function QuestStop({ step, isLast, isNext, subtotalCents, content }: TQuestStop) {
  const reached = subtotalCents >= (step.amount ?? 0);
  const remaining = Math.max(0, (step.amount ?? 0) - subtotalCents);
  const isGift = step.type === "GIFT";

  // Node colors — exact from design
  const nodeBg = reached ? ZT.teal : ZT.paper;
  const nodeBorder = reached ? ZT.teal : isNext ? ZT.teal : ZT.line;

  const shouldPulse = isNext || (isLast && !reached);

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
      {/* Rail + node */}
      <div style={{ position: "relative", width: 44, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        {!isLast && (
          <div style={{
            position: "absolute", top: 22, bottom: -6, width: 4, borderRadius: 4,
            background: reached ? ZT.teal : ZT.line,
          }} />
        )}
        <div style={{
          position: "relative", zIndex: 2, width: 44, height: 44, borderRadius: "50%",
          background: nodeBg, border: `2.5px solid ${nodeBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: isNext ? "0 0 0 6px rgba(21,128,110,0.12)" : "none",
          animation: shouldPulse ? "questPulse 2s ease-in-out infinite" : "none",
        }}>
          {isGift
            ? <GiftIcon size={22} color={reached ? "#fff" : ZT.teal} sw={2} />
            : reached
              ? <CheckIcon size={22} />
              : <ZapIcon size={20} color={isNext ? ZT.teal : ZT.grayLite} fill={isNext ? ZT.teal : "none"} />}
        </div>
      </div>
      

      {/* Card */}
      <div style={{
        flex: 1, marginBottom: 14, borderRadius: 18, padding: "14px 16px",
        background: isGift && !reached ? ZT.tealMist : reached ? ZT.tealMist : ZT.paper,
        border: `1.5px solid ${isGift && !reached ? ZT.tealSoft : reached ? ZT.tealSoft : ZT.line}`,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 8px" }}>
          {isGift ? (
            <span style={{ fontSize: 19, fontWeight: 800, color: ZT.tealDeep, letterSpacing: "-0.02em" }}>
              {content["questFreeGift"] ?? "Presente exclusivo"}
            </span>
          ) : (
            <span style={{ fontSize: 23, fontWeight: 800, color: reached ? ZT.tealDeep : ZT.teal, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {step.discount}% OFF
            </span>
          )}
          <span style={{
            fontSize: 12.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap",
            background: reached ? ZT.teal : ZT.tealSoft,
            color: reached ? "#fff" : ZT.tealDeep,
          }}>
            {reached
              ? (content["questUnlocked"] ?? "Conquistado")
              : (content["questRemaining"]?.replace("{amount}", formatCurrency(remaining)) ?? `Faltam ${formatCurrency(remaining)}`)}
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: ZT.ink, marginTop: 4 }}>
          {content["questFromAmount"]?.replace("{amount}", formatCurrency(step.amount ?? 0)) ?? `a partir de ${formatCurrency(step.amount ?? 0)}`}
        </div>

        {/* Gift prize options */}
        {isGift && step.prizes && step.prizes.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {step.prizes.map((prize) => (
              <span key={prize.id} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999,
                background: ZT.paper, border: `1.5px solid ${ZT.tealSoft}`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: ZT.tealDeep }}>{prize.quantity}x</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: ZT.ink }}>{prize.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

type TDiscountModal = {
  data: TGetProductsResponse;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  content: { [key: string]: string };
  lg: string;
};

const DiscountModal: React.FC<TDiscountModal> = ({ data, open, onOpenChange, content, lg }) => {
  const { cart, addItem } = useCart();
  const price = calculateCartWithProgressiveDiscount(
    data.categories, cart, data.progressiveDiscount,
    data.activePromotion?.products, data.promotionProductIds,
  );

  const subtotalCents = price.progressiveDiscountBaseFullPrice;
  const steps = data.progressiveDiscount?.steps ?? [];
  const { allStops, curPct, curDisc, nextStop, remaining, nextIsGift, nextPct, unlocked, seg } =
    useQuestCalc(subtotalCents, steps);

  const upsellProducts = useMemo(() => {
    const inCart = new Set(cart.items.map((i) => i.productId));
    return data.categories
      .flatMap((cat) => cat.products ?? [])
      .filter((p) => !inCart.has(p.id) && typeof p.price === "number" && (p.price ?? 0) > 0)
      .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
      .slice(0, 6);
  }, [cart.items, data.categories]);

  if (!data.progressiveDiscount) return null;

  const goToCart = () => {
    onOpenChange(false);
    window.location.href = `/menu/${lg}/cart`;
  };


  return (
    <>
      <style jsx global>{`
        @keyframes questPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>

      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
          <Dialog.Content
            aria-describedby={undefined}
            style={{ background: ZT.paper, fontFamily: "var(--font-geist-mono), 'Montserrat', sans-serif" }}
            className="w-dvw h-dvh max-w-150 fixed top-0 left-0 right-0 mx-auto z-50 flex flex-col duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full"
          >
            <Dialog.Title className="sr-only">{content["progressiveDiscount"]}</Dialog.Title>

            {/* ── Single scroll area: hero + stops + upsell ── */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>

            {/* ── Hero ── */}
            <div style={{
              background: `linear-gradient(150deg, ${ZT.teal}, ${ZT.tealDeep})`,
              padding: "34px 22px 24px",
              color: "#fff",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* decorative circle */}
              <div style={{
                position: "absolute", top: -40, right: -30,
                width: 160, height: 160, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
              }} />

              {/* top row: title + close */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, position: "relative" }}>
                <h1 style={{ margin: 0, fontSize: 27, lineHeight: 1.12, fontWeight: 800, letterSpacing: "-0.02em", flex: 1 }}>
                  {unlocked ? (
                    <>
                      {content["questAllUnlockedPre"] ?? "Você chegou ao topo!"}{" "}
                      <span style={{ color: "#FFE08A" }}>
                        {curPct}%{" "}
                        {content["questAllUnlockedSuffix"] ?? "+ brinde"}
                      </span>
                    </>
                  ) : (
                    <>
                      {content["questHeadlinePre"] ?? "Só mais"}{" "}
                      <span style={{ color: "#FFE08A" }}>{formatCurrency(remaining)}</span>{" "}
                      {nextIsGift
                        ? (content["questHeadlineGiftSuffix"] ?? "pro seu brinde")
                        : `${content["questHeadlineDiscountPre"] ?? "pra"} ${nextPct}% off`}
                    </>
                  )}
                </h1>
                <button
                  onClick={() => onOpenChange(false)}
                  aria-label={content["cancel"] ?? "Fechar"}
                  style={{
                    flexShrink: 0, width: 34, height: 34, borderRadius: "50%", border: "none",
                    background: "rgba(255,255,255,0.16)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <XIcon size={18} color="#fff" />
                </button>
              </div>

              {/* momentum bar */}
              <div style={{ marginTop: 16, position: "relative" }}>
                <div style={{ height: 12, borderRadius: 999, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${seg * 100}%`,
                    borderRadius: 999,
                    background: "linear-gradient(90deg,#FFE08A,#FFC83D)",
                    transition: "width .55s cubic-bezier(.16,1,.3,1)",
                    boxShadow: "0 0 12px rgba(255,200,61,0.6)",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 16, fontWeight: 600 }}>
                  <span style={{ opacity: 0.85 }}>
                    {content["questYourOrder"]
                      ? content["questYourOrder"].replace("{amount}", formatCurrency(subtotalCents))
                      : `Pedido ${formatCurrency(subtotalCents)}`}
                  </span>
                  <span style={{ opacity: 0.85 }}>
                    {content["questSaving"]
                      ? content["questSaving"].replace("{amount}", formatCurrency(curDisc))
                      : `Economizando ${formatCurrency(curDisc)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Route stops + quick-add ── */}
            <div style={{ padding: "22px 20px 6px" }}>
              {allStops.map((step, i) => {
                const nextIdx = allStops.findIndex((s) => subtotalCents < (s.amount ?? 0));
                return (
                  <QuestStop
                    key={step.id}
                    step={step}
                    isLast={i === allStops.length - 1}
                    isNext={i === nextIdx}
                    subtotalCents={subtotalCents}
                    content={content}
                  />
                );
              })}

              {upsellProducts.length > 0 && (
                <div style={{ marginTop: 8, paddingBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ZT.gray, marginBottom: 8 }}>
                    {content["questAddAndAdvance"] ?? "Adicione e avance"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {upsellProducts.map((product) => {
                      const name = product.translations?.[lg]?.["title"] || product.name;
                      const imageUrl = product.photos?.[0]?.url ?? null;
                      return (
                        <button
                          key={product.id}
                          onClick={() =>
                            addItem({ cartId: crypto.randomUUID(), productId: product.id, quantity: 1, modifiers: [] })
                          }
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 12,
                            padding: "8px 10px 8px 8px", borderRadius: 16,
                            background: ZT.paper, border: `1.5px solid ${ZT.line}`,
                            cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          <span style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, overflow: "hidden", display: "block", background: ZT.line }}>
                            {imageUrl ? (
                              <ProductImage src={imageUrl} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              <span style={{ display: "block", width: "100%", height: "100%", background: "linear-gradient(135deg,#E8B45A,#C8852E)" }} />
                            )}
                          </span>
                          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: ZT.ink, lineHeight: 1.3, textAlign: "left" }}>{name}</span>
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: ZT.teal }}>+{formatCurrency(product.price ?? 0)}</span>
                          </span>
                          <span style={{
                            width: 30, height: 30, borderRadius: "50%", background: ZT.teal,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <PlusIcon size={16} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            </div>{/* end scroll wrapper */}

            {/* ── CTA ── */}
            <div style={{
              flexShrink: 0, padding: "12px 22px 20px",
              borderTop: `1px solid ${ZT.line}`,
              display: "flex", flexDirection: "row", gap: 10,
            }}>
              {/* Primary — unlocked: go to cart; not unlocked: close modal */}
              <button
                onClick={unlocked ? goToCart : () => onOpenChange(false)}
                style={{
                  flex: unlocked ? undefined : 1, width: unlocked ? "100%" : undefined,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  padding: "17px", borderRadius: 16, border: "none", cursor: "pointer",
                  background: ZT.teal, color: "#fff", fontSize: 17, fontWeight: 700, fontFamily: "inherit",
                }}
              >
                {unlocked ? (
                  <>
                    <BagIcon size={18} color="#fff" sw={2} />
                    {content["questFinalize"]?.replace("{pct}", String(curPct)) ?? `Finalizar com ${curPct}% + brinde`}
                  </>
                ) : (
                  nextIsGift
                    ? (content["questWantGift"] ?? "Quero o brinde")
                    : (content["questWantDiscount"]?.replace("{pct}", String(nextPct)) ?? `Quero ${nextPct}%`)
                )}
              </button>

              {/* Secondary — go to cart (shown when not unlocked) */}
              {!unlocked && (
                <button
                  onClick={goToCart}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    padding: "17px 14px", borderRadius: 16, cursor: "pointer", fontFamily: "inherit",
                    background: "transparent", border: `1.5px solid ${ZT.line}`,
                    color: ZT.gray, fontSize: 15, fontWeight: 600,
                  }}
                >
                  <BagIcon size={16} color={ZT.gray} sw={2} />
                  {content["questGoToCart"] ?? "Carrinho"}
                </button>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default DiscountModal;
