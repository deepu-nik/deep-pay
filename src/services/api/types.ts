import type { CreateExpenseInput, CreateGroupInput, Expense, Friend, Group, HomeSummary } from "@/src/types/domain";
export interface FriendService { listFriends(): Promise<Friend[]>; addFriend(name: string): Promise<Friend>; }
export interface ExpenseService { listRecent(): Promise<Expense[]>; getHomeSummary(): Promise<HomeSummary>; createExpense(input: CreateExpenseInput): Promise<Expense>; }
export interface GroupService { listGroups(): Promise<Group[]>; createGroup(input: CreateGroupInput): Promise<Group>; }
