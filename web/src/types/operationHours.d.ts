export type TOperationHours = {
  monday: HourRange[];
  tuesday: HourRange[];
  wednesday: HourRange[];
  thursday: HourRange[];
  friday: HourRange[];
  saturday: HourRange[];
  sunday: HourRange[];
};

export type HourRange = {
  from: string;
  to: string;
};
