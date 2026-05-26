import * as React from "react";

import { cn } from "../lib/utils";

type CalendarProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> & {
  applyLabel?: string;
  footerLabel?: string;
  month?: Date;
  onApply?: () => void;
  onMonthChange?: (month: Date) => void;
  onSelect?: (date: Date) => void;
  selected?: Date;
  subtitle?: string;
  today?: Date;
};

type CalendarDay = {
  date: Date;
  outside: boolean;
};

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a?: Date, b?: Date) {
  return Boolean(
    a &&
      b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate(),
  );
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getCalendarDays(month: Date): CalendarDay[] {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      date,
      outside: date.getMonth() !== month.getMonth(),
    };
  });
}

const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16" {...props}>
    <path
      d="m10 12-4-4 4-4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  </svg>
);

const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16" {...props}>
    <path
      d="m6 4 4 4-4 4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  </svg>
);

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      applyLabel = "Apply",
      className,
      footerLabel,
      month,
      onApply,
      onMonthChange,
      onSelect,
      selected,
      subtitle = "Select date",
      today = new Date(),
      ...props
    },
    ref,
  ) => {
    const [internalMonth, setInternalMonth] = React.useState(() =>
      startOfDay(month ?? selected ?? today),
    );
    const visibleMonth = month ?? internalMonth;
    const days = getCalendarDays(visibleMonth);

    function updateMonth(nextMonth: Date) {
      setInternalMonth(nextMonth);
      onMonthChange?.(nextMonth);
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid w-[360px] gap-3.5 border border-border bg-card p-4 text-card-foreground",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between gap-4">
          <button
            aria-label="Previous month"
            className="inline-flex size-8 items-center justify-center border border-border bg-background text-foreground outline-none transition-[background-color,border-color,color,transform] duration-fast ease-nitro hover:bg-muted active:scale-95 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            onClick={() => updateMonth(addMonths(visibleMonth, -1))}
            type="button"
          >
            <ChevronLeftIcon className="size-4" />
          </button>

          <div className="grid justify-items-center gap-0.5">
            <h2 className="text-sm font-semibold text-foreground">
              {formatMonthLabel(visibleMonth)}
            </h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>

          <button
            aria-label="Next month"
            className="inline-flex size-8 items-center justify-center border border-border bg-background text-foreground outline-none transition-[background-color,border-color,color,transform] duration-fast ease-nitro hover:bg-muted active:scale-95 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            onClick={() => updateMonth(addMonths(visibleMonth, 1))}
            type="button"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekdayLabels.map((label, index) => (
            <div
              key={`${label}-${index}`}
              className="grid h-7 place-items-center text-xs font-semibold text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(({ date, outside }) => {
            const isSelected = isSameDay(date, selected);
            const isToday = isSameDay(date, today);

            return (
              <button
                key={date.toISOString()}
                aria-pressed={isSelected}
                className={cn(
                  "grid h-9 place-items-center text-sm font-medium text-foreground outline-none transition-[background-color,border-color,color,transform] duration-fast ease-nitro hover:bg-muted active:scale-95 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                  outside && "text-muted-foreground",
                  isToday && "border border-border bg-muted text-foreground",
                  isSelected &&
                    "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                )}
                onClick={() => onSelect?.(startOfDay(date))}
                type="button"
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        {(footerLabel || onApply) && (
          <div className="flex items-center justify-between gap-4 border-t border-border pt-2.5">
            {footerLabel && (
              <p className="text-xs font-medium text-foreground">{footerLabel}</p>
            )}
            {onApply && (
              <button
                className="text-xs font-semibold text-primary outline-none underline-offset-4 transition-colors duration-fast ease-nitro hover:text-primary/80 hover:underline focus-visible:ring-2 focus-visible:ring-primary/20"
                onClick={onApply}
                type="button"
              >
                {applyLabel}
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);
Calendar.displayName = "Calendar";

export { Calendar };
export type { CalendarProps };
