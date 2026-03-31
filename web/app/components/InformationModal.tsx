import { operationHours } from "@/constants/operationHours";
import { Dialog } from "radix-ui";
import { FiCheck, FiClock, FiTruck, FiX } from "react-icons/fi";

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
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="bg-black/50 h-dvh w-dvh fixed top-0 left-0 z-40"></Dialog.Overlay>
      <Dialog.Content className="transition fixed bottom-0 left-1/2 z-50 grid w-full bg-white -translate-x-1/2 ">
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
          <Weekday
            day="sunday"
            from={formatTo12Hour(operationHours.sunday[0].from)}
            to={formatTo12Hour(operationHours.sunday[0].to)}
            content={content}
          />
          <Weekday
            day="monday"
            from={formatTo12Hour(operationHours.monday[0].from)}
            to={formatTo12Hour(operationHours.monday[0].to)}
            content={content}
          />
          <Weekday
            day="tuesday"
            from={formatTo12Hour(operationHours.monday[0].from)}
            to={formatTo12Hour(operationHours.monday[0].to)}
            content={content}
            closed
          />
          <Weekday
            day="wednesday"
            from={formatTo12Hour(operationHours.wednesday[0].from)}
            to={formatTo12Hour(operationHours.wednesday[0].to)}
            content={content}
          />
          <Weekday
            day="thursday"
            from={formatTo12Hour(operationHours.thursday[0].from)}
            to={formatTo12Hour(operationHours.thursday[0].to)}
            content={content}
          />
          <Weekday
            day="friday"
            from={formatTo12Hour(operationHours.friday[0].from)}
            to={formatTo12Hour(operationHours.friday[0].to)}
            content={content}
          />
          <Weekday
            day="saturday"
            from={formatTo12Hour(operationHours.saturday[0].from)}
            to={formatTo12Hour(operationHours.saturday[0].to)}
            content={content}
          />
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
