import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  parseISO,
  format,
  isBefore,
} from "date-fns";
import { SIP } from "@/lib/types";

export function calculateNextExecutionDate(
  frequency: SIP["frequency"],
  lastExecutionDate?: string,
  startDate?: string
): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const baseDate = lastExecutionDate
    ? parseISO(lastExecutionDate)
    : startDate
    ? parseISO(startDate)
    : today;

  let nextDate: Date;

  switch (frequency) {
    case "daily":
      nextDate = addDays(baseDate, 1);
      break;
    case "weekly":
      nextDate = addWeeks(baseDate, 1);
      break;
    case "monthly":
      nextDate = addMonths(baseDate, 1);
      break;
    case "yearly":
      nextDate = addYears(baseDate, 1);
      break;
    default:
      nextDate = addMonths(baseDate, 1);
  }

  // Ensure the next date is in the future
  // If the calculated date is in the past, keep adding intervals until it's in the future
  while (isBefore(nextDate, today)) {
    switch (frequency) {
      case "daily":
        nextDate = addDays(nextDate, 1);
        break;
      case "weekly":
        nextDate = addWeeks(nextDate, 1);
        break;
      case "monthly":
        nextDate = addMonths(nextDate, 1);
        break;
      case "yearly":
        nextDate = addYears(nextDate, 1);
        break;
      default:
        nextDate = addMonths(nextDate, 1);
    }
  }

  return format(nextDate, "yyyy-MM-dd");
}

export function shouldExecuteSIP(sip: SIP): boolean {
  if (!sip.isActive) return false;

  const today = format(new Date(), "yyyy-MM-dd");
  const nextExecution = sip.nextExecutionDate;

  // Check if today is the execution date or past it
  if (today >= nextExecution) {
    // Check if there's an end date and if we've passed it
    if (sip.endDate && today > sip.endDate) {
      return false;
    }
    return true;
  }

  return false;
}

export function getSIPFrequencyLabel(frequency: SIP["frequency"]): string {
  const labels = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };
  return labels[frequency] || frequency;
}

export function calculateTotalInvested(sip: SIP): number {
  if (!sip.isActive || !sip.startDate) return 0;

  const startDate = parseISO(sip.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If start date is in the future, no investment yet
  if (isBefore(today, startDate)) return 0;

  // Determine the calculation end date
  // If there's an end date and it's before today, calculate up to end date
  // Otherwise, calculate up to today
  let calculationEndDate = today;
  if (sip.endDate) {
    const endDate = parseISO(sip.endDate);
    endDate.setHours(0, 0, 0, 0);
    if (isBefore(endDate, today)) {
      calculationEndDate = endDate;
    }
  }

  let totalInvestments = 0;
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  switch (sip.frequency) {
    case "daily":
      while (!isBefore(calculationEndDate, currentDate)) {
        totalInvestments++;
        currentDate = addDays(currentDate, 1);
      }
      break;
    case "weekly":
      while (!isBefore(calculationEndDate, currentDate)) {
        totalInvestments++;
        currentDate = addWeeks(currentDate, 1);
      }
      break;
    case "monthly":
      while (!isBefore(calculationEndDate, currentDate)) {
        totalInvestments++;
        currentDate = addMonths(currentDate, 1);
      }
      break;
    case "yearly":
      while (!isBefore(calculationEndDate, currentDate)) {
        totalInvestments++;
        currentDate = addYears(currentDate, 1);
      }
      break;
  }

  return totalInvestments * sip.amount;
}
