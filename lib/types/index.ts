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

