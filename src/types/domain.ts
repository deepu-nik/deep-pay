export type ExpenseCategory = "Food" | "Transport" | "Rent" | "Education" | "Entertainment" | "Shopping" | "Technology" | "Travel" | "Health" | "Other";

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paidBy: string;
  participants: string[];
  groupId?: string;
};

export type HomeSummary = {
  monthLabel: string;
  totalSpent: number;
  youOwe: number;
  owedToYou: number;
};
