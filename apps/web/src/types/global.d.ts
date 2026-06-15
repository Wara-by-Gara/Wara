declare module "*.css";

interface KakaoStatic {
  init(key: string): void;
  isInitialized(): boolean;
  Share: {
    sendDefault(options: {
      objectType: "feed";
      content: {
        title: string;
        description?: string;
        imageUrl: string;
        imageWidth?: number;
        imageHeight?: number;
        link: { mobileWebUrl: string; webUrl: string };
      };
      buttons?: Array<{
        title: string;
        link: { mobileWebUrl: string; webUrl: string };
      }>;
    }): void;
    sendScrap(options: { requestUrl: string }): void;
  };
}

interface Window {
  Kakao: KakaoStatic;
}
