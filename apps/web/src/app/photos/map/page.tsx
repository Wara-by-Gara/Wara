import { PhotoMapPage } from "@/domain/PhotoMap/PhotoMapPage";

export const metadata = { title: "Photo log" };

export default async function PhotosMapPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string }>;
}) {
  const { invitationId } = await searchParams;
  return (
    <div className="h-dvh w-full">
      <PhotoMapPage invitationId={invitationId} />
    </div>
  );
}
