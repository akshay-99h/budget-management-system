import { addDays, addWeeks, addMonths, addYears, parseISO, format } from "date-fns"
import { SIP } from "@/lib/types"

export function calculateNextExecutionDate(
  frequency: SIP["frequency"],
  lastExecutionDate?: string,
  startDate?: string
): string {
  const baseDate = lastExecutionDate
    ? parseISO(lastExecutionDate)
    : startDate
    ? parseISO(startDate)
    : new Date()

  let nextDate: Date

  switch (frequency) {
    case "daily":
      nextDate = addDays(baseDate, 1)
      break
    case "weekly":
      nextDate = addWeeks(baseDate, 1)
      break
    case "monthly":
      nextDate = addMonths(baseDate, 1)
      break
    case "yearly":
      nextDate = addYears(baseDate, 1)
      break
    default:
      nextDate = addMonths(baseDate, 1)
  }

  return format(nextDate, "yyyy-MM-dd")
}

export function shouldExecuteSIP(sip: SIP): boolean {
  if (!sip.isActive) return false

  const today = format(new Date(), "yyyy-MM-dd")
  const nextExecution = sip.nextExecutionDate

  // Check if today is the execution date or past it
  if (today >= nextExecution) {
    // Check if there's an end date and if we've passed it
    if (sip.endDate && today > sip.endDate) {
      return false
    }
    return true
  }

  return false
}

export function getSIPFrequencyLabel(frequency: SIP["frequency"]): string {
  const labels = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  }
  return labels[frequency] || frequency
}

