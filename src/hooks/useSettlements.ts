import { useCallback, useState } from "react";
import { firebaseSettlementService } from "@/src/services/firebase/settlementService";
import type { CreateSettlementInput, Settlement } from "@/src/types/domain";

export function useSettlements() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listByGroup = useCallback((groupId: string): Promise<Settlement[]> => {
    return firebaseSettlementService.listByGroup(groupId);
  }, []);

  const createSettlement = useCallback(async (input: CreateSettlementInput): Promise<Settlement | null> => {
    setSaving(true);
    setError(null);
    try {
      return await firebaseSettlementService.createSettlement(input);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't record the settlement. Please try again.");
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const confirmSettlement = useCallback(async (groupId: string, settlementId: string) => {
    setSaving(true);
    setError(null);
    try {
      await firebaseSettlementService.confirmSettlement(groupId, settlementId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't confirm this settlement.");
      throw cause;
    } finally {
      setSaving(false);
    }
  }, []);

  return { listByGroup, createSettlement, confirmSettlement, saving, error };
}
