import type { CreateGroupInput, Group } from "@/src/types/domain";
import type { GroupService } from "@/src/services/api/types";
import { readMockList, writeMockList } from "@/src/services/mock/storage";

const STORAGE_KEY = "@deeppay/mock-groups";
const defaultGroups: Group[] = [
  { id: "goa-trip", name: "Goa Trip", memberIds: ["You", "aarav", "riya"], createdAt: new Date().toISOString() },
  { id: "flat-expenses", name: "Flat Expenses", memberIds: ["You", "kabir"], createdAt: new Date().toISOString() },
];

let groups: Group[] | null = null;

async function getGroups() {
  if (groups) return groups;
  groups = await readMockList(STORAGE_KEY, defaultGroups);
  return groups;
}

export const mockGroupService: GroupService = {
  async listGroups() {
    return [...await getGroups()];
  },
  async createGroup(input: CreateGroupInput) {
    const current = await getGroups();
    const next: Group = { ...input, id: "group-" + Date.now(), createdAt: new Date().toISOString() };
    groups = [next, ...current];
    await writeMockList(STORAGE_KEY, groups);
    return next;
  },
  async updateGroup(id: string, input: CreateGroupInput) {
    const current = await getGroups();
    const existing = current.find((group) => group.id === id);
    if (!existing) throw new Error("Group not found");
    const updated: Group = { ...existing, ...input };
    groups = current.map((group) => group.id === id ? updated : group);
    await writeMockList(STORAGE_KEY, groups);
    return updated;
  },
  async deleteGroup(id: string) {
    const current = await getGroups();
    groups = current.filter((group) => group.id !== id);
    await writeMockList(STORAGE_KEY, groups);
  },
};
