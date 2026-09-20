import type { Friend } from "@/src/types/domain";
import type { FriendService } from "@/src/services/api/types";
let friends: Friend[] = [
  { id: "aarav", name: "Aarav" }, { id: "riya", name: "Riya" }, { id: "kabir", name: "Kabir" },
];
export const mockFriendService: FriendService = {
  async listFriends() { return [...friends]; },
  async addFriend(name: string) {
    const friend: Friend = { id: "friend-" + Date.now(), name: name.trim() };
    friends = [...friends, friend]; return friend;
  },
};
