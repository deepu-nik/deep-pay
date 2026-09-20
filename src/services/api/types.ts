import type { CreateExpenseInput, CreateGroupInput, CreateSettlementInput, Expense, Friend, Group, GroupBalance, HomeSummary, Settlement } from "@/src/types/domain";

export interface FriendService {
  listFriends(): Promise<Friend[]>;
  addFriend(name: string): Promise<Friend>;
}

export interface ExpenseService {
  listRecent(): Promise<Expense[]>;
  listByGroup(groupId: string): Promise<Expense[]>;
  getHomeSummary(): Promise<HomeSummary>;
  createExpense(input: CreateExpenseInput): Promise<Expense>;
  getGroupBalances(groupId: string): Promise<GroupBalance[]>;
}

export interface SettlementService {
  listByGroup(groupId: string): Promise<Settlement[]>;
  createSettlement(input: CreateSettlementInput): Promise<Settlement>;
}

export interface GroupService {
  listGroups(): Promise<Group[]>;
  createGroup(input: CreateGroupInput): Promise<Group>;
  updateGroup(id: string, input: CreateGroupInput): Promise<Group>;
  deleteGroup(id: string): Promise<void>;
}
