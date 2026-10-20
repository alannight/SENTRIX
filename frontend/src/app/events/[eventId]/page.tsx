import { EventDetail } from "@/components/event-detail";

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <p className="eyebrow">Record inspection</p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          Event Detail
        </h1>
      </header>
      <EventDetail eventId={eventId} />
    </div>
  );
}
