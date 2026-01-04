import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  description: z.string().optional(),
})

export const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  limit: z.number().positive("Limit must be positive"),
})

export const loanSchema = z.object({
  borrowerName: z.string().min(1, "Borrower name is required"),
  borrowerEmail: z.string().email("Invalid email address").optional(),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format"),
  status: z.enum(["active", "paid", "overdue"]).optional(),
  payments: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
      amount: z.number().positive("Amount must be positive"),
    })
  ).optional(),
  notes: z.string().optional(),
  reminderEnabled: z.boolean().optional(),
  lastReminderSent: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
})

export const loanPaymentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  amount: z.number().positive("Amount must be positive"),
})

export const sipSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format").optional(),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  lastExecuted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Last executed must be in YYYY-MM-DD format").optional(),
  nextExecutionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Next execution date must be in YYYY-MM-DD format").optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type BudgetInput = z.infer<typeof budgetSchema>
export type LoanInput = z.infer<typeof loanSchema>
export type LoanPaymentInput = z.infer<typeof loanPaymentSchema>
export type SIPInput = z.infer<typeof sipSchema>

export const bankAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  accountNumber: z.string().optional(),
  accountType: z.enum(["checking", "savings", "credit", "cash"]),
  balance: z.number().default(0),
  currency: z.string().default("INR"),
  isDefault: z.boolean().default(false),
})

export const wishlistSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  estimatedPrice: z.number().positive("Price must be positive"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().optional(),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isPurchased: z.boolean().default(false),
  purchasedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  actualPrice: z.number().positive("Price must be positive").optional(),
})

export type BankAccountInput = z.infer<typeof bankAccountSchema>
export type WishlistInput = z.infer<typeof wishlistSchema>

