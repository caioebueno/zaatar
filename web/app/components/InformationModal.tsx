"use client";

import { DEFAULT_BRANCH_ID } from "@/constants/branch";
import type { TOperationHours } from "@/src/types/operationHours";
import { Dialog } from "radix-ui";
import { useEffect, useState } from "react";
import { FiCheck, FiClock, FiTruck, FiX } from "react-icons/fi";

const emptyOperationHours: TOperationHours = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

const orderedDays: Array<keyof TOperationHours> = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

type TInformationModal = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  content: {
    [key: string]: string;
  };
};

export function formatTo12Hour(time: string): string {
  const [hourStr, minute] = time.split(":");
  let hour = parseInt(hourStr, 10);

  const suffix = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${suffix}`;
}

const InformationModal: React.FC<TInformationModal> = ({
  onOpenChange,
  open,
  content,
}) => {
  const [hours, setHours] = useState<TOperationHours>(emptyOperationHours);

  useEffect(() => {
    if (!open) return;

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
          setHours(data.operationHours);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    };

    loadOperationHours();

    return () => controller.abort();
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="bg-black/50 h-dvh w-dvw fixed top-0 left-0 z-40"></Dialog.Overlay>
      <Dialog.Content className="transition fixed bottom-0 left-1/2 z-50 grid w-full bg-white -translate-x-1/2 max-w-[900px] rounded-t-xl">
        <div className="px-4 py-3 flex flex-row justify-between w-full bg-foreground">
          <span className="font-bold">{content["information"]}</span>
          <Dialog.Close>
            <FiX />
          </Dialog.Close>
        </div>
        <div className="px-4 py-3 flex flex-col">
          <div className="px-4 py-2 flex flex-row rounded-t-xl border-gray-300 border items-center justify-between">
            <div className="flex flex-row gap-2 items-center">
              <FiTruck size={24} color="#142826" />
              <span className="text-lg font-bold">{content["delivery"]}</span>
            </div>
            <FiCheck size={24} />
          </div>
        </div>
        <div className="px-4 py-3 pb-8 flex flex-col">
          <span className="font-bold pb-2">{content["hoursOfOperation"]}</span>
          {orderedDays.map((day) => {
            const range = hours[day][0];
            const isClosed = !range;

            return (
              <Weekday
                key={day}
                day={day}
                from={range ? formatTo12Hour(range.from) : undefined}
                to={range ? formatTo12Hour(range.to) : undefined}
                content={content}
                closed={isClosed}
              />
            );
          })}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

type TWeekday = {
  day: string;
  from?: string;
  to?: string;
  closed?: boolean;
  content: {
    [key: string]: string;
  };
};

const Weekday: React.FC<TWeekday> = ({ day, from, to, closed, content }) => {
  return (
    <div
      className={`px-1.5 py-1 flex font-semibold flex-row justify-between items-center rounded-lg ${isTodayWeekday(day) ? "border border-brandBackground bg-brandBackground/10 text-brandBackground" : ""}`}
    >
      <span className="text-sm  capitalize">{content[day]}</span>
      <div className="flex flex-row items-center gap-2 text-sm">
        <FiClock />
        {closed ? (
          <span>{content["closed"]}</span>
        ) : (
          <span>
            {from} - {to}
          </span>
        )}
      </div>
    </div>
  );
};

export default InformationModal;

export function isTodayWeekday(day: string): boolean {
  const todayIndex = new Date().getDay(); // 0 = Sunday, 6 = Saturday

  const map: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  return map[day] === todayIndex;
}
