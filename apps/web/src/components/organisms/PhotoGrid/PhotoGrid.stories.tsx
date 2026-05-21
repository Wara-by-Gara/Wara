import type { Meta, StoryObj } from "@storybook/react";
import { AlbumGridSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { PhotoGridItem } from "@/components/organisms/PhotoGridItem";
import { PhotoGrid } from "./PhotoGrid";

const meta: Meta<typeof PhotoGrid> = {
  title: "Organisms/PhotoGrid",
  component: PhotoGrid,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "DESIGN.md §24. 기본 3열 그리드." } } },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof PhotoGrid>;

const items = Array.from({ length: 9 }).map((_, i) => (
  <PhotoGridItem key={i} alt={`사진 ${i + 1}`} />
));

export const ThreeColumns: Story = { args: { columns: 3, children: items } };
export const TwoColumns: Story = { args: { columns: 2, children: items.slice(0, 4) } };
export const DateGrouped: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <PhotoGrid groupLabel="오늘">{items.slice(0, 3)}</PhotoGrid>
      <PhotoGrid groupLabel="어제">{items.slice(3, 9)}</PhotoGrid>
    </div>
  ),
};
export const SelectMode: Story = {
  args: {
    selectMode: true,
    columns: 3,
    children: items.map((_, i) => (
      <PhotoGridItem
        key={i}
        hostManageMode
        status={i % 3 === 0 ? "selected" : "default"}
      />
    )),
  },
};
export const Empty: Story = {
  render: () => (
    <EmptyState
      icon="retro-camera"
      title="아직 사진이 없어요"
      description="모임의 첫 사진을 올려보세요"
    />
  ),
};
export const SkeletonState: Story = { render: () => <AlbumGridSkeleton count={6} /> };
