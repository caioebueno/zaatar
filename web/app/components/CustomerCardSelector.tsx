"use client";

import { Dialog } from "radix-ui";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Montserrat } from "next/font/google";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { FiCheck, FiCreditCard, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import {
  setStoredCustomerSession,
} from "@/utils/customerSession";
import type { TCustomerCard } from "@/src/types/customer";
import Button from "./Button";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type CustomerCardSelectorProps = {
  accessToken: string;
  content: { [key: string]: string };
  selectedCardId: string | null;
  onSelectCard: (cardId: string | null) => void;
  onCardsChange?: (cards: TCustomerCard[]) => void;
};

type SetupIntentResponse = {
  clientSecret?: string | null;
  accessToken?: string;
  expiresAt?: string;
};

type CardsResponse = {
  cards?: TCustomerCard[];
  accessToken?: string;
  expiresAt?: string;
};

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "";
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

const elementOptions = {
  style: {
    base: {
      fontSize: "18px",
      fontFamily: "Montserrat, sans-serif",
      color: "#0c0c0c",
      "::placeholder": {
        color: "#737373",
      },
    },
    invalid: {
      color: "#dc2626",
    },
  },
};

function cardBrandLabel(brand: string): string {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function CardElementField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-base font-semibold text-text">{label}</span>
      <div className="rounded-xl border-2 border-foreground bg-foreground px-3 py-3">{children}</div>
    </label>
  );
}

const AddCardForm: React.FC<{
  content: { [key: string]: string };
  clientSecret: string;
  accessToken: string;
  shouldSetDefault: boolean;
  onSaved: (cards: TCustomerCard[]) => void;
}> = ({ content, clientSecret, accessToken, shouldSetDefault, onSaved }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      setError(content["cardRequired"] || "Card information is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        throw new Error(result.error.message || "Could not save card.");
      }

      const paymentMethodId = result.setupIntent?.payment_method;
      if (typeof paymentMethodId !== "string" || paymentMethodId.length === 0) {
        throw new Error("Could not resolve payment method from Stripe response.");
      }

      const syncResponse = await fetch("/api/customers/cards/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          paymentMethodId,
          setDefault: shouldSetDefault,
        }),
      });

      const syncPayload = (await syncResponse.json().catch(() => null)) as CardsResponse | null;

      if (!syncResponse.ok || !Array.isArray(syncPayload?.cards)) {
        throw new Error(content["cardSaveError"] || "Could not save card.");
      }

      if (
        typeof syncPayload.accessToken === "string" &&
        typeof syncPayload.expiresAt === "string"
      ) {
        setStoredCustomerSession({
          accessToken: syncPayload.accessToken,
          accessTokenExpiresAt: syncPayload.expiresAt,
        });
      }

      onSaved(syncPayload.cards);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : content["cardSaveError"] || "Could not save card.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-4 pb-28">
        <CardElementField label={content["cardNumber"] || "Card number"}>
          <CardNumberElement options={elementOptions} />
        </CardElementField>
        <div className="grid grid-cols-2 gap-3">
          <CardElementField label={content["cardExpiry"] || "Expiry"}>
            <CardExpiryElement options={elementOptions} />
          </CardElementField>
          <CardElementField label={content["cardCvc"] || "CVC"}>
            <CardCvcElement options={elementOptions} />
          </CardElementField>
        </div>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
      <div className="sticky bottom-0 -mx-4 mt-auto border-t border-brandBackground/15 bg-foreground px-4 pt-4 pb-8">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-brandBackground w-full disabled:opacity-50"
        >
          {saving ? content["loading"] || "Loading..." : content["saveCard"] || "Save card"}
        </Button>
      </div>
    </div>
  );
};

const CustomerCardSelector: React.FC<CustomerCardSelectorProps> = ({
  accessToken,
  content,
  selectedCardId,
  onSelectCard,
  onCardsChange,
}) => {
  const [cards, setCards] = useState<TCustomerCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const selectedCardIdRef = useRef<string | null>(selectedCardId);
  const onSelectCardRef = useRef(onSelectCard);
  const onCardsChangeRef = useRef(onCardsChange);

  useEffect(() => {
    selectedCardIdRef.current = selectedCardId;
  }, [selectedCardId]);

  useEffect(() => {
    onSelectCardRef.current = onSelectCard;
  }, [onSelectCard]);

  useEffect(() => {
    onCardsChangeRef.current = onCardsChange;
  }, [onCardsChange]);

  const hasCards = cards.length > 0;

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    const loadCards = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/customers/cards", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const payload = (await response.json().catch(() => null)) as CardsResponse | null;

        if (!response.ok) {
          throw new Error(content["cardLoadError"] || "Could not load saved cards.");
        }

        if (cancelled) return;

        const nextCards = Array.isArray(payload?.cards) ? payload.cards : [];
        setCards(nextCards);
        onCardsChangeRef.current?.(nextCards);

        if (nextCards.length > 0 && !selectedCardIdRef.current) {
          const defaultCard = nextCards.find((card) => card.isDefault) || nextCards[0];
          onSelectCardRef.current(defaultCard.id);
        }

        if (
          typeof payload?.accessToken === "string" &&
          typeof payload?.expiresAt === "string"
        ) {
          setStoredCustomerSession({
            accessToken: payload.accessToken,
            accessTokenExpiresAt: payload.expiresAt,
          });
        }
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : content["cardLoadError"] || "Could not load saved cards.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCards();

    return () => {
      cancelled = true;
    };
  }, [accessToken, content]);

  const openAddModal = async () => {
    setError(null);
    setSetupClientSecret(null);
    setAddOpen(true);

    try {
      const response = await fetch("/api/customers/cards/setup-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
        }),
      });

      const payload = (await response.json().catch(() => null)) as SetupIntentResponse | null;

      if (!response.ok || typeof payload?.clientSecret !== "string") {
        throw new Error(content["cardSetupError"] || "Could not initialize card form.");
      }

      setSetupClientSecret(payload.clientSecret);

      if (
        typeof payload.accessToken === "string" &&
        typeof payload.expiresAt === "string"
      ) {
        setStoredCustomerSession({
          accessToken: payload.accessToken,
          accessTokenExpiresAt: payload.expiresAt,
        });
      }
    } catch (setupError) {
      setError(
        setupError instanceof Error
          ? setupError.message
          : content["cardSetupError"] || "Could not initialize card form.",
      );
      setAddOpen(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await fetch(`/api/customers/cards/${cardId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
        }),
      });

      const payload = (await response.json().catch(() => null)) as CardsResponse | null;

      if (!response.ok || !Array.isArray(payload?.cards)) {
        throw new Error(content["cardDeleteError"] || "Could not delete card.");
      }

      setCards(payload.cards);
      onCardsChange?.(payload.cards);

      if (!payload.cards.some((card) => card.id === selectedCardId)) {
        onSelectCard(payload.cards[0]?.id || null);
      }

      if (
        typeof payload.accessToken === "string" &&
        typeof payload.expiresAt === "string"
      ) {
        setStoredCustomerSession({
          accessToken: payload.accessToken,
          accessTokenExpiresAt: payload.expiresAt,
        });
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : content["cardDeleteError"] || "Could not delete card.",
      );
    }
  };

  const cardSummary = useMemo(() => {
    if (!selectedCardId) return null;
    return cards.find((card) => card.id === selectedCardId) || null;
  }, [cards, selectedCardId]);

  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold">{content["savedCards"] || "Saved cards"}</span>
      {loading ? (
        <div className="rounded-xl bg-white px-3 py-3 text-base text-[#64748B] flex flex-row justify-center">
          {content["loading"] || "Loading..."}
        </div>
      ) : hasCards ? (
        <div className="flex flex-col gap-2">
          {cards.map((card) => {
            const isSelected = card.id === selectedCardId;

            return (
              <button
                type="button"
                key={card.id}
                onClick={() => onSelectCard(card.id)}
                className={`flex items-center justify-between rounded-xl border-2 bg-foreground px-3 py-3 text-left transition ${isSelected ? "border-brandBackground" : "border-[#E2E8F0]"}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <FiCreditCard className="shrink-0 text-[#64748B]" />
                  <span className="truncate font-medium text-[#0f172a]">
                    {cardBrandLabel(card.brand)} •••• {card.last4} ({String(card.expMonth).padStart(2, "0")}/{String(card.expYear).slice(-2)})
                  </span>
                  {card.isDefault && (
                    <span className="rounded-full bg-[#E2E8F0] px-2 py-0.5 text-xs font-semibold text-[#475569]">
                      {content["default"] || "Default"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isSelected ? <FiCheck className="text-brandBackground" /> : null}
                  <span
                    role="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDeleteCard(card.id);
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] hover:bg-[#F1F5F9]"
                  >
                    <FiTrash2 size={14} />
                  </span>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => void openAddModal()}
            className="w-full rounded-xl bg-brandBackground px-3 py-3 font-bold text-base  text-white flex flex-row justify-center items-center gap-3"
          >
            <FiPlus size={18} />
            {content["addCard"] || "Add new card"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl bg-white w-full items-stretch">
          <span className="text-base text-[#64748B] self-center">
            {content["noSavedCards"] || "No saved cards yet."}
          </span>
          <button
            type="button"
            onClick={() => void openAddModal()}
            className="rounded-xl bg-brandBackground px-3 py-3 text-base font-bold text-white"
          >
            <span className="inline-flex items-center gap-1">
              <FiPlus size={14} />
              {content["addCard"] || "Add new card"}
            </span>
          </button>
        </div>
      )}
      {/* {cardSummary ? (
        <span className="text-xs text-[#64748B]">
          {content["selectedCard"] || "Selected card:"} {cardBrandLabel(cardSummary.brand)} •••• {cardSummary.last4}
        </span>
      ) : null} */}
      {error ? <span className="text-sm text-red-600">{error}</span> : null}

      <Dialog.Root
        open={addOpen}
        onOpenChange={(value) => {
          setAddOpen(value);
          if (!value) {
            setSetupClientSecret(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[79] bg-black/45 backdrop-blur-[2px] duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
          <Dialog.Content
            className={`fixed left-0 right-0 top-0 z-[80] mx-auto flex h-dvh w-dvw max-w-[900px] flex-col bg-background duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:slide-out-to-bottom-3 ${montserrat.className}`}
          >
            <Dialog.Title className="sr-only text-lg">
              {content["addCard"] || "Add new card"}
            </Dialog.Title>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-foreground px-4 py-3">
              <span className="font-semibold text-[#0f172a] text-lg">
                {content["addCard"] || "Add new card"}
              </span>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#334155]"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pt-5">
              {setupClientSecret ? (
                stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <AddCardForm
                      content={content}
                      clientSecret={setupClientSecret}
                      accessToken={accessToken}
                      shouldSetDefault={!hasCards}
                      onSaved={(nextCards) => {
                        setCards(nextCards);
                        onCardsChange?.(nextCards);
                        const defaultCard =
                          nextCards.find((card) => card.isDefault) || nextCards[0] || null;
                        onSelectCard(defaultCard?.id || null);
                        setAddOpen(false);
                      }}
                    />
                  </Elements>
                ) : (
                  <div className="text-sm text-red-600">
                    {content["stripeNotConfigured"] || "Stripe is not configured."}
                  </div>
                )
              ) : (
                <div className="text-lg text-[#64748B] flex flex-row justify-center py-4">{content["loading"] || "Loading..."}</div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default CustomerCardSelector;
