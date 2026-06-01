export const KLIPY_CDN_HOSTNAME = 'static.klipy.com';

export interface KlipyGif {
  id: string;
  gifUrl: string;
  previewUrl: string;
}

export interface KlipySearchResponse {
  gifs: KlipyGif[];
  hasNext: boolean;
}
