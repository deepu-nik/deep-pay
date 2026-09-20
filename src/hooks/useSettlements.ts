import { useCallback, useState } from "react";
import { mockSettlementService } from "@/src/services/mock/settlementService";
import type { CreateSettlementInput, Settlement } from "@/src/types/domain";

export function useSettlements() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listByGroup = useCallback(async (groupId: string): Promise<Settlement[]> => {
    return mockSettlementService.listByGroup(groupId);
  }, []);

  const createSettlement = useCallback(async (input: CreateSettlementInput): Promise<Settlement | null> => {
    setSaving(true);
    setError(null);
    try {
      return await mockSettlementService.createSettlement(input);
    } catch {
      setError("We couldn't record the settlement. Please try again.");
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return { listByGroup, createSettlement, saving, error };
}
