export type Friend = {
  id: string;
  name: string;
};

export type GroupMember = {
  uid: string;
  displayName: string;
  role: "owner" | "member";
  joinedAt: string;
};

export type ExpenseCategory = "Food" | "Transport" | "Rent" | "Education" | "Entertainment" | "Shopping" | "Technology" | "Travel" | "Health" | "Other";
export type ExpenseSplitMethod = "equal" | "custom" | "percentage";
export type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer" | "unknown";
export type SettlementStatus = "payer_marked_paid" | "confirmed" | "rejected";
export type ExpenseSplit = { userId: string; amount: number; percentage?: number };
export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paidBy: string;
  participants: string[];
  splitMethod?: ExpenseSplitMethod;
  splits?: ExpenseSplit[];
  notes?: string;
  groupId?: string;
  paymentMethod?: PaymentMethod;
  createdAt?: string;
};
export type CreateExpenseInput = Omit<Expense, "id" | "createdAt">;
export type HomeSummary = { monthLabel: string; totalSpent: number; youOwe: number; owedToYou: number };
export type Group = { id: string; name: string; memberIds: string[]; createdAt: string; createdByUid?: string };
export type CreateGroupInput = Omit<Group, "id" | "createdAt" | "createdByUid">;

export type GroupBalance = {
  userId: string;
  paid: number;
  owed: number;
  net: number;
};

export type Settlement = {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: string;
  createdAt: string;
  status?: SettlementStatus;
  paymentMethod?: "cash" | "upi";
  reference?: string;
};

export type CreateSettlementInput = Omit<Settlement, "id" | "createdAt" | "status">;
