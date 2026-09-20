export type Friend = {
  id: string;
  name: string;
};

export type ExpenseCategory = "Food" | "Transport" | "Rent" | "Education" | "Entertainment" | "Shopping" | "Technology" | "Travel" | "Health" | "Other";
export type ExpenseSplitMethod = "equal" | "custom" | "percentage";
export type ExpenseSplit = { userId: string; amount: number; percentage?: number };
export type Expense = { id: string; description: string; amount: number; category: ExpenseCategory; date: string; paidBy: string; participants: string[]; splitMethod?: ExpenseSplitMethod; splits?: ExpenseSplit[]; notes?: string; groupId?: string; createdAt?: string };
export type CreateExpenseInput = Omit<Expense, "id" | "createdAt">;
export type HomeSummary = { monthLabel: string; totalSpent: number; youOwe: number; owedToYou: number };
export type Group = { id: string; name: string; memberIds: string[]; createdAt: string };
export type CreateGroupInput = Omit<Group, "id" | "createdAt">;

export type GroupBalance = {
  userId: string;
  paid: number;
  owed: number;
  net: number;
};
