import { getTeamMembers } from "@/app/actions/team";
import SettingsClient from "./settings-client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
    let teamMembers: Awaited<ReturnType<typeof getTeamMembers>> = [];
    try {
        teamMembers = await getTeamMembers();
    } catch (err) {
        console.error("Failed to fetch team members:", err);
    }

    return <SettingsClient teamMembers={teamMembers} />;
}
