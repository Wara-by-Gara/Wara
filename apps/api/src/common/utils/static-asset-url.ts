const TEMPLATE_IMAGE_PATH_PREFIX = '/template_images/';

export function isTemplateImagePath(key: string): boolean {
  if (key.startsWith(TEMPLATE_IMAGE_PATH_PREFIX)) return true;
  try {
    return new URL(key).pathname.startsWith(TEMPLATE_IMAGE_PATH_PREFIX);
  } catch {
    return false;
  }
}

export function resolveStaticAssetUrl(key: string): string {
  const base = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  let pathname: string;
  try {
    pathname = new URL(key).pathname;
  } catch {
    pathname = key.startsWith('/') ? key : `/${key}`;
  }
  return `${base}${pathname}`;
}
