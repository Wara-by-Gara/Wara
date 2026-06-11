import { PhotoMapPage } from "@/domain/PhotoMap/PhotoMapPage";

export const metadata = { title: "내 추억 지도" };

export default function PhotosMapPage() {
  return (
    <div className="h-dvh w-full">
      <PhotoMapPage />
    </div>
  );
}
