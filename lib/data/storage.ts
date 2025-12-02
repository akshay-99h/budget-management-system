import connectDB from "@/lib/db/mongodb";
import UserModel from "@/lib/models/User";
import TransactionModel from "@/lib/models/Transaction";
import BudgetModel from "@/lib/models/Budget";
import LoanModel from "@/lib/models/Loan";
import { Transaction, Budget, Loan, User } from "@/lib/types";

// Ensure database connection
async function ensureConnection() {
  try {
    await connectDB();
  } catch (error) {
    console.error("Database connection error:", error);
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
    userId: t.userId,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function saveTransaction(
  userId: string,
  transaction: Transaction
): Promise<void> {
  await ensureConnection();
  await TransactionModel.create({
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    date: transaction.date,
    description: transaction.description,
    userId,
    createdAt: new Date(transaction.createdAt),
  });
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
    amount: l.amount,
    date: l.date,
    dueDate: l.dueDate,
    status: l.status,
    payments: l.payments,
    notes: l.notes,
    userId: l.userId,
  }));
}

export async function saveLoan(userId: string, loan: Loan): Promise<void> {
  await ensureConnection();
  await LoanModel.create({
    id: loan.id,
    borrowerName: loan.borrowerName,
    amount: loan.amount,
    date: loan.date,
    dueDate: loan.dueDate,
    status: loan.status,
    payments: loan.payments,
    notes: loan.notes,
    userId,
  });
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
    id: u._id.toString(),
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
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    password: user.password,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getUserById(id: string): Promise<User | null> {
  await ensureConnection();
  const user = await UserModel.findById(id).lean();
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    password: user.password,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function saveUser(user: User): Promise<void> {
  await ensureConnection();
  await UserModel.findByIdAndUpdate(
    user.id,
    {
      name: user.name,
      email: user.email.toLowerCase(),
      password: user.password,
      createdAt: new Date(user.createdAt),
    },
    { upsert: true, new: true }
  );
}
