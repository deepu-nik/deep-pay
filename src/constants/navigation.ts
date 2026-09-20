export const navigationItems = [
  { label: "Home", icon: "home-outline", activeIcon: "home" },
  { label: "Groups", icon: "people-outline", activeIcon: "people" },
  { label: "Activity", icon: "time-outline", activeIcon: "time" },
  { label: "Profile", icon: "person-outline", activeIcon: "person" },
] as const;

export const quickActions = [
  { label: "Scan", icon: "qr-code" },
  { label: "Split", icon: "git-branch-outline" },
  { label: "Request", icon: "arrow-down-circle-outline" },
  { label: "Expense", icon: "add-circle-outline" },
] as const;
