import type { Preview } from "@storybook/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { MobileDeviceFrame } from "../src/components/layout/MobileDeviceFrame";
import { getQueryClient } from "../src/lib/query-client";
import { pageStoryParameters } from "./pageStoryParameters";
import "../src/app/globals.css";

/** 디자인 시스템 테마 토글 (data-theme) — 툴바에서 라이트/다크 전환 */
export const globalTypes = {
  theme: {
    description: "디자인 시스템 테마",
    defaultValue: "light",
    toolbar: {
      title: "Theme",
      icon: "circlehollow",
      items: [
        { value: "light", title: "Light", icon: "sun" },
        { value: "dark", title: "Dark", icon: "moon" },
      ],
      dynamicTitle: true,
    },
  },
};

const preview: Preview = {
  initialGlobals: {
    backgrounds: { value: "white" },
  },
  parameters: {
    layout: "centered",
    docs: pageStoryParameters.docs,
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
        { name: "gray-50", value: "#F7F8F9" },
        { name: "cranberry-5", value: "#FEF4F9" },
        { name: "black", value: "#131517" },
      ],
    },
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
          ["Input", ["Overview", "*"]],
          ["Button", ["Overview", "*"]],
          ["Text", ["Overview", "*"]],
          ["Color", ["Overview", "*"]],
          ["Controls", ["Overview", "*"]],
          ["Collapse", ["Overview", "*"]],
          ["Overlay", ["Overview", "*"]],
          ["Icons", ["Overview", "*"]],
          ["Image", ["Overview", "*"]],
          ["Events", ["Overview", "*"]],
          ["Timeline", ["Overview", "*"]],
          ["Tint", ["Overview", "*"]],
          ["Editor", ["Overview", "*"]],
          ["Banner", ["Overview", "*"]],
          ["Social", ["Overview", "*"]],
          ["Datetime", ["Overview", "*"]],
          ["Chat", ["Overview", "*"]],
          ["Weather", ["Overview", "*"]],
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
      const theme = (context.globals.theme as string) ?? "light";
      useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
      }, [theme]);
      return <Story />;
    },
    (Story) => (
      <QueryClientProvider client={getQueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
    (Story, context) => {
      const isPage = context.title?.startsWith("Pages/");
      const disableFrame = context.parameters?.mobileFrame === false;
      const immersive = context.parameters?.mobileFrameImmersive === true;
      const isDocs = context.viewMode === "docs";
      if (!isPage || disableFrame) return <Story />;
      return (
        <div
          className={
            isDocs
              ? "sb-docs-page-frame flex w-full shrink-0 items-center justify-center bg-white py-6"
              : "flex h-screen w-full items-center justify-center bg-white"
          }
        >
          <MobileDeviceFrame immersive={immersive}>
            <Story />
          </MobileDeviceFrame>
        </div>
      );
    },
  ],
};

export default preview;
