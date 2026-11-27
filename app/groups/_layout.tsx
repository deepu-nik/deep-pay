import { Stack } from "expo-router";
import { ProtectedLayout } from "@/src/components/auth/ProtectedLayout";

export default function GroupsLayout() {
  return (
    <ProtectedLayout>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedLayout>
  );
}
