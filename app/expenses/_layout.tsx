import { Stack } from "expo-router";
import { ProtectedLayout } from "@/src/components/auth/ProtectedLayout";

export default function ExpensesLayout() {
  return (
    <ProtectedLayout>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedLayout>
  );
}
