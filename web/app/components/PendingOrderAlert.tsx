"use client";

import text from "@/constants/text";
import {
  CUSTOMER_SESSION_UPDATED_EVENT,
  getStoredCustomerSession,
} from "@/utils/customerSession";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiShoppingBag } from "react-icons/fi";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type TPendingOrder = {
  id: string;
  number: string | null;
};

type TPendingOrderAlert = {
  lg: string;
};

const PendingOrderAlert: React.FC<TPendingOrderAlert> = ({ lg }) => {
  const [pendingOrder, setPendingOrder] = useState<TPendingOrder | null>(null);
  const pathname = usePathname();
  const content = text[lg] || text["en"];
  const alertRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPendingOrder = async () => {
      const session = getStoredCustomerSession();

      if (!session?.customer?.id) {
        if (!cancelled) setPendingOrder(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/customers/${session.customer.id}/pending-order`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          if (!cancelled) setPendingOrder(null);
          return;
        }

        const data = (await response.json()) as TPendingOrder | null;

        if (!cancelled) {
          setPendingOrder(data);
        }
      } catch {
        if (!cancelled) setPendingOrder(null);
      }
    };

    loadPendingOrder();

    const handleSessionUpdate = () => {
      loadPendingOrder();
    };

    const handleFocus = () => {
      loadPendingOrder();
    };

    window.addEventListener(CUSTOMER_SESSION_UPDATED_EVENT, handleSessionUpdate);
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.removeEventListener(
        CUSTOMER_SESSION_UPDATED_EVENT,
        handleSessionUpdate,
      );
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    const setOffset = (value: string) => {
      document.documentElement.style.setProperty("--menu-sticky-offset", value);
    };

    if (!pendingOrder) {
      setOffset("0px");
      return;
    }

    const element = alertRef.current;
    if (!element) {
      setOffset("0px");
      return;
    }

    const updateOffset = () => {
      setOffset(`${element.offsetHeight}px`);
    };

    updateOffset();

    const observer = new ResizeObserver(updateOffset);
    observer.observe(element);

    return () => {
      observer.disconnect();
      setOffset("0px");
    };
  }, [pendingOrder]);

  if (!pendingOrder) return null;

  const confirmationHref = `/menu/${lg}/confirmation/${pendingOrder.id}`;

  if (pathname === confirmationHref) return null;

  return (
    <div
      ref={alertRef}
      className="sticky top-0 z-40 w-full bg-[#E8EFEE] border-b border-[#A9BBB8]"
    >
      <Link
        href={confirmationHref}
        className={`mx-auto flex w-full max-w-[900px] items-center justify-between gap-3 px-4 py-4 text-text ${montserrat.className}`}
      >
        <div className="flex items-center gap-3">
          <FiShoppingBag size={20} className="shrink-0 text-[#142826]" />
          <span className="font-semibold text-[14px] leading-tight text-[#142826]">
            {content["pendingOrderAlert"]}
          </span>
        </div>
        <span className="text-[13px] font-semibold text-[#142826]">
          {content["viewOrder"]}
        </span>
      </Link>
    </div>
  );
};

export default PendingOrderAlert;
