import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/dashboard/events/columns";
import { CreateEventButton } from "@/components/dashboard/events/CreateEventButton";
import { EventCard } from "@/components/dashboard/events/EventCard";
import { getCurrentUserAction } from "@/app/actions/session";

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
    const supabase = await createClient();
    const session = await getCurrentUserAction();
    const isSuperAdmin = session?.role === 'super_admin';
    const userRole = session?.role as any;

    const { data: allEvents, error: eventsError } = await supabase
        .from("events")
        .select("*, schools(name)")
        .order("created_at", { ascending: false });

    if (eventsError) {
        console.error("Database Fetch Error (Events):", eventsError);
    }

    const events = isSuperAdmin ? allEvents : allEvents?.filter(event => {
        if (!event.is_private) return true;
        return event.school_id === session?.school_id;
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between animate-in fade-in duration-500">
                <div>
                    <h1 className="text-4xl font-black font-outfit uppercase tracking-tight">
                        {isSuperAdmin ? "Manage Events" : "Competitions Arena"}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {isSuperAdmin
                            ? "Coordinate and launch institutional competitions."
                            : "Explore and participate in active events."}
                    </p>
                </div>
                {isSuperAdmin && <CreateEventButton />}
            </div>

            {isSuperAdmin ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <DataTable
                        columns={columns}
                        data={events || []}
                        searchKey="title"
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    {(events || []).map((event) => (
                        <EventCard key={event.id} event={event} role={userRole} />
                    ))}
                    {(events || []).length === 0 && (
                        <div className="col-span-full py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <p className="font-bold uppercase tracking-widest text-xs">No active competitions found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
