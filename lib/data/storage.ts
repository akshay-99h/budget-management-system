import connectDB from "@/lib/db/mongodb";
import UserModel from "@/lib/models/User";
import TransactionModel from "@/lib/models/Transaction";
import BudgetModel from "@/lib/models/Budget";
import LoanModel from "@/lib/models/Loan";
import SIPModel from "@/lib/models/SIP";
import BankAccountModel from "@/lib/models/BankAccount";
import WishlistModel from "@/lib/models/Wishlist";
import StockModel from "@/lib/models/Stock";
import { Transaction, Budget, Loan, User, SIP, BankAccount, Wishlist, Stock } from "@/lib/types";
import { logger } from "@/lib/utils/logger";

// Ensure database connection
async function ensureConnection() {
  try {
    await connectDB();
  } catch (error) {
    logger.error("Database connection error", error);
    throw new Error(
      "Database connection failed. Please check your MongoDB connection string."
    );
  }
}

// Transaction operations
export async function getTransactions(userId: string): Promise<Transaction[]> {
  await ensureConnection();
  const transactions = await TransactionModel.find({ userId })
    .sort({ date: -1, createdAt: -1 })
    .lean();
  return transactions.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date,
    description: t.description,
    bankAccountId: t.bankAccountId,
    userId: t.userId,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function saveTransaction(
  userId: string,
  transaction: Transaction
): Promise<void> {
  await ensureConnection();
  // Use findOneAndUpdate with upsert to handle duplicates gracefully
  await TransactionModel.findOneAndUpdate(
    { id: transaction.id, userId },
    {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      description: transaction.description,
      bankAccountId: transaction.bankAccountId,
      userId,
      createdAt: new Date(transaction.createdAt),
    },
    { upsert: true, new: true }
  );
}

export async function updateTransaction(
  userId: string,
  id: string,
  updates: Partial<Transaction>
): Promise<void> {
  await ensureConnection();
  const result = await TransactionModel.updateOne(
    { id, userId },
    { $set: updates }
  );
  if (result.matchedCount === 0) {
    throw new Error("Transaction not found");
  }
}

export async function deleteTransaction(
  userId: string,
  id: string
): Promise<void> {
  await ensureConnection();
  const result = await TransactionModel.deleteOne({ id, userId });
  if (result.deletedCount === 0) {
    throw new Error("Transaction not found");
  }
}

// Budget operations
export async function getBudgets(userId: string): Promise<Budget[]> {
  await ensureConnection();
  const budgets = await BudgetModel.find({ userId }).lean();
  return budgets.map((b) => ({
    id: b.id,
    category: b.category,
    month: b.month,
    limit: b.limit,
    userId: b.userId,
  }));
}

export async function saveBudget(
  userId: string,
  budget: Budget
): Promise<void> {
  await ensureConnection();
  await BudgetModel.findOneAndUpdate(
    { category: budget.category, month: budget.month, userId },
    {
      id: budget.id,
      category: budget.category,
      month: budget.month,
      limit: budget.limit,
      userId,
    },
    { upsert: true, new: true }
  );
}

export async function deleteBudget(userId: string, id: string): Promise<void> {
  await ensureConnection();
  const result = await BudgetModel.deleteOne({ id, userId });
  if (result.deletedCount === 0) {
    throw new Error("Budget not found");
  }
}

// Loan operations
export async function getLoans(userId: string): Promise<Loan[]> {
  await ensureConnection();
  const loans = await LoanModel.find({ userId }).sort({ date: -1 }).lean();
  return loans.map((l) => ({
    id: l.id,
    borrowerName: l.borrowerName,
    borrowerEmail: l.borrowerEmail,
    amount: l.amount,
    date: l.date,
    dueDate: l.dueDate,
    status: l.status,
    payments: l.payments,
    notes: l.notes,
    userId: l.userId,
    reminderEnabled: l.reminderEnabled ?? true,
    lastReminderSent: l.lastReminderSent,
  }));
}

export async function saveLoan(userId: string, loan: Loan): Promise<void> {
  await ensureConnection();
  // Use findOneAndUpdate with upsert to handle duplicates gracefully
  await LoanModel.findOneAndUpdate(
    { id: loan.id, userId },
    {
      id: loan.id,
      borrowerName: loan.borrowerName,
      borrowerEmail: loan.borrowerEmail,
      amount: loan.amount,
      date: loan.date,
      dueDate: loan.dueDate,
      status: loan.status,
      payments: loan.payments,
      notes: loan.notes,
      userId,
      reminderEnabled: loan.reminderEnabled ?? true,
      lastReminderSent: loan.lastReminderSent,
    },
    { upsert: true, new: true }
  );
}

export async function updateLoan(
  userId: string,
  id: string,
  updates: Partial<Loan>
): Promise<void> {
  await ensureConnection();
  const result = await LoanModel.updateOne({ id, userId }, { $set: updates });
  if (result.matchedCount === 0) {
    throw new Error("Loan not found");
  }
}

export async function deleteLoan(userId: string, id: string): Promise<void> {
  await ensureConnection();
  const result = await LoanModel.deleteOne({ id, userId });
  if (result.deletedCount === 0) {
    throw new Error("Loan not found");
  }
}

// User operations
export async function getUsers(): Promise<User[]> {
  await ensureConnection();
  const users = await UserModel.find().lean();
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function getUserByEmail(email: string): Promise<User | null> {
  await ensureConnection();
  const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getUserById(id: string): Promise<User | null> {
  await ensureConnection();
  const user = await UserModel.findOne({ id }).lean();
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function saveUser(user: User): Promise<void> {
  await ensureConnection();
  await UserModel.findOneAndUpdate(
    { id: user.id },
    {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      password: user.password,
      createdAt: new Date(user.createdAt),
    },
    { upsert: true, new: true }
  );
}

// Batch delete operations
export async function deleteTransactionsByMonth(
  userId: string,
  month: string
): Promise<void> {
  await ensureConnection();
  await TransactionModel.deleteMany({
    userId,
    date: { $regex: `^${month}` },
  });
}

export async function deleteTransactionsByYear(
  userId: string,
  year: string
): Promise<void> {
  await ensureConnection();
  await TransactionModel.deleteMany({
    userId,
    date: { $regex: `^${year}` },
  });
}

export async function deleteBudgetsByMonth(
  userId: string,
  month: string
): Promise<void> {
  await ensureConnection();
  await BudgetModel.deleteMany({ userId, month });
}

export async function deleteBudgetsByYear(
  userId: string,
  year: string
): Promise<void> {
  await ensureConnection();
  await BudgetModel.deleteMany({
    userId,
    month: { $regex: `^${year}` },
  });
}

export async function deleteAllTransactions(userId: string): Promise<void> {
  await ensureConnection();
  await TransactionModel.deleteMany({ userId });
}

export async function deleteAllBudgets(userId: string): Promise<void> {
  await ensureConnection();
  await BudgetModel.deleteMany({ userId });
}

export async function deleteAllLoans(userId: string): Promise<void> {
  await ensureConnection();
  await LoanModel.deleteMany({ userId });
}

export async function deleteUser(userId: string): Promise<void> {
  await ensureConnection();
  // Delete all user data first
  await Promise.all([
    TransactionModel.deleteMany({ userId }),
    BudgetModel.deleteMany({ userId }),
    LoanModel.deleteMany({ userId }),
    SIPModel.deleteMany({ userId }),
    BankAccountModel.deleteMany({ userId }),
    WishlistModel.deleteMany({ userId }),
    StockModel.deleteMany({ userId }),
  ]);
  // Then delete the user
  await UserModel.deleteOne({ id: userId });
}

// SIP operations
export async function getSIPs(userId: string): Promise<SIP[]> {
  await ensureConnection();
  const sips = await SIPModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
  return sips.map((s) => ({
    id: s.id,
    name: s.name,
    amount: s.amount,
    frequency: s.frequency,
    startDate: s.startDate,
    endDate: s.endDate,
    category: s.category,
    description: s.description,
    isActive: s.isActive,
    lastExecuted: s.lastExecuted,
    nextExecutionDate: s.nextExecutionDate,
    currentNetValue: s.currentNetValue,
    adjustments: s.adjustments || [],
    userId: s.userId,
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function getSIPById(
  userId: string,
  id: string
): Promise<SIP | null> {
  await ensureConnection();
  const sip = await SIPModel.findOne({ id, userId }).lean();
  if (!sip) return null;
  return {
    id: sip.id,
    name: sip.name,
    amount: sip.amount,
    frequency: sip.frequency,
    startDate: sip.startDate,
    endDate: sip.endDate,
    category: sip.category,
    description: sip.description,
    isActive: sip.isActive,
    lastExecuted: sip.lastExecuted,
    nextExecutionDate: sip.nextExecutionDate,
    currentNetValue: sip.currentNetValue,
    adjustments: sip.adjustments || [],
    userId: sip.userId,
    createdAt: sip.createdAt.toISOString(),
  };
}

export async function saveSIP(userId: string, sip: SIP): Promise<void> {
  await ensureConnection();
  await SIPModel.findOneAndUpdate(
    { id: sip.id, userId },
    {
      id: sip.id,
      name: sip.name,
      amount: sip.amount,
      frequency: sip.frequency,
      startDate: sip.startDate,
      endDate: sip.endDate,
      category: sip.category,
      description: sip.description,
      isActive: sip.isActive,
      lastExecuted: sip.lastExecuted,
      nextExecutionDate: sip.nextExecutionDate,
      currentNetValue: sip.currentNetValue,
      adjustments: sip.adjustments || [],
      userId,
      createdAt: new Date(sip.createdAt),
    },
    { upsert: true, new: true }
  );
}

export async function updateSIP(
  userId: string,
  id: string,
  updates: Partial<SIP>
): Promise<void> {
  await ensureConnection();
  const result = await SIPModel.updateOne({ id, userId }, { $set: updates });
  if (result.matchedCount === 0) {
    throw new Error("SIP not found");
  }
}

export async function deleteSIP(userId: string, id: string): Promise<void> {
  await ensureConnection();
  const result = await SIPModel.deleteOne({ id, userId });
  if (result.deletedCount === 0) {
    throw new Error("SIP not found");
  }
}

export async function deleteAllSIPs(userId: string): Promise<void> {
  await ensureConnection();
  await SIPModel.deleteMany({ userId });
}

// Bank Account operations
export async function getBankAccounts(userId: string): Promise<BankAccount[]> {
  await ensureConnection();
  const accounts = await BankAccountModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    accountNumber: a.accountNumber,
    accountType: a.accountType,
    balance: a.balance,
    currency: a.currency,
    isDefault: a.isDefault,
    userId: a.userId,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function getBankAccountById(userId: string, id: string): Promise<BankAccount | null> {
  await ensureConnection();
  const account = await BankAccountModel.findOne({ id, userId }).lean();
  if (!account) return null;
  return {
    id: account.id,
    name: account.name,
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    balance: account.balance,
    currency: account.currency,
    isDefault: account.isDefault,
    userId: account.userId,
    createdAt: account.createdAt.toISOString(),
  };
}

export async function saveBankAccount(userId: string, account: BankAccount): Promise<void> {
  await ensureConnection();
  // If this is set as default, unset all others
  if (account.isDefault) {
    await BankAccountModel.updateMany({ userId }, { $set: { isDefault: false } });
  }
  await BankAccountModel.findOneAndUpdate(
    { id: account.id, userId },
    {
      id: account.id,
      name: account.name,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      balance: account.balance,
      currency: account.currency,
      isDefault: account.isDefault,
      userId,
      createdAt: new Date(account.createdAt),
    },
    { upsert: true, new: true }
  );
}

export async function updateBankAccount(userId: string, id: string, updates: Partial<BankAccount>): Promise<void> {
  await ensureConnection();
  // If setting as default, unset all others first
  if (updates.isDefault === true) {
    await BankAccountModel.updateMany({ userId }, { $set: { isDefault: false } });
  }
  const result = await BankAccountModel.updateOne({ id, userId }, { $set: updates });
  if (result.matchedCount === 0) {
    throw new Error("Bank account not found");
  }
}

export async function deleteBankAccount(userId: string, id: string): Promise<void> {
  await ensureConnection();
  const result = await BankAccountModel.deleteOne({ id, userId });
  if (result.deletedCount === 0) {
    throw new Error("Bank account not found");
  }
}

export async function deleteAllBankAccounts(userId: string): Promise<void> {
  await ensureConnection();
  await BankAccountModel.deleteMany({ userId });
}

// Wishlist operations
export async function getWishlistItems(userId: string): Promise<Wishlist[]> {
  await ensureConnection();
  const items = await WishlistModel.find({ userId }).sort({ priority: 1, createdAt: -1 }).lean();
  return items.map((w) => ({
    id: w.id,
    itemName: w.itemName,
    description: w.description,
    estimatedPrice: w.estimatedPrice,
    priority: w.priority,
    category: w.category,
    link: w.link,
    isPurchased: w.isPurchased,
    purchasedDate: w.purchasedDate,
    actualPrice: w.actualPrice,
    userId: w.userId,
    createdAt: w.createdAt.toISOString(),
  }));
}

export async function getWishlistById(userId: string, id: string): Promise<Wishlist | null> {
  await ensureConnection();
  const item = await WishlistModel.findOne({ id, userId }).lean();
  if (!item) return null;
  return {
    id: item.id,
    itemName: item.itemName,
    description: item.description,
    estimatedPrice: item.estimatedPrice,
    priority: item.priority,
    category: item.category,
    link: item.link,
    isPurchased: item.isPurchased,
    purchasedDate: item.purchasedDate,
    actualPrice: item.actualPrice,
    userId: item.userId,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function saveWishlist(userId: string, item: Wishlist): Promise<void> {
  await ensureConnection();
  await WishlistModel.findOneAndUpdate(
    { id: item.id, userId },
    {
      id: item.id,
      itemName: item.itemName,
      description: item.description,
      estimatedPrice: item.estimatedPrice,
      priority: item.priority,
      category: item.category,
      link: item.link,
      isPurchased: item.isPurchased,
      purchasedDate: item.purchasedDate,
      actualPrice: item.actualPrice,
      userId,
      createdAt: new Date(item.createdAt),
    },
    { upsert: true, new: true }
  );
}

export async function updateWishlist(userId: string, id: string, updates: Partial<Wishlist>): Promise<void> {
  await ensureConnection();
  const result = await WishlistModel.updateOne({ id, userId }, { $set: updates });
  if (result.matchedCount === 0) {
    throw new Error("Wishlist item not found");
  }
}

export async function deleteWishlist(userId: string, id: string): Promise<void> {
  await ensureConnection();
  const result = await WishlistModel.deleteOne({ id, userId });
  if (result.deletedCount === 0) {
    throw new Error("Wishlist item not found");
  }
}

export async function deleteAllWishlist(userId: string): Promise<void> {
  await ensureConnection();
  await WishlistModel.deleteMany({ userId });
}

// Stock operations
export async function getStocks(userId: string): Promise<Stock[]> {
  await ensureConnection();
  const stocks = await StockModel.find({ userId }).sort({ purchaseDate: -1 }).lean();
  return stocks.map((s) => ({
    id: s.id,
    symbol: s.symbol,
    name: s.name,
    quantity: s.quantity,
    purchasePrice: s.purchasePrice,
    currentPrice: s.currentPrice,
    purchaseDate: s.purchaseDate,
    broker: s.broker,
    category: s.category,
    notes: s.notes,
    userId: s.userId,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
}

export async function getStockById(userId: string, id: string): Promise<Stock | null> {
  await ensureConnection();
  const stock = await StockModel.findOne({ id, userId }).lean();
  if (!stock) return null;
  return {
    id: stock.id,
    symbol: stock.symbol,
    name: stock.name,
    quantity: stock.quantity,
    purchasePrice: stock.purchasePrice,
    currentPrice: stock.currentPrice,
    purchaseDate: stock.purchaseDate,
    broker: stock.broker,
    category: stock.category,
    notes: stock.notes,
    userId: stock.userId,
    createdAt: stock.createdAt.toISOString(),
    updatedAt: stock.updatedAt.toISOString(),
  };
}

export async function saveStock(userId: string, stock: Stock): Promise<void> {
  await ensureConnection();
  await StockModel.findOneAndUpdate(
    { id: stock.id, userId },
    {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      quantity: stock.quantity,
      purchasePrice: stock.purchasePrice,
      currentPrice: stock.currentPrice,
      purchaseDate: stock.purchaseDate,
      broker: stock.broker,
      category: stock.category,
      notes: stock.notes,
      userId,
      createdAt: new Date(stock.createdAt),
      updatedAt: new Date(stock.updatedAt),
    },
    { upsert: true, new: true }
  );
}

export async function updateStock(userId: string, id: string, updates: Partial<Stock>): Promise<void> {
  await ensureConnection();
  const result = await StockModel.updateOne(
    { id, userId },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  if (result.matchedCount === 0) {
    throw new Error("Stock not found");
  }
}

export async function deleteStock(userId: string, id: string): Promise<void> {
  await ensureConnection();
  const result = await StockModel.deleteOne({ id, userId });
  if (result.deletedCount === 0) {
    throw new Error("Stock not found");
  }
}

export async function deleteAllStocks(userId: string): Promise<void> {
  await ensureConnection();
  await StockModel.deleteMany({ userId });
}
