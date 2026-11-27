import { Stack } from "expo-router";
import { ProtectedLayout } from "@/src/components/auth/ProtectedLayout";

export default function ProfileLayout() {
  return (
    <ProtectedLayout>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedLayout>
  );
}
