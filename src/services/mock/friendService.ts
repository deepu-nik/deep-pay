import type { Friend } from "@/src/types/domain";
import type { FriendService } from "@/src/services/api/types";

const friends: Friend[] = [
  { id: "aarav", name: "Aarav" },
  { id: "riya", name: "Riya" },
  { id: "kabir", name: "Kabir" },
];

export const mockFriendService: FriendService = {
  async listFriends() {
    return [...friends];
  },
};
