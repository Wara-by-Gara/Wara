import type { Preview } from "@storybook/react";
import React from "react";
import { MobileDeviceFrame } from "../src/components/layout/MobileDeviceFrame";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "white",
      values: [
        { name: "white", value: "#FFFFFF" },
        { name: "gray-50", value: "#FAFAFA" },
        { name: "pink-50", value: "#FFF1F7" },
        { name: "sky-50", value: "#EEF8FF" },
        { name: "yellow-50", value: "#FFFBEA" },
        { name: "black", value: "#171717" },
      ],
    },
    layout: "centered",
    viewport: {
      viewports: {
        mobileSmall: {
          name: "Mobile 360",
          styles: { width: "360px", height: "640px" },
          type: "mobile",
        },
        mobile: {
          name: "Mobile 390 (default)",
          styles: { width: "390px", height: "680px" },
          type: "mobile",
        },
        mobileLarge: {
          name: "Mobile 430",
          styles: { width: "430px", height: "720px" },
          type: "mobile",
        },
      },
    },
    nextjs: {
      appDirectory: true,
    },
    options: {
      storySort: {
        order: [
          "Docs",
          [
            "Screens Overview",
            "Colors",
            "Typography",
            "Spacing",
            "IconGrid",
          ],
          "Pages",
          [
            "01 Splash",
            "02 Onboarding",
            "03 Login",
            "04 Signup",
            "05 Home",
            "06 Invitation List",
            "07 Invitation Create",
            "08 Invitation Detail - Guest",
            "09 Invitation Detail - Host",
            "10 Invitation Edit",
            "11 RSVP",
            "12 Participants",
            "13 Map",
            "14 Album",
            "15 Comments",
            "16 Notifications",
            "17 My Page",
            "18 Profile Edit",
            "19 Account",
            "20 Settings",
            "21 Host Notice",
          ],
          "Icons",
          "Primitives",
          "Molecules",
          "Organisms",
          "Layout",
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const isPage = context.title?.startsWith("Pages/");
      const disableFrame = context.parameters?.mobileFrame === false;
      const immersive = context.parameters?.mobileFrameImmersive === true;
      if (!isPage || disableFrame) return <Story />;
      return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
          <MobileDeviceFrame immersive={immersive}>
            <Story />
          </MobileDeviceFrame>
        </div>
      );
    },
  ],
};

export default preview;
