import { PhotoMapPage } from "@/domain/PhotoMap/PhotoMapPage";

export const metadata = { title: "사진 지도" };

export default function PhotosMapPage() {
  return (
    <div className="h-dvh w-full">
      <PhotoMapPage />
    </div>
  );
}
