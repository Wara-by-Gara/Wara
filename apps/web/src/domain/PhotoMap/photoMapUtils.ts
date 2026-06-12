import type { PhotoLocation } from "@/lib/api/photos";

export const CLUSTER_RADIUS_M = 30;

export interface Cluster {
  id: string;
  lat: number;
  lng: number;
  representativeUrl: string;
  count: number;
  photos: PhotoLocation[];
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function clusterPhotos(photos: PhotoLocation[]): Cluster[] {
  const assigned = new Set<string>();
  const clusters: Cluster[] = [];

  for (const photo of photos) {
    if (assigned.has(photo.id)) continue;

    const group: PhotoLocation[] = [photo];
    assigned.add(photo.id);

    for (const other of photos) {
      if (assigned.has(other.id)) continue;
      if (
        haversineMeters(photo.gpsLat, photo.gpsLng, other.gpsLat, other.gpsLng) <=
        CLUSTER_RADIUS_M
      ) {
        group.push(other);
        assigned.add(other.id);
      }
    }

    const sorted = [...group].sort((a, b) => {
      const ta = new Date(a.takenAt ?? a.createdAt).getTime();
      const tb = new Date(b.takenAt ?? b.createdAt).getTime();
      return tb - ta;
    });

    const rep = sorted[0]!;
    const lat = group.reduce((s, p) => s + p.gpsLat, 0) / group.length;
    const lng = group.reduce((s, p) => s + p.gpsLng, 0) / group.length;

    clusters.push({
      id: rep.id,
      lat,
      lng,
      representativeUrl: rep.url,
      count: group.length,
      photos: sorted,
    });
  }

  return clusters;
}

export function formatTakenAt(takenAt: string | null, createdAt: string): string {
  const d = new Date(takenAt ?? createdAt);
  return d.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
