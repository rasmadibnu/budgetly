import { SettingsView } from "@/features/settings/components/settings-view";
import { getCategories } from "@/services/category-service";
import { getHouseholdContext } from "@/services/household-service";

export default async function SettingsPage() {
  const [{ profile }, categories] = await Promise.all([getHouseholdContext(), getCategories()]);
  return <SettingsView user={profile} categories={categories} />;
}
