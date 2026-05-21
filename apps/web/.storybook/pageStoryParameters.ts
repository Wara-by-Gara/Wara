/** Pages/01~21 스토리·Docs 공통 (Canvas iframe + 스크롤) */
export const pageStoryParameters = {
  layout: "fullscreen" as const,
  viewport: { defaultViewport: "mobile" as const },
  docs: {
    story: {
      inline: false,
      iframeHeight: 900,
    },
  },
};
