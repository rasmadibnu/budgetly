import { ProfileView } from "@/features/profile/components/profile-view";
import { requireUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await requireUser();
  return <ProfileView user={user} />;
}
