import ExploreMapContainer from "@/domain/Explore/ExploreMapContainer";

export const metadata = { title: "탐색 지도" };

export default function ExploreMapPage() {
  return (
    <div className="h-dvh w-full">
      <ExploreMapContainer />
    </div>
  );
}
