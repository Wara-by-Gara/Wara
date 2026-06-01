import { KLIPY_CDN_HOSTNAME, type KlipyGif } from '@/lib/klipy';

interface KlipyItem {
  id: number;
  file: {
    hd: { gif: { url: string } };
    sm: { gif: { url: string } };
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const page = searchParams.get('page') ?? '1';
  const key = process.env.KLIPY_API_KEY;

  if (!key) {
    return Response.json({ error: 'klipy_not_configured' }, { status: 500 });
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.klipy.com/api/v1/${key}/gifs/search?q=${encodeURIComponent(q)}&page=${page}&per_page=24`,
      { next: { revalidate: 60 } },
    );
  } catch {
    return Response.json({ error: 'klipy_unreachable' }, { status: 502 });
  }

  const json = await res.json();

  if (json.result !== true || !Array.isArray(json.data?.data)) {
    return Response.json({ error: 'invalid_klipy_response' }, { status: 502 });
  }

  const prefix = `https://${KLIPY_CDN_HOSTNAME}/`;
  const gifs: KlipyGif[] = (json.data.data as KlipyItem[])
    .map((item) => ({
      id: String(item.id),
      gifUrl: item.file?.hd?.gif?.url ?? '',
      previewUrl: item.file?.sm?.gif?.url ?? '',
    }))
    .filter((g) => g.gifUrl.startsWith(prefix));

  return Response.json({ gifs, hasNext: json.data.has_next });
}
