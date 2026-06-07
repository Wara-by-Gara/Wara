import type { Decorator } from "@storybook/react";
import { LumaCanvas } from "./LumaCanvas";

export const lumaDecorator: Decorator = (Story) => (
  <div className="min-h-[200px] w-full bg-white p-6">
    <LumaCanvas>
      <Story />
    </LumaCanvas>
  </div>
);
