import type { CreateGroupInput, Group } from "@/src/types/domain";
import type { GroupService } from "@/src/services/api/types";
let groups: Group[] = [
  { id: "goa-trip", name: "Goa Trip", memberIds: ["You", "aarav", "riya"], createdAt: new Date().toISOString() },
  { id: "flat-expenses", name: "Flat Expenses", memberIds: ["You", "kabir"], createdAt: new Date().toISOString() },
];
export const mockGroupService: GroupService = {
  async listGroups() { return [...groups]; },
  async createGroup(input: CreateGroupInput) {
    const next: Group = { ...input, id: "group-" + Date.now(), createdAt: new Date().toISOString() };
    groups = [next, ...groups]; return next;
  },
  async updateGroup(id: string, input: CreateGroupInput) {
    const current = groups.find((group) => group.id === id);
    if (!current) throw new Error("Group not found");
    const updated: Group = { ...current, ...input };
    groups = groups.map((group) => group.id === id ? updated : group);
    return updated;
  },
  async deleteGroup(id: string) {
    groups = groups.filter((group) => group.id !== id);
  },
};
