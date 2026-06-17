/**
 * 탐색·추천용 공개 초대장 60건 (카테고리 6 × 10건)
 * — 참가자 21명(호스트+게스트20), 사진·댓글 10~20개
 */

export const PUBLIC_CATEGORY_SLUGS = [
  'tech',
  'fitness',
  'food',
  'art',
  'culture',
  'health',
] as const;

type RsvpStatus = 'attending' | 'undecided' | 'absent';

type SeedDeps = {
  id: (seed: string) => string;
  pick: <T>(arr: readonly T[], idx: number) => T;
  take: <T>(arr: readonly T[], count: number, start: number) => T[];
  userIdByKey: Record<string, string>;
  templateIdByKey: Record<string, string>;
  hostKeys: string[];
  guestKeys: string[];
  templateCoverUrl: (folder: string, seedKey: string) => string;
  shuffledPhotoPoolForInv: (invKey: string) => string[];
  templateImageUrlFromRel: (rel: string) => string;
  realEventLocations: ReadonlyArray<{
    readonly placeName: string;
    readonly address: string;
    readonly detailAddress: string;
    readonly lat: number;
    readonly lng: number;
  }>;
  feedbackInvTemplates: readonly string[];
  feedbackPhotoTemplates: readonly string[];
  replyTemplates: readonly string[];
  gifPool: readonly string[];
  inviteBgThemes: readonly string[];
  rsvpPattern: readonly RsvpStatus[];
  photoLikePattern: readonly number[];
  feedbackLikePattern: readonly number[];
};

type PublicCategoryDef = {
  slug: string;
  folder: string;
  titles: string[];
  descriptions: string[];
};

const PUBLIC_PER_CATEGORY = 10;
const GUEST_COUNT_PER_INV = 20;

const PUBLIC_CATEGORIES: PublicCategoryDef[] = [
  {
    slug: 'tech',
    folder: 'tech-meetup',
    titles: [
      'AI 크리에이터 밋업', '프롬프트 워크숍', '생성형 AI 쇼케이스', 'LLM 스터디 모임',
      'AI 스타트업 네트워킹', '코딩 에이전트 실습', 'AI 트렌드 브런치', '이미지 생성 핸즈온',
      'AI 윤리 토론', '테크 데모 데이',
    ],
    descriptions: [
      'WARA 테크 커뮤니티에서 주최하는 AI 크리에이터 밋업입니다. 참가자분들께서는 최근 제작하신 AI 기반 작업물을 발표하고, 현장 피드백 세션을 통해 아이디어를 교류해 주시기 바랍니다. 노트북 및 데모 환경을 개인 지참해 주시며, 사전 등록 시 발표 슬롯을 배정해 드립니다. 행사 종료 후 네트워킹 시간이 별도로 마련되어 있습니다.',
      '본 워크숍은 생성형 AI 활용을 위한 프롬프트 설계 원칙과 실무 사례를 다룹니다. 강사진의 라이브 실습을 따라 하며, 업무·창작 맥락에 맞는 프롬프트 템플릿을 직접 작성해 보실 수 있습니다. 참가 대상은 AI 도구를 처음 접하시는 분부터 실무 적용을 검토 중이신 분까지 모두 환영합니다. 노트북 지참은 필수입니다.',
      '국내외 생성형 AI 서비스의 최신 기능을 한자리에서 체험할 수 있는 공개 쇼케이스 행사입니다. 파트너사 데모 부스 운영, 라이브 생성 시연, Q&A 패널이 순차적으로 진행됩니다. 사전 예약 참가자에게는 기념 자료가 제공되며, 현장 등록도 가능합니다. 행사 상세 안내는 등록 완료 후 이메일로 발송됩니다.',
      '정기 LLM 스터디 모임으로, 이번 회차 주제는 RAG(Retrieval-Augmented Generation) 파이프라인 설계입니다. 사전 학습 자료 및 참고 레포지토리 링크를 참가 확정자에게 개별 공유드리오니, 사전 예습 후 참석해 주시기 바랍니다. 발표·토론·실습 순으로 약 3시간 동안 진행됩니다.',
      'AI 스타트업 및 테크 기업 종사자를 위한 공식 네트워킹 프로그램입니다. 참가 기업 소개, 라이트닝 토크, 1:1 미팅 테이블 운영을 통해 협업 및 채용 기회를 연결합니다. 명함을 지참해 주시고, 비즈니스 캐주얼 복장을 권장합니다. 현장 체크인은 행사 30분 전부터 가능합니다.',
      '코딩 에이전트 기반 애플리케이션 프로토타이핑 핸즈온 세션입니다. 강사의 단계별 가이드를 따라 소규모 팀 단위로 실습을 진행하며, 완성된 결과물을 팀별로 발표합니다. 개발 환경 사전 설치 안내서를 참고해 주시고, 기본적인 프로그래밍 경험이 있으신 분께 적합합니다.',
      'AI 업계 동향을 공유하는 공개 브런치 포럼입니다. 패널 발표 후 참석자 질의응답 시간이 포함되어 있으며, 브런치 식사가 제공됩니다. 식단 관련 문의는 사전 등록 시 알려주시면 최대한 반영하겠습니다. 행사는 정시 시작되오니 10분 전까지 입장 부탁드립니다.',
      '이미지 생성 AI 도구 비교·실습 워크숍으로, 프롬프트 작성부터 후처리까지 전 과정을 체험합니다. 실습용 크레딧이 일부 제공되며, 개인 계정이 있으신 경우 함께 지참 가능합니다. 저작권 및 상업적 이용 가이드라인 안내도 포함되어 있습니다.',
      'AI 윤리, 저작권, 학습 데이터 사용에 관한 공개 토론회입니다. 사전 질문을 접수받아 패널 토의의 주제로 반영하며, 청중 Q&A 세션을 통해 다양한 의견을 수렴합니다. 전문 지식이 없으신 분도 참여 가능하도록 기초 개념 브리핑으로 시작합니다.',
      '분기 테크 데모 데이로, 선정된 팀이 신기술·프로토타입을 발표합니다. 심사위원 피드백과 관객 투표가 함께 진행되며, 우수팀에게 후속 멘토링 기회가 제공됩니다. 발표 자료는 행사 후 공개 자료실에 업로드될 예정입니다.',
    ],
  },
  {
    slug: 'fitness',
    folder: 'sports-day',
    titles: [
      '한강 러닝 크루', '주말 풋살 번개', '요가 야외 클래스', '클라이밍 챌린지',
      '주말 사이클링', '배드민턴 동호회', 'HIIT 그룹 트레이닝', '테니스 더블 매치',
      '수영 후 브런치', '필라테스 입문 클래스',
    ],
    descriptions: [
      '서울 한강 러닝 크루의 정기 공개 러닝 프로그램입니다. 약 5km 페이스 그룹으로 나누어 진행하며, 러닝 종료 후 지정 카페에서 네트워킹 시간을 갖습니다. 초보 러너를 위한 준비 운동 및 안전 브리핑이 포함되어 있으며, 러닝화와 운동복을 착용해 주시기 바랍니다.',
      '주말 풋살 번개 매치는 선착순으로 팀을 구성하여 2시간 동안 진행됩니다. 풋살화 및 신판 장비는 개인 지참을 원칙으로 하되, 일부 사이즈 대여가 가능합니다. 경기 규칙 및 안전 수칙은 행사 시작 전 공지되며, 부상 방지를 위해 충분한 준비 운동에 참여해 주세요.',
      '한강 공원에서 진행되는 공개 요가 클래스입니다. 일출 시간에 맞춰 약 60분간 호흡·기본 아사나를 지도하며, 개인 매트 지참이 필요합니다. 우천 시 실내 대체 장소로 변경될 수 있으니 등록 시 안내 문자를 확인해 주세요. 초보자 환영이며, 강사가 난이도별 옵션을 안내합니다.',
      '실내 클라이밍 체험 프로그램으로, 안전 교육 후 초급 코스를 체험합니다. 하네스 및 벨트 대여가 포함되어 있으며, 전문 강사가 동행합니다. 체험 전 건강 상태를 확인하는 간단한 설문이 있으며, 편한 복장과 양말을 지참해 주세요.',
      '여의도 한강 자전거 도로를 활용한 그룹 사이클링 행사입니다. 약 20km 코스를 팀 페이스에 맞춰 주행하며, 헬멧 착용은 필수입니다. 자전거가 없으신 경우 사전 신청 시 대여 안내가 가능합니다. 중간 휴식 및 수분 보충 포인트가 운영됩니다.',
      '배드민턴 동호인을 위한 공개 교류전입니다. 복식 위주로 진행되며, 라켓은 개인 지참을 권장하나 현장 대여 수량이 한정적으로 준비되어 있습니다. 코트 배정은 현장 추첨으로 이루어지며, 경기 후 간단한 시상 및 단체 사진 촬영이 예정되어 있습니다.',
      '전문 트레이너가 진행하는 30분 HIIT 그룹 세션입니다. 고강도 운동 후 15분 스트레칭으로 마무리하며, 수건과 물을 지참해 주세요. 기초 체력이 있으신 분께 적합하며, 건강상 특이사항이 있으신 경우 사전에 스태프에게 알려 주시기 바랍니다.',
      '테니스 더블 매치 교류 행사로, 2세트 기본 룰로 진행됩니다. 라켓 및 운동화는 개인 지참을 권장하며, 코트비 및 공은 주최 측에서 준비합니다. 파트너 매칭은 현장에서 진행되오니 단독 참가도 가능합니다.',
      '수영 센터에서 진행되는 그룹 수영 프로그램 후, 인근 레스토랑에서 브런치 네트워킹이 이어집니다. 수영 참가 시 수모·고글·수영복을 준비해 주시고, 브런치는 별도 예약 좌석으로 안내됩니다. 식단 알레르기 정보는 등록 시 기재 부탁드립니다.',
      '필라테스 입문자를 위한 공개 클래스입니다. 기초 호흡과 코어 활성화 동작을 중심으로 약 50분간 진행되며, 매트는 현장 제공됩니다. 편안한 운동복을 착용해 주시고, 임산부 및 재활이 필요하신 분은 사전 상담 후 참여를 권장합니다.',
    ],
  },
  {
    slug: 'food',
    folder: 'dinner-party',
    titles: [
      '홈파티 디너', '파스타 나이트', '바비큐 파티', '디저트 테이블',
      '한식 풀코스', '브런치 모임', '포틀럭 파티', '셰프 테이블',
      '스트릿 푸드 투어', '비건 쿠킹 클래스',
    ],
    descriptions: [
      '푸드 크리에이터가 주최하는 공개 홈파티 디너 행사입니다. 시즌 메뉴를 기반으로 한 코스 요리가 제공되며, 식재료 알레르기 및 식이 제한 사항은 사전 등록 시 반드시 기재해 주세요. 정원이 제한되어 있으니 예약 확정 후 안내된 시간에 맞춰 방문 부탁드립니다.',
      '이탈리안 파스타 나이트 워크숍으로, 시트 파스타 만들기부터 소스 페어링까지 셰프의 시연과 참가자 실습이 포함됩니다. 에이프런 및 실습 도구는 현장 제공되며, 완성된 메뉴를 함께 시식합니다. 와인 페어링 옵션은 별도 선택 가능합니다.',
      '야외 바비큐 파티는 지정 캠핑장에서 진행되며, 주최 측에서 고기·채소·음료를 준비합니다. 참가자분께서는 캠핑 의자 또는 돗자리를 지참해 주시기 바랍니다. 기상 악화 시 실내 바비큐 공간으로 변경될 수 있으며, 변경 시 개별 안내드립니다.',
      '디저트 전문 파티셰와 함께하는 디저트 테이블 체험 행사입니다. 6종의 시그니처 디저트를 순차적으로 제공하며, 제작 과정 미니 시연이 포함됩니다. 당류·유제품 알레르기 정보를 사전에 알려주시면 대체 메뉴를 검토해 드립니다.',
      '한식 풀코스 공개 디너로, 제철 식재료를 활용한 7코스가 준비됩니다. 좌석 배치는 사전 예약 순이며, 행사 시작 15분 전까지 입장해 주세요. 전통주 페어링 안내가 포함되며, 비주얼은 비공개 촬영 구역이 별도로 마련됩니다.',
      '브런치 모임은 느긋한 주말 오전에 진행되며, 브런치 세트와 커피·티가 제공됩니다. 자유 좌석제이나 혼잡 시간대에는 대기가 발생할 수 있습니다. 단체 예약 시 메뉴 구성 변경이 가능하오니 문의해 주세요.',
      '포틀럭 파티는 참가자 각자 한 가지 요리를 준비해 공유하는 공개 행사입니다. 음식명·알레르기 정보를 라벨에 기재해 주시고, 전자레인지 및 보온 장비가 현장에 준비되어 있습니다. 음료는 주최 측에서 제공합니다.',
      '셰프 테이블 행사는 오픈 키친에서 코스 요리가 조리·설명되는 프로그램입니다. 셰프와의 Q&A 시간이 포함되어 있으며, 좌석은 한정되어 사전 예약이 필요합니다. 드레스 코드는 스마트 캐주얼을 권장합니다.',
      '스트릿 푸드 투어는 지역 맛집 골목을 도보로 둘러보는 공개 프로그램입니다. 약 2시간 동안 4~5개 지점을 방문하며, 투어 비용에 시식권이 포함됩니다. 편한 신발을 착용해 주시고, 우천 시 일부 코스가 조정될 수 있습니다.',
      '비건 쿠킹 클래스는 식물성 재료만을 활용한 요리 실습 프로그램입니다. 영양 밸런스와 조리 팁을 함께 배우며, 완성 메뉴를 시식합니다. 알레르기 유발 성분 안내가 제공되며, 앞치마는 현장 대여 가능합니다.',
    ],
  },
  {
    slug: 'art',
    folder: 'flower-garden',
    titles: [
      '플라워 아트 클래스', '갤러리 나이트', '수채화 원데이', '도예 체험 모임',
      '플로럴 포토 데이', '전시 관람 후 토크', '콜라주 워크숍', '일러스트 스케치',
      '조각 전시 오프닝', '아트 마켓 나들이',
    ],
    descriptions: [
      '플라워 아트 원데이 클래스는 계절 꽃재료를 활용해 테이블 데코레이션을 제작하는 공개 프로그램입니다. 가위·플로럴 폼 등 기본 도구는 제공되며, 완성 작품은 개별 포장해 가져가실 수 있습니다. 꽃가루 알레르기가 있으신 분은 사전에 알려 주세요.',
      '갤러리 나이트는 신진 작가 전시의 공개 관람 및 아티스트 토크가 포함된 행사입니다. 전시 해설 후 자유 관람 시간이 주어지며, 작품 구매 문의는 별도 데스크에서 안내받으실 수 있습니다. 사전 예약자에게는 오디오 가이드 대여가 제공됩니다.',
      '수채화 원데이 클래스는 기초 기법부터 간단한 풍경 스케치까지 단계별로 지도합니다. 종이·물감·붓 등 재료는 현장 제공되며, 완성 작품은 건조 후 개별 수령 가능합니다. 미술 경험이 없으신 분도 환영합니다.',
      '도예 체험 모임은 전문 도공의 시연 후 직접 그릇을 성형·장식하는 프로그램입니다. 가죽 앞치마가 제공되며, 완성품은 유약 작업 후 배송됩니다(배송비 별도). 손톱이 긴 경우 체험에 제한이 있을 수 있습니다.',
      '플로럴 포토 데이는 스튜디오에서 꽃 소품과 조명을 활용한 촬영 체험을 제공합니다. 개인별 촬영 슬롯이 배정되며, 원본 파일은 행사 후 3일 이내 전달됩니다. 메이크업 지원은 포함되지 않으니 필요 시 개인 준비 부탁드립니다.',
      '전시 관람 후 토크 세션은 큐레이터와 함께 작품 배경 및 작가 의도를 해설하는 공개 프로그램입니다. 전시 입장권이 포함되어 있으며, 토크 종료 후 질의응답 시간이 마련되어 있습니다. 노트북 또는 필기구를 지참하시면 도움이 됩니다.',
      '콜라주 워크숍은 잡지·색지·스탬프 등을 활용해 개인 카드 또는 미니 포스터를 제작합니다. 재료 키트가 제공되며, 90분 동안 자유 창작 후 간단한 작품 소개 시간을 갖습니다. 어린이 동반 시 보호자 동반을 권장합니다.',
      '일러스트 스케치 클래스는 라이프 드로잉 형식으로 진행되며, 기본 비율·선 표현을 연습합니다. 스케치북과 연필은 제공되며, 개인 디지털 기기로 기록하셔도 무방합니다. 모델 초상권 안내는 행사 시작 시 공지됩니다.',
      '조각 전시 오프닝은 신작 공개 및 작가 인사 행사가 포함된 공식 행사입니다. 드레스 코드는 자유이나, 전시장 내 촬영 가능 구역을 준수해 주세요. 오프닝 리셉션 음료·다과가 제공되며, 사전 RSVP가 필요합니다.',
      '아트 마켓 나들이는 지역 작가·핸드메이드 부스를 둘러보는 공개 투어 프로그램입니다. 가이드가 주요 부스를 소개하며, 자유 구매 시간도 포함됩니다. 약 2시간 도보 일정이므로 편한 복장과 현금·카드 결제 수단을 준비해 주세요.',
    ],
  },
  {
    slug: 'culture',
    folder: 'party-night',
    titles: [
      '재즈 나이트', '독립 영화 상영회', '클래식 소극장', '북토크 살롱',
      '전통 공연 관람', '박물관 야간 개장', '문학 낭독회', '뮤지컬 단체 관람',
      '문화 축제 투어', '공연 후 토크',
    ],
    descriptions: [
      '재즈 나이트는 라이브 밴드 공연과 함께하는 공개 문화 행사입니다. 좌석은 선착순 및 예약 병행으로 운영되며, 공연 중 촬영 및 녹음은 아티스트 요청에 따라 제한될 수 있습니다. 음료는 별도 구매 가능하며, 공연 시작 후 입장은 지연될 수 있습니다.',
      '독립 영화 상영회는 엄선된 단편·장편 1편 상영 후 감독 또는 기획자와의 토크가 이어집니다. 상영 전 좌석 배정표를 확인해 주시고, 자막 언어 안내는 프로그램에 명시되어 있습니다. 티켓은 사전 예매를 권장합니다.',
      '클래식 소극장 공연은 현대 작곡가의 실내악 프로그램으로 구성됩니다. 약 90분 공연 후 앙코르 여부는 현장 안내되며, 프로그램 북이 제공됩니다. 정숙한 관람을 위해 공연 중 휴대전화는 무음 처리 부탁드립니다.',
      '북토크 살롱은 신간 도서의 저자와의 대화 및 청중 질의응답으로 진행되는 공개 행사입니다. 도서 판매 및 사인회가 행사 후 진행될 수 있으며, 사전 등록자에게 좌석이 우선 배정됩니다. 질문 카드는 입장 시 배부됩니다.',
      '전통 공연 관람 프로그램은 국악·무용 공연 관람 후 아티스트 인사 시간이 포함됩니다. 공연 설명 브로슈어가 제공되며, 전통 의상 체험 부스가 운영될 수 있습니다. 외국인 참가자를 위한 간단한 영어 안내도 준비되어 있습니다.',
      '박물관 야간 개장 행사는 특별 전시 관람 및 야간 해설 투어가 포함된 공식 프로그램입니다. 입장 시간대가 지정되어 있으니 예약 확인서의 시간을 준수해 주세요. 플래시 촬영은 금지되며, 가방 보관소를 이용하실 수 있습니다.',
      '문학 낭독회는 참가 작가 및 독자가 교대로 낭독하고 토론하는 공개 모임입니다. 낭독 신청은 사전 접수 가능하며, 각 낭독은 5분 이내로 제한됩니다. 행사 후 자유 네트워킹 시간이 제공됩니다.',
      '뮤지컬 단체 관람은 단체 할인 티켓으로 진행되며, 공연 후 근처 카페에서 간단한 관람 소감 나누기 시간을 갖습니다. 티켓 수령은 공연 1시간 전 집결 후 일괄 배부되오니 지각 시 입장이 어려울 수 있습니다.',
      '문화 축제 투어는 축제 주요 구역을 가이드와 함께 도보로 안내하는 공개 프로그램입니다. 공연·체험 부스 일정표가 제공되며, 개인 자유 시간도 포함됩니다. 대중교통 이용을 권장하며, 주차 안내는 별도 공지됩니다.',
      '공연 후 토크는 메인 공연 직후 배우·스태프가 참여하는 짧은 대화 세션입니다. 사진 촬영은 지정 시간에만 가능하며, 질문은 사회자가 순서대로 받습니다. 퇴장 동선은 스태프 안내에 따라 이동해 주세요.',
    ],
  },
  {
    slug: 'health',
    folder: 'brunch',
    titles: [
      '웰니스 브런치', '명상 & 티타임', '디톡스 주스 클래스', '숲속 힐링 워크',
      '수면 건강 세미나', '마음챙김 모임', '건강 요리 워크숍', '아로마 릴렉스 데이',
      '한방 차 체험', '건강 루틴 공유 모임',
    ],
    descriptions: [
      '웰니스 브런치 행사는 영양사가 구성한 계절 메뉴와 건강 정보 브리핑이 포함된 공개 프로그램입니다. 브런치 후 라이트 스트레칭 세션이 이어지며, 식이 제한 사항은 등록 시 기재해 주세요. 정원 30명 한정으로 사전 예약이 필요합니다.',
      '명상 & 티타임은 전문 강사의 15분 가이드 명상 후 허브 티 시음으로 마무리되는 공개 클래스입니다. 매트와 쿠션이 제공되며, 편안한 복장을 권장합니다. 임산 초기·호흡기 질환이 있으신 분은 참여 전 상담을 부탁드립니다.',
      '디톡스 주스 클래스는 재료 선택부터 블렌딩·보관 방법까지 실습하는 워크숍입니다. 유기농 재료가 사용되며, 개인용 보틀에 담아 가져가실 수 있습니다. 알레르기 유발 과일·채소 정보를 사전에 알려주시기 바랍니다.',
      '숲속 힐링 워크는 지정 숲길을 천천히 걸으며 호흡·감각 명상을 돕는 공개 프로그램입니다. 약 2시간 도보 일정이며, 방한·방수 겉옷과 물을 지참해 주세요. 우천 시 실내 명상 프로그램으로 대체될 수 있습니다.',
      '수면 건강 세미나는 수면 위생·수면 루틴 설계를 주제로 한 공개 강연입니다. Q&A 시간이 포함되어 있으며, 참가자에게 요약 자료 PDF가 제공됩니다. 의료 진단이 필요한 경우 전문의 상담을 권장한다는 안내가 포함됩니다.',
      '마음챙김 모임은 호흡 관찰과 짧은 바디 스캔을 실습하는 정기 공개 세션입니다. 초보자 환영이며, 매트는 현장 대여 가능합니다. 정기 참여를 원하시면 후속 일정 안내를 신청해 주세요.',
      '건강 요리 워크숍은 저염·고단백 메뉴를 함께 조리하고 영양 성분을 설명하는 프로그램입니다. 에이프런·도마·조리 도구가 제공되며, 완성 메뉴를 시식합니다. 칼 사용 시 안전 수칙을 준수해 주세요.',
      '아로마 릴렉스 데이는 라벤더·유칼립투스 등 오일을 활용한 휴식 체험과 기본 지식 안내로 구성됩니다. 피부 민감도 테스트 후 참여하며, 임산부는 일부 오일 사용이 제한될 수 있습니다. 편안한 복장으로 방문해 주세요.',
      '한방 차 체험은 한의사·티 소믈리에가 차의 특성과 체질별 추천을 설명하는 공개 행사입니다. 4종의 차를 순차 시음하며, 카페인 민감자를 위한 대체 차도 준비됩니다. 시음 후 간단한 설문을 통해 맞춤 추천을 받으실 수 있습니다.',
      '건강 루틴 공유 모임은 참가자가 각자의 운동·식단·수면 루틴을 발표하고 토론하는 공개 세션입니다. 발표는 3분 이내이며, 슬라이드 없이도 참여 가능합니다. 전문가 코멘트 시간이 마지막에 포함되어 있습니다.',
    ],
  },
];

export type PublicInvitationSeedBundle = {
  invitations: Array<{
    id: string;
    userId: string;
    templateId: string | null;
    status: 'active';
    title: string;
    description: string;
    mainCoverType: 'image';
    mainImageKey: string;
    mainGifUrl: null;
    eventStartAt: Date;
    isMissionEnabled: boolean;
    isPublic: boolean;
    category: string;
    bgColor: string;
  }>;
  participants: Array<{
    id: string;
    userId: string;
    invitationId: string;
    memberRole: 'HOST' | 'GUEST';
    rsvpStatus: RsvpStatus;
  }>;
  eventLocations: Array<{
    id: string;
    invitationId: string;
    address: string;
    placeName: string;
    detailAddress: string;
    lat: number;
    lng: number;
    placeId: string;
  }>;
  photos: Array<{
    id: string;
    participantId: string;
    invitationId: string;
    imageKey: string;
    exifMetadata: Record<string, unknown>;
    viewCount: number;
    likeCount: number;
    deletedAt: null;
  }>;
  photoLikes: Array<{ id: string; photoId: string; participantId: string }>;
  feedbacks: Array<{
    id: string;
    participantId: string;
    invitationId: string | null;
    photoId: string | null;
    parentId: string | null;
    content: string;
    gifUrl?: string | null;
    likeCount: number;
    deletedAt: null;
  }>;
  feedbackLikes: Array<{ id: string; feedbackId: string; participantId: string }>;
};

export function buildPublicInvitationSeeds(deps: SeedDeps): PublicInvitationSeedBundle {
  const invitations: PublicInvitationSeedBundle['invitations'] = [];
  const participants: PublicInvitationSeedBundle['participants'] = [];
  const eventLocations: PublicInvitationSeedBundle['eventLocations'] = [];
  const photos: PublicInvitationSeedBundle['photos'] = [];
  const photoLikes: PublicInvitationSeedBundle['photoLikes'] = [];
  const feedbacks: PublicInvitationSeedBundle['feedbacks'] = [];
  const feedbackLikes: PublicInvitationSeedBundle['feedbackLikes'] = [];

  const partIdByKey: Record<string, Record<string, string>> = {};
  const photoIdsByInv: Record<string, string[]> = {};
  let globalIdx = 0;
  let gifCursor = 0;

  for (const cat of PUBLIC_CATEGORIES) {
    for (let n = 0; n < PUBLIC_PER_CATEGORY; n++) {
      const invKey = `pub-${cat.slug}-${String(n + 1).padStart(2, '0')}`;
      const invId = deps.id(`invitation:${invKey}`);
      const hostKey = deps.hostKeys[globalIdx % deps.hostKeys.length]!;
      const hostUserId = deps.userIdByKey[hostKey]!;
      const dayOffset = (globalIdx % 60) + 3;
      const eventDate = new Date(`2026-07-${String((dayOffset % 28) + 1).padStart(2, '0')}T11:00:00Z`);

      invitations.push({
        id: invId,
        userId: hostUserId,
        templateId: deps.templateIdByKey['tmpl1'] ?? null,
        status: 'active',
        title: cat.titles[n]!,
        description: cat.descriptions[n]!,
        mainCoverType: 'image',
        mainImageKey: deps.templateCoverUrl(cat.folder, invKey),
        mainGifUrl: null,
        eventStartAt: eventDate,
        isMissionEnabled: false,
        isPublic: true,
        category: cat.slug,
        bgColor: deps.inviteBgThemes[globalIdx % deps.inviteBgThemes.length]!,
      });

      const guestStart = (globalIdx * 5) % deps.guestKeys.length;
      const guestKeys = deps.take(deps.guestKeys, GUEST_COUNT_PER_INV, guestStart);
      const userKeys = [hostKey, ...guestKeys];
      partIdByKey[invKey] = {};
      const pIds: string[] = [];

      userKeys.forEach((uKey, idx) => {
        const pId = deps.id(`participant:${invKey}:${uKey}`);
        partIdByKey[invKey]![uKey] = pId;
        pIds.push(pId);
        participants.push({
          id: pId,
          userId: deps.userIdByKey[uKey]!,
          invitationId: invId,
          memberRole: idx === 0 ? 'HOST' : 'GUEST',
          rsvpStatus: idx === 0 ? 'attending' : deps.pick(deps.rsvpPattern, idx),
        });
      });

      const place = deps.realEventLocations[globalIdx % deps.realEventLocations.length]!;
      eventLocations.push({
        id: deps.id(`eventloc:${invKey}`),
        invitationId: invId,
        address: place.address,
        placeName: place.placeName,
        detailAddress: place.detailAddress,
        lat: place.lat,
        lng: place.lng,
        placeId: `place-${invKey}`,
      });

      const photoCount = 10 + (globalIdx % 11);
      photoIdsByInv[invKey] = [];
      // 초대장별 셔플 풀에서 distinct하게 뽑아 한 초대장 내 사진 중복 방지
      // (카테고리 폴더는 이미지가 1장뿐이라 폴더 풀을 쓰면 전부 동일해짐)
      const invPhotoPool = deps.shuffledPhotoPoolForInv(invKey);
      for (let pi = 0; pi < photoCount; pi++) {
        const photoId = deps.id(`photo:${invKey}:${pi}`);
        photoIdsByInv[invKey]!.push(photoId);
        const uploaderId = pIds[pi % pIds.length]!;
        const others = pIds.filter((p) => p !== uploaderId);
        const likerCount = Math.min(deps.photoLikePattern[pi % deps.photoLikePattern.length]!, others.length);
        const likers = others.slice(0, likerCount);

        photos.push({
          id: photoId,
          participantId: uploaderId,
          invitationId: invId,
          imageKey:
            invPhotoPool.length > 0
              ? deps.templateImageUrlFromRel(invPhotoPool[pi % invPhotoPool.length]!)
              : deps.templateCoverUrl(cat.folder, `${invKey}-${pi}`),
          // GPS 좌표는 서울 시청(37.5665, 126.978) 기준 ±0.025° 분산 — 사진 지도 표시용.
          exifMetadata: {
            width: 1280,
            height: 853,
            camera: 'iPhone 15',
            gps_lat: 37.5665 + ((pi % 11) - 5) * 0.005,
            gps_lng: 126.978 + ((invKey.length % 11) - 5) * 0.005,
          },
          viewCount: pi * 3,
          likeCount: likers.length,
          deletedAt: null,
        });
        likers.forEach((likerId, li) => {
          photoLikes.push({
            id: deps.id(`photolike:${invKey}:${pi}:${li}`),
            photoId,
            participantId: likerId,
          });
        });
      }

      const feedbackCount = 10 + ((globalIdx + 3) % 11);
      for (let fi = 0; fi < feedbackCount; fi++) {
        const authorId = pIds[(fi + 1) % pIds.length]!;
        const others = pIds.filter((p) => p !== authorId);
        const likerCount = Math.min(deps.feedbackLikePattern[fi % deps.feedbackLikePattern.length]!, others.length);
        const likers = others.slice(0, likerCount);
        const fbId = deps.id(`feedback:${invKey}:${fi}`);
        const isGif = fi % 6 === 1;
        const isPhoto = !isGif && fi % 4 === 2 && photoIdsByInv[invKey]!.length > 0;
        const photoId = isPhoto ? photoIdsByInv[invKey]![fi % photoIdsByInv[invKey]!.length]! : null;

        feedbacks.push({
          id: fbId,
          participantId: authorId,
          invitationId: isPhoto ? null : invId,
          photoId,
          parentId: null,
          content: isGif ? '' : isPhoto
            ? deps.pick(deps.feedbackPhotoTemplates, fi)
            : deps.pick(deps.feedbackInvTemplates, fi),
          gifUrl: isGif ? deps.gifPool[gifCursor++ % deps.gifPool.length]! : null,
          likeCount: likers.length,
          deletedAt: null,
        });
        likers.forEach((lId, li) => {
          feedbackLikes.push({
            id: deps.id(`fblike:${invKey}:${fi}:${li}`),
            feedbackId: fbId,
            participantId: lId,
          });
        });
      }

      globalIdx++;
    }
  }

  return {
    invitations,
    participants,
    eventLocations,
    photos,
    photoLikes,
    feedbacks,
    feedbackLikes,
  };
}
