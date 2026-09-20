import type { Friend } from "@/src/types/domain";
import type { FriendService } from "@/src/services/api/types";
import { readMockList, writeMockList } from "@/src/services/mock/storage";

const STORAGE_KEY = "@deeppay/mock-friends";
const defaultFriends: Friend[] = [
  { id: "aarav", name: "Aarav" },
  { id: "riya", name: "Riya" },
  { id: "kabir", name: "Kabir" },
];

let friends: Friend[] | null = null;

async function getFriends() {
  if (friends) return friends;
  friends = await readMockList(STORAGE_KEY, defaultFriends);
  return friends;
}

export const mockFriendService: FriendService = {
  async listFriends() {
    return [...await getFriends()];
  },
  async addFriend(name: string) {
    const current = await getFriends();
    const friend: Friend = { id: "friend-" + Date.now(), name: name.trim() };
    friends = [...current, friend];
    await writeMockList(STORAGE_KEY, friends);
    return friend;
  },
};
