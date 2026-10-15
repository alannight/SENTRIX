import { EventDetail } from "@/components/event-detail";

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <div className="mx-auto max-w-5xl space-y-7"><header><p className="eyebrow">Record inspection</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Event detail</h1></header><EventDetail eventId={eventId} /></div>;
}

