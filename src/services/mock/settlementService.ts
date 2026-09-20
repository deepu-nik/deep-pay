import type { CreateSettlementInput, Settlement } from "@/src/types/domain";
import type { SettlementService } from "@/src/services/api/types";
import { readMockList, writeMockList } from "@/src/services/mock/storage";

const STORAGE_KEY = "@deeppay/mock-settlements";

let settlements: Settlement[] | null = null;

async function getSettlements() {
  if (settlements) return settlements;
  settlements = await readMockList<Settlement>(STORAGE_KEY, []);
  return settlements;
}

export const mockSettlementService: SettlementService = {
  async listByGroup(groupId: string) {
    return (await getSettlements()).filter((settlement) => settlement.groupId === groupId);
  },

  async createSettlement(input: CreateSettlementInput): Promise<Settlement> {
    const current = await getSettlements();
    const settlement: Settlement = {
      ...input,
      id: `settlement-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    settlements = [settlement, ...current];
    await writeMockList(STORAGE_KEY, settlements);
    return settlement;
  },
};
