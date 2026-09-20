import type { CreateExpenseInput, CreateGroupInput, Expense, Friend, Group, GroupBalance, HomeSummary } from "@/src/types/domain";

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

export interface GroupService {
  listGroups(): Promise<Group[]>;
  createGroup(input: CreateGroupInput): Promise<Group>;
  updateGroup(id: string, input: CreateGroupInput): Promise<Group>;
  deleteGroup(id: string): Promise<void>;
}
