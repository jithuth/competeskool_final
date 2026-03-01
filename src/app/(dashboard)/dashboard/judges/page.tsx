import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JudgesManager } from "@/components/dashboard/judges/JudgesManager";

export default async function JudgesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "super_admin") redirect("/dashboard");

    const { data: judgesRaw } = await supabase
        .from("profiles")
        .select(`id, full_name, email, status, created_at, judges(expertise, bio)`)
        .eq("role", "judge")
        .order("created_at", { ascending: false });

    const judges = (judgesRaw || []).map((j: any) => ({
        id: j.id,
        full_name: j.full_name || "",
        email: j.email || "",
        status: j.status,
        created_at: j.created_at,
        expertise: j.judges?.[0]?.expertise || "",
        bio: j.judges?.[0]?.bio || "",
    }));

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <JudgesManager initialJudges={judges} />
        </div>
    );
}
