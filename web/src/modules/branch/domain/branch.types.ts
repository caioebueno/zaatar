export const weekDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type WeekDay = (typeof weekDays)[number];

export type HourRange = {
  from: string;
  to: string;
};

export type OperationHours = {
  monday: HourRange[];
  tuesday: HourRange[];
  wednesday: HourRange[];
  thursday: HourRange[];
  friday: HourRange[];
  saturday: HourRange[];
  sunday: HourRange[];
};

export type BranchWorkingHours = {
  branchId: string;
  operationHours: OperationHours;
};

function isHourRange(value: unknown): value is HourRange {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { from?: unknown }).from === "string" &&
    typeof (value as { to?: unknown }).to === "string"
  );
}

export function createEmptyOperationHours(): OperationHours {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
}

export function normalizeOperationHours(value: unknown): OperationHours {
  const normalized = createEmptyOperationHours();

  if (!value || typeof value !== "object") return normalized;

  const candidate = value as Record<string, unknown>;

  for (const day of weekDays) {
    const ranges = candidate[day];

    normalized[day] = Array.isArray(ranges)
      ? ranges.filter(isHourRange).map((range) => ({
          from: range.from,
          to: range.to,
        }))
      : [];
  }

  return normalized;
}

export function isOperationHours(value: unknown): value is OperationHours {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return weekDays.every((day) => {
    const ranges = candidate[day];
    return Array.isArray(ranges) && ranges.every(isHourRange);
  });
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getPreviousDay(day: WeekDay): WeekDay {
  const dayIndex = weekDays.indexOf(day);
  return weekDays[(dayIndex + weekDays.length - 1) % weekDays.length];
}

export function isOperationHoursOpenAt(
  operationHours: OperationHours,
  date: Date,
): boolean {
  const currentDay = weekDays[(date.getDay() + 6) % 7];
  const previousDay = getPreviousDay(currentDay);
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const isWithinRange = (range: HourRange) => {
    const from = toMinutes(range.from);
    const to = toMinutes(range.to);

    if (from === to) return true;
    if (from < to) return currentMinutes >= from && currentMinutes < to;

    return currentMinutes >= from || currentMinutes < to;
  };

  const currentDayOpen = operationHours[currentDay].some(isWithinRange);

  if (currentDayOpen) return true;

  return operationHours[previousDay].some((range) => {
    const from = toMinutes(range.from);
    const to = toMinutes(range.to);

    return from > to && currentMinutes < to;
  });
}

export type TOperationHours = OperationHours;
export type TBranchWorkingHours = BranchWorkingHours;
