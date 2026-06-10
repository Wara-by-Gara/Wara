import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  if (!lat || !lng) return NextResponse.json({ address: null });

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
    { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` } },
  );
  if (!res.ok) return NextResponse.json({ address: null });

  const data = await res.json() as {
    documents?: Array<{
      address?: {
        region_1depth_name?: string;
        region_2depth_name?: string;
        region_3depth_name?: string;
      };
    }>;
  };
  const addr = data.documents?.[0]?.address;
  const address = addr
    ? [addr.region_1depth_name, addr.region_2depth_name, addr.region_3depth_name]
        .filter(Boolean)
        .join(' ') || null
    : null;
  return NextResponse.json({ address });
}
