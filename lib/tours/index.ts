import { Step } from "react-joyride"

export const dashboardTour: Step[] = [
  {
    target: "body",
    content: "Welcome to Budget 2025! Let's take a quick tour of your financial dashboard.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="stats-cards"]',
    content: "Here you can see your monthly financial summary including income, expenses, net income, and outstanding loans.",
    placement: "bottom",
  },
  {
    target: '[data-tour="charts"]',
    content: "These charts help you visualize your spending by category and track your budget performance.",
    placement: "top",
  },
  {
    target: '[data-tour="recent-transactions"]',
    content: "View your most recent transactions here for quick access to your latest financial activity.",
    placement: "top",
  },
]

export const transactionsTour: Step[] = [
  {
    target: "body",
    content: "This is your Transactions page where you can manage all your income and expenses.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="add-transaction"]',
    content: "Click here to add a new transaction. You can record both income and expenses.",
    placement: "bottom",
  },
  {
    target: '[data-tour="filters"]',
    content: "Use these filters to quickly find specific transactions by type or category.",
    placement: "bottom",
  },
  {
    target: '[data-tour="transaction-list"]',
    content: "All your transactions are listed here. Click on any transaction to edit or delete it.",
    placement: "top",
  },
]

export const transactionsMobileTour: Step[] = [
  {
    target: "body",
    content: "Welcome to your Activity page! Here you can see all your transactions and loans in one place.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="quick-actions"]',
    content: "Quick access buttons to manage your budgets and loans.",
    placement: "bottom",
  },
  {
    target: '[data-tour="activity-list"]',
    content: "Your combined transactions and loans timeline, sorted by date.",
    placement: "top",
  },
  {
    target: '[data-tour="fab"]',
    content: "Tap this button anytime to quickly add a new transaction!",
    placement: "left",
  },
]

export const budgetsTour: Step[] = [
  {
    target: "body",
    content: "Manage your monthly budgets here to keep your spending in check.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="add-budget"]',
    content: "Create a new budget by setting spending limits for different categories.",
    placement: "bottom",
  },
  {
    target: '[data-tour="budget-summary"]',
    content: "See your total budget allocation and current spending at a glance.",
    placement: "bottom",
  },
  {
    target: '[data-tour="budget-cards"]',
    content: "Each card shows a budget category with its limit, current spending, and remaining amount. The progress bar changes color as you approach your limit.",
    placement: "top",
  },
]

export const loansTour: Step[] = [
  {
    target: "body",
    content: "Track money you've lent to others and manage repayments here.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="add-loan"]',
    content: "Record a new loan by entering the borrower's details and loan amount.",
    placement: "bottom",
  },
  {
    target: '[data-tour="total-outstanding"]',
    content: "This shows the total amount of money currently owed to you.",
    placement: "bottom",
  },
  {
    target: '[data-tour="loan-cards"]',
    content: "Each loan card shows the borrower, amount, status, and payment history. You can record payments, edit details, or mark as paid.",
    placement: "top",
  },
]

export const reportsTour: Step[] = [
  {
    target: "body",
    content: "Analyze your financial data and export reports here.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="month-selector"]',
    content: "Select different months to view historical data and trends.",
    placement: "bottom",
  },
  {
    target: '[data-tour="export-buttons"]',
    content: "Export your data as CSV files for backup or analysis in other tools.",
    placement: "bottom",
  },
  {
    target: '[data-tour="summary-cards"]',
    content: "Get detailed insights into your monthly income, expenses, and budget performance.",
    placement: "bottom",
  },
  {
    target: '[data-tour="category-breakdown"]',
    content: "See exactly where your money goes with detailed category breakdowns and percentages.",
    placement: "top",
  },
]

export const settingsTour: Step[] = [
  {
    target: "body",
    content: "Manage your account settings and data here.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile"]',
    content: "View your account information and membership details.",
    placement: "bottom",
  },
  {
    target: '[data-tour="data-management"]',
    content: "Information about how your data is stored and managed.",
    placement: "bottom",
  },
  {
    target: '[data-tour="danger-zone"]',
    content: "⚠️ This section contains data deletion options. Use these features carefully as they cannot be undone!",
    placement: "top",
  },
]

export const bottomNavTour: Step[] = [
  {
    target: '[data-tour="nav-overview"]',
    content: "Tap here to view your financial overview and dashboard.",
    placement: "top",
  },
  {
    target: '[data-tour="nav-transactions"]',
    content: "Access your activity feed with all transactions and loans.",
    placement: "top",
  },
  {
    target: '[data-tour="nav-analytics"]',
    content: "View reports and analytics for deeper insights.",
    placement: "top",
  },
  {
    target: '[data-tour="nav-settings"]',
    content: "Manage your account settings and preferences.",
    placement: "top",
  },
]

export const getMobileStyles = () => ({
  options: {
    arrowColor: "hsl(var(--background))",
    backgroundColor: "hsl(var(--background))",
    textColor: "hsl(var(--foreground))",
    primaryColor: "hsl(var(--primary))",
    overlayColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 10000,
  },
  tooltip: {
    fontSize: "14px",
    padding: "16px",
    backgroundColor: "hsl(var(--background))",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
  tooltipContainer: {
    textAlign: "left" as const,
    backgroundColor: "hsl(var(--background))",
  },
  buttonNext: {
    backgroundColor: "hsl(var(--primary))",
    fontSize: "14px",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
  },
  buttonBack: {
    color: "hsl(var(--muted-foreground))",
    fontSize: "14px",
    backgroundColor: "transparent",
    border: "none",
  },
  buttonSkip: {
    color: "hsl(var(--muted-foreground))",
    fontSize: "14px",
    backgroundColor: "transparent",
    border: "none",
  },
})

export const getDesktopStyles = () => ({
  options: {
    arrowColor: "hsl(var(--background))",
    backgroundColor: "hsl(var(--background))",
    textColor: "hsl(var(--foreground))",
    primaryColor: "hsl(var(--primary))",
    overlayColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 10000,
  },
  tooltip: {
    fontSize: "16px",
    padding: "20px",
    backgroundColor: "hsl(var(--background))",
    borderRadius: "8px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  tooltipContainer: {
    textAlign: "left" as const,
    backgroundColor: "hsl(var(--background))",
  },
  buttonNext: {
    backgroundColor: "hsl(var(--primary))",
    fontSize: "14px",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
  },
  buttonBack: {
    color: "hsl(var(--muted-foreground))",
    fontSize: "14px",
    backgroundColor: "transparent",
    border: "none",
  },
  buttonSkip: {
    color: "hsl(var(--muted-foreground))",
    fontSize: "14px",
    backgroundColor: "transparent",
    border: "none",
  },
})
