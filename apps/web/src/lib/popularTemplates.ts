/** 홈 인기 초대장 — 이름·미리보기 이미지 1:1 매핑.
 * NOTE: 기존 카테고리별 이미지(파티/생일/꽃/…)는 public/luma_images에 누락되어 404가 났음.
 * 현재 실제 존재하는 luma_images/AI 자산으로 매핑. 카테고리 이미지 복구 시 교체 가능. */
export const POPULAR_TEMPLATE_CATALOG = [
  {
    name: "파티 나이트",
    imageUrl: "/luma_images/AI/imgi_100_3c3db379-bc3e-493e-8677-d2fb311882f8.png",
  },
  {
    name: "생일 축하",
    imageUrl: "/luma_images/AI/imgi_17_249caab2-d8da-4750-9b81-e3a2c7147ae8.png",
  },
  {
    name: "플라워 가든",
    imageUrl: "/luma_images/AI/imgi_26_1f415e7c-a575-45ac-a36b-246bcb9babe4.png",
  },
  {
    name: "여름 바캉스",
    imageUrl: "/luma_images/AI/imgi_35_4d94593d-bf72-42cc-9954-5d3b57ccb3e1.png",
  },
  {
    name: "클래식 초대",
    imageUrl: "/luma_images/AI/imgi_44_8eb0cdf7-51e5-467f-b4dc-c1cdc09d8ffa.png",
  },
  {
    name: "학교 축제",
    imageUrl: "/luma_images/AI/imgi_52_8619a182-5b6f-4d47-ac2a-e44d7586b3f3.png",
  },
  {
    name: "디너 파티",
    imageUrl: "/luma_images/AI/imgi_60_17c72134-2b23-438d-8b6a-bf52de5f7a4d.png",
  },
  {
    name: "스포츠 데이",
    imageUrl: "/luma_images/AI/imgi_69_20745b53-9819-4dc7-a541-ffdc562afd2d.png",
  },
  {
    name: "브런치 타임",
    imageUrl: "/luma_images/AI/imgi_78_6d7fbcf6-5e96-4977-8621-a133002df00e.png",
  },
  {
    name: "테크 밋업",
    imageUrl: "/luma_images/AI/imgi_86_2a39c59a-3aee-4cf8-bae3-f0b996451d1d.png",
  },
] as const;
