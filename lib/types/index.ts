export type Transaction = {
  id: string
  type: "income" | "expense"
  amount: number
  category: string
  date: string
  description?: string
  userId: string
  createdAt: string
}

export type Budget = {
  id: string
  category: string
  month: string
  limit: number
  userId: string
}

export type Loan = {
  id: string
  borrowerName: string
  borrowerEmail?: string
  amount: number
  date: string
  dueDate: string
  status: "active" | "paid" | "overdue"
  payments: Array<{
    date: string
    amount: number
  }>
  notes?: string
  userId: string
  reminderEnabled: boolean
  lastReminderSent?: string
}

export type SIP = {
  id: string
  name: string
  amount: number
  frequency: "daily" | "weekly" | "monthly" | "yearly"
  startDate: string
  endDate?: string
  category: string
  description?: string
  isActive: boolean
  lastExecuted?: string
  nextExecutionDate: string
  userId: string
  createdAt: string
}

export type User = {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
}

export type Category = {
  id: string
  name: string
  type: "income" | "expense"
  color?: string
  icon?: string
}

export type BankAccount = {
  id: string
  name: string
  accountNumber?: string
  accountType: "checking" | "savings" | "credit" | "cash"
  balance: number
  currency: string
  isDefault: boolean
  userId: string
  createdAt: string
}

export type Wishlist = {
  id: string
  itemName: string
  description?: string
  estimatedPrice: number
  priority: "low" | "medium" | "high"
  category?: string
  link?: string
  isPurchased: boolean
  purchasedDate?: string
  actualPrice?: number
  userId: string
  createdAt: string
}

