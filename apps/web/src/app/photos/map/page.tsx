import { PhotoMapPage } from "@/domain/PhotoMap/PhotoMapPage";

export const metadata = { title: "Place log" };

export default function PhotosMapPage() {
  return (
    <div className="h-dvh w-full">
      <PhotoMapPage />
    </div>
  );
}
