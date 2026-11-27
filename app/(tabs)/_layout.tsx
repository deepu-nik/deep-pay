import { Tabs } from "expo-router";
import { ProtectedLayout } from "@/src/components/auth/ProtectedLayout";

export default function TabLayout() {
  return (
    <ProtectedLayout>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="groups" />
        <Tabs.Screen name="activity" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </ProtectedLayout>
  );
}
