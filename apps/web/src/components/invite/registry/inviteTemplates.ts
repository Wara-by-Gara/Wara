import type { InviteTemplate } from "../types";
import { birthdayDream } from "../templates/birthdayDream";
import { neonParty } from "../templates/neonParty";
import { skyTrip } from "../templates/skyTrip";
import { dailyInvite } from "../templates/dailyInvite";
import { pixelPop } from "../templates/pixelPop";
import { retroNight } from "../templates/retroNight";
import { softGarden } from "../templates/softGarden";
import { cherryBlossom } from "../templates/cherryBlossom";
import { memoryBlue } from "../templates/memoryBlue";
import { glassMood } from "../templates/glassMood";
import { balloonDay } from "../templates/balloonDay";

/**
 * 템플릿 registry. 새 템플릿 = templates/에 메타 추가 + 이 배열에 등록.
 * 렌더러/레이어는 수정하지 않는다.
 */
export const inviteTemplates: InviteTemplate[] = [
  birthdayDream,
  neonParty,
  skyTrip,
  dailyInvite,
  pixelPop,
  retroNight,
  softGarden,
  cherryBlossom,
  memoryBlue,
  glassMood,
  balloonDay,
];

const byId = new Map(inviteTemplates.map((t) => [t.id, t]));

export function getInviteTemplate(id: string): InviteTemplate | undefined {
  return byId.get(id);
}

export const DEFAULT_TEMPLATE_ID = birthdayDream.id;
