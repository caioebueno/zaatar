"use client";

import { useMemo, useState } from "react";
import Button from "@/app/components/Button";
import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { Star } from "lucide-react";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type FeedbackScale = 1 | 2 | 3 | 4 | 5;

type FeedbackFormProps = {
  orderId: string;
  lg: string;
  orderFound: boolean;
  customerName?: string | null;
  customerPhone?: string | null;
  initialSubmitted?: boolean;
};

type QuickQuestion = "productQuality" | "temperature" | "deliverySpeed" | "service";

const overallOptions: Array<{ value: FeedbackScale; emoji: string }> = [
  { value: 1, emoji: "👎" },
  { value: 3, emoji: "😐" },
  { value: 5, emoji: "👍" },
];

const detailOptions: Array<{ value: FeedbackScale; label: string }> = [
  { value: 1, label: "Bad" },
  { value: 3, label: "Okay" },
  { value: 5, label: "Good" },
];

const copyByLanguage = {
  en: {
    feedback: "Feedback",
    title: "How was your overall experience?",
    subtitle: "Complete this quick form and get 1 Nutella Esfiha on your next order.",
    productQuality: "Product quality",
    temperature: "Temperature (warm/fresh)",
    deliverySpeed: "Delivery speed",
    service: "Service experience",
    bad: "Bad",
    okay: "Okay",
    great: "Great",
    good: "Good",
    whatWentWrong: "What went wrong?",
    whatLikedMost: "What did you like the most? (optional)",
    lowPlaceholder: "Tell us what happened...",
    highPlaceholder: "Share what stood out...",
    submit: "Submit feedback",
    thankYou: "Thank you for your feedback",
    rewardPrefix: "Your reward is linked to",
    rewardSuffix: "On your next order, you will receive 1 Nutella Esfiha.",
    order: "Order",
    back: "Back",
    hi: "Hi",
    orderNotFound: "Order not found",
    menu: "Menu",
  },
  pt: {
    feedback: "Feedback",
    title: "Como foi sua experiência geral?",
    subtitle: "Preencha este formulário rápido e ganhe 1 esfiha de Nutella no próximo pedido.",
    productQuality: "Qualidade do produto",
    temperature: "Temperatura (quente/fresco)",
    deliverySpeed: "Velocidade da entrega",
    service: "Experiência no atendimento",
    bad: "Ruim",
    okay: "Ok",
    great: "Ótimo",
    good: "Bom",
    whatWentWrong: "O que deu errado?",
    whatLikedMost: "O que você mais gostou? (opcional)",
    lowPlaceholder: "Conte para a gente o que aconteceu...",
    highPlaceholder: "Conte o que mais te agradou...",
    submit: "Enviar feedback",
    thankYou: "Obrigado pelo seu feedback",
    rewardPrefix: "Sua recompensa está vinculada a",
    rewardSuffix: "No próximo pedido, você receberá 1 esfiha de Nutella.",
    order: "Pedido",
    back: "Voltar",
    hi: "Olá",
    orderNotFound: "Pedido não encontrado",
    menu: "Cardápio",
  },
  es: {
    feedback: "Feedback",
    title: "¿Cómo fue tu experiencia general?",
    subtitle: "Completa este formulario rápido y recibe 1 esfiha de Nutella en tu próximo pedido.",
    productQuality: "Calidad del producto",
    temperature: "Temperatura (caliente/fresco)",
    deliverySpeed: "Velocidad de entrega",
    service: "Experiencia de servicio",
    bad: "Malo",
    okay: "Normal",
    great: "Excelente",
    good: "Bueno",
    whatWentWrong: "¿Qué salió mal?",
    whatLikedMost: "¿Qué fue lo que más te gustó? (opcional)",
    lowPlaceholder: "Cuéntanos qué pasó...",
    highPlaceholder: "Cuéntanos qué fue lo mejor...",
    submit: "Enviar feedback",
    thankYou: "Gracias por tu feedback",
    rewardPrefix: "Tu recompensa está vinculada a",
    rewardSuffix: "En tu próximo pedido recibirás 1 esfiha de Nutella.",
    order: "Pedido",
    back: "Volver",
    hi: "Hola",
    orderNotFound: "Pedido no encontrado",
    menu: "Menú",
  },
} as const;

function formatPhoneForDisplay(value: string | null): string | null {
  if (!value) return null;

  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  const withoutUsCountry = digits.length === 11 && digits.startsWith("1")
    ? digits.slice(1)
    : digits;
  const withoutBrCountry =
    (withoutUsCountry.length === 12 || withoutUsCountry.length === 13) &&
    withoutUsCountry.startsWith("55")
      ? withoutUsCountry.slice(2)
      : withoutUsCountry;

  if (withoutBrCountry.length === 10) {
    return `${withoutBrCountry.slice(0, 3)}-${withoutBrCountry.slice(3, 6)}-${withoutBrCountry.slice(6)}`;
  }

  if (withoutBrCountry.length === 11) {
    return `${withoutBrCountry.slice(0, 3)}-${withoutBrCountry.slice(3, 7)}-${withoutBrCountry.slice(7)}`;
  }

  return withoutBrCountry;
}

export default function FeedbackForm({
  orderId,
  lg,
  orderFound,
  customerName,
  customerPhone,
  initialSubmitted = false,
}: FeedbackFormProps) {
  const locale = lg === "pt" || lg === "es" ? lg : "en";
  const copy = copyByLanguage[locale];
  const quickQuestions: Array<{ id: QuickQuestion; label: string }> = [
    { id: "productQuality", label: copy.productQuality },
    { id: "temperature", label: copy.temperature },
    { id: "deliverySpeed", label: copy.deliverySpeed },
    { id: "service", label: copy.service },
  ];
  const [overall, setOverall] = useState<FeedbackScale | null>(null);
  const [answers, setAnswers] = useState<Partial<Record<QuickQuestion, FeedbackScale>>>({});
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const languageOptions = [
    {
      code: "en",
      label: "EN",
      flagSrc: "/us.svg",
      flagAlt: "United States flag",
    },
    {
      code: "pt",
      label: "PT",
      flagSrc: "/portuguese.svg",
      flagAlt: "Brazil flag",
    },
    {
      code: "es",
      label: "ES",
      flagSrc: "/spanish.svg",
      flagAlt: "Spanish flag",
    },
  ];

  const isLowRating = (overall ?? 0) <= 3 && overall !== null;
  const detailsPrompt = useMemo(() => {
    if (overall === null) return "";

    return isLowRating
      ? copy.whatWentWrong
      : copy.whatLikedMost;
  }, [copy.whatLikedMost, copy.whatWentWrong, overall, isLowRating]);

  const allQuickAnswered = quickQuestions.every((q) => Boolean(answers[q.id]));
  const canSubmit = overall !== null && allQuickAnswered;
  const normalizedCustomerName =
    typeof customerName === "string" && customerName.trim().length > 0
      ? customerName.trim()
      : null;
  const normalizedCustomerPhone =
    typeof customerPhone === "string" && customerPhone.trim().length > 0
      ? customerPhone.trim()
      : null;
  const formattedCustomerPhone = formatPhoneForDisplay(normalizedCustomerPhone);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/feedback/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          overallRating: overall,
          productQuality: answers.productQuality,
          temperature: answers.temperature,
          deliverySpeed: answers.deliverySpeed,
          serviceExperience: answers.service,
          comment: details.trim() || null,
          language: lg,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        field?: string;
      };

      if (!response.ok) {
        const message = payload.error
          ? payload.field
            ? `${payload.error}: ${payload.field}`
            : payload.error
          : "Unable to submit feedback.";
        setSubmitError(message);
        return;
      }

      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit feedback.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`min-h-dvh bg-background ${montserrat.className}`}>
        <div className="bg-foreground border-[#B9BFBF] border-b w-full flex justify-center">
          <div className="w-full max-w-[900px] px-4 py-4 flex items-center justify-between gap-3">
            <Link
              href={`/menu/${lg}`}
              className="p-0 text-[16px] font-semibold text-text bg-transparent flex flex-row gap-2 items-center"
            >
              <FiArrowLeft size={18} />
              <span>{copy.back}</span>
            </Link>
            <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white p-1 shadow-sm">
              {languageOptions.map((language) => {
                const active = lg === language.code;
                const baseClasses =
                  "flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors";
                const stateClasses = active
                  ? "bg-[#142826] text-white"
                  : "text-[#142826] hover:bg-[#E8EFEE]";

                return (
                  <Link
                    key={language.code}
                    href={`/${language.code}/feedback/${orderId}`}
                    aria-current={active ? "page" : undefined}
                    className={`${baseClasses} ${stateClasses}`}
                  >
                    <Image
                      src={language.flagSrc}
                      width={16}
                      height={12}
                      alt={language.flagAlt}
                      className="rounded-[2px]"
                    />
                    <span>{language.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[900px] px-4 py-6">
          <div className="w-full text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F6EA] text-brandBackground">
              <Star size={22} strokeWidth={2.2} />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-[#111827]">{copy.thankYou}</h1>
          <p className="mt-3 text-base text-[#4B5563]">
            {copy.rewardPrefix}{" "}
            <span className="font-semibold text-[#111827]">
              {normalizedCustomerName || "-"} {formattedCustomerPhone || "-"}
            </span>
            . {copy.rewardSuffix}
          </p>
          {/* <p className="mt-4 text-xs text-[#9CA3AF]">{copy.order} #{orderId}</p> */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-dvh bg-background ${montserrat.className}`}>
      <div className="bg-foreground border-[#B9BFBF] border-b w-full flex justify-center">
        <div className="w-full max-w-[900px] px-4 py-4 flex items-center justify-between gap-3">
          <Link
            href={`/menu/${lg}`}
            className="p-0 text-[16px] font-semibold text-text bg-transparent flex flex-row gap-2 items-center"
          >
            <FiArrowLeft size={18} />
            <span>{copy.back}</span>
          </Link>
          <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white p-1 shadow-sm">
            {languageOptions.map((language) => {
              const active = lg === language.code;
              const baseClasses =
                "flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors";
              const stateClasses = active
                ? "bg-[#142826] text-white"
                : "text-[#142826] hover:bg-[#E8EFEE]";

              return (
                <Link
                  key={language.code}
                  href={`/${language.code}/feedback/${orderId}`}
                  aria-current={active ? "page" : undefined}
                  className={`${baseClasses} ${stateClasses}`}
                >
                  <Image
                    src={language.flagSrc}
                    width={16}
                    height={12}
                    alt={language.flagAlt}
                    className="rounded-[2px]"
                  />
                  <span>{language.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[900px] px-4 py-6">
        {!orderFound ? (
          <div className="flex flex-col gap-4 items-center py-12">
            <span className="text-lg font-semibold">{copy.orderNotFound}</span>
            <Link href={`/menu/${lg}`}>
              <Button className="w-fit bg-brandBackground">
                {copy.menu}
              </Button>
            </Link>
          </div>
        ) : (
        <div className="w-full">
        {normalizedCustomerName && (
          <p className="text-base font-semibold text-[#111827]">
            {copy.hi} {normalizedCustomerName}
          </p>
        )}
        <h1 className="mt-2 text-[24px] leading-tight font-semibold text-[#111827]">{copy.title}</h1>
        <p className="mt-2 text-base text-[#4B5563]">{copy.subtitle}</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {overallOptions.map((option) => {
            const selected = overall === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setOverall(option.value)}
                className={`rounded-xl border px-3 py-3 text-center transition ${
                  selected
                    ? "border-brandBackground bg-[#F2FAF2]"
                    : "border-[#D1D5DB] bg-white hover:border-[#9CA3AF]"
                }`}
              >
                <div className="text-2xl">{option.emoji}</div>
                <div className="mt-1 text-sm font-semibold text-[#111827]">
                  {option.value === 1
                    ? copy.bad
                    : option.value === 3
                      ? copy.okay
                      : copy.great}
                </div>
              </button>
            );
          })}
        </div>

        {overall !== null && (
          <div className="mt-7 space-y-5">
            {quickQuestions.map((question) => {
              const selectedValue = answers[question.id] ?? null;

              return (
                <div key={question.id}>
                  <p className="text-base font-medium text-[#111827]">{question.label}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {detailOptions.map((option) => {
                      const selected = selectedValue === option.value;

                      return (
                        <button
                          key={`${question.id}-${option.value}`}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: option.value,
                            }))
                          }
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                            selected
                              ? "border-brandBackground bg-[#F2FAF2] text-[#111827]"
                              : "border-[#D1D5DB] bg-white text-[#4B5563] hover:border-[#9CA3AF]"
                          }`}
                        >
                          {option.value === 1
                            ? copy.bad
                            : option.value === 3
                              ? copy.okay
                              : copy.good}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div>
              <label className="text-base font-medium text-[#111827]" htmlFor="feedback-details">
                {detailsPrompt}
              </label>
              <textarea
                id="feedback-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder={isLowRating ? copy.lowPlaceholder : copy.highPlaceholder}
                className="mt-2 min-h-28 w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-base text-[#111827] outline-none transition focus:border-brandBackground"
              />
            </div>
          </div>
        )}

        <div className="mt-7">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full bg-brandBackground py-3 text-[20px] font-[600] text-white disabled:opacity-50"
          >
            {submitting ? "Sending..." : copy.submit}
          </Button>
          {submitError ? (
            <p className="mt-3 text-sm text-red-600">{submitError}</p>
          ) : null}
        </div>
        </div>
        )}
      </div>
    </div>
  );
}
