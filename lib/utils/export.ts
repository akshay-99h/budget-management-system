import { Transaction, Budget, Loan } from "@/lib/types"

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          if (value === null || value === undefined) return ""
          if (typeof value === "object") return JSON.stringify(value)
          return `"${String(value).replace(/"/g, '""')}"`
        })
        .join(",")
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function formatTransactionsForExport(transactions: Transaction[]) {
  return transactions.map((t) => ({
    Date: t.date,
    Type: t.type,
    Category: t.category,
    Amount: t.amount,
    Description: t.description || "",
    "Created At": t.createdAt,
  }))
}

export function formatBudgetsForExport(budgets: Budget[]) {
  return budgets.map((b) => ({
    Category: b.category,
    Month: b.month,
    Limit: b.limit,
  }))
}

export function formatLoansForExport(loans: Loan[]) {
  return loans.map((l) => ({
    "Borrower Name": l.borrowerName,
    Amount: l.amount,
    Date: l.date,
    "Due Date": l.dueDate,
    Status: l.status,
    "Total Paid": l.payments.reduce((sum, p) => sum + p.amount, 0),
    "Remaining": l.amount - l.payments.reduce((sum, p) => sum + p.amount, 0),
    Notes: l.notes || "",
  }))
}

