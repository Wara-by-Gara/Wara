import { MapContainer } from "@/domain/Location/MapContainer";

interface Props {
  params: Promise<{ invitationId: string }>;
}

export default async function LocationPage({ params }: Props) {
  const { invitationId } = await params;
  return <MapContainer invitationId={invitationId} />;
}
