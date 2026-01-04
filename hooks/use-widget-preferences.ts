import { useState, useEffect } from "react"

export type WidgetId =
  | "income"
  | "expenses"
  | "netIncome"
  | "loans"
  | "bankAccounts"
  | "wishlist"
  | "sipInvestments"
  | "financialHealth"
  | "spendingTrends"
  | "topCategories"
  | "cashFlow"
  | "savingsRate"
  | "accountDistribution"
  | "wishlistProgress"
  | "monthComparison"
  | "budgetAlerts"
  | "quickInsights"
  | "netWorth"
  | "spendingByCategory"
  | "budgetPerformance"
  | "recentTransactions"

export type WidgetPreferences = Record<WidgetId, boolean>

const DEFAULT_PREFERENCES: WidgetPreferences = {
  // Core stats (always visible by default)
  income: true,
  expenses: true,
  netIncome: true,
  loans: true,
  bankAccounts: true,
  wishlist: true,

  // New widgets (visible by default)
  sipInvestments: true,
  financialHealth: true,
  spendingTrends: true,
  topCategories: true,
  cashFlow: true,
  savingsRate: true,
  accountDistribution: true,
  wishlistProgress: true,
  monthComparison: true,
  budgetAlerts: true,
  quickInsights: true,
  netWorth: true,

  // Charts (visible by default)
  spendingByCategory: true,
  budgetPerformance: true,
  recentTransactions: true,
}

const STORAGE_KEY = "dashboard-widget-preferences"

export function useWidgetPreferences() {
  const [preferences, setPreferences] = useState<WidgetPreferences>(DEFAULT_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      }
    } catch (error) {
      console.error("Failed to load widget preferences:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save preferences to localStorage whenever they change
  const updatePreferences = (newPreferences: Partial<WidgetPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPreferences }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error("Failed to save widget preferences:", error)
      }

      return updated
    })
  }

  const toggleWidget = (widgetId: WidgetId) => {
    updatePreferences({ [widgetId]: !preferences[widgetId] })
  }

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("Failed to reset widget preferences:", error)
    }
  }

  const showAll = () => {
    const allVisible = Object.keys(DEFAULT_PREFERENCES).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as WidgetPreferences
    )
    updatePreferences(allVisible)
  }

  const hideAll = () => {
    const allHidden = Object.keys(DEFAULT_PREFERENCES).reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {} as WidgetPreferences
    )
    updatePreferences(allHidden)
  }

  return {
    preferences,
    updatePreferences,
    toggleWidget,
    resetToDefaults,
    showAll,
    hideAll,
    isLoaded,
  }
}

export const WIDGET_LABELS: Record<WidgetId, string> = {
  income: "Total Income",
  expenses: "Total Expenses",
  netIncome: "Net Income",
  loans: "Outstanding Loans",
  bankAccounts: "Bank Accounts",
  wishlist: "Wishlist Items",
  sipInvestments: "SIP Investments",
  financialHealth: "Financial Health Score",
  spendingTrends: "Spending Trends",
  topCategories: "Top Spending Categories",
  cashFlow: "Cash Flow Timeline",
  savingsRate: "Savings Rate",
  accountDistribution: "Account Distribution",
  wishlistProgress: "Wishlist Progress",
  monthComparison: "Month Comparison",
  budgetAlerts: "Budget Alerts",
  quickInsights: "Quick Insights",
  netWorth: "Net Worth",
  spendingByCategory: "Spending by Category Chart",
  budgetPerformance: "Budget Performance Chart",
  recentTransactions: "Recent Transactions",
}

export const WIDGET_CATEGORIES = {
  "Core Stats": ["income", "expenses", "netIncome", "loans", "bankAccounts", "wishlist"] as WidgetId[],
  "Investments & Savings": ["sipInvestments", "savingsRate", "netWorth", "accountDistribution"] as WidgetId[],
  "Analysis & Insights": ["financialHealth", "spendingTrends", "monthComparison", "quickInsights"] as WidgetId[],
  "Planning": ["topCategories", "cashFlow", "wishlistProgress", "budgetAlerts"] as WidgetId[],
  "Charts": ["spendingByCategory", "budgetPerformance", "recentTransactions"] as WidgetId[],
}
