const BASE = new Date('2026-04-29T17:00:00').getTime()
const H = 3600000
const M = 60000

export const BADGE_COLORS = {
  실:       { bg: '#FFF0E6', text: '#E07B39' },
  도구:     { bg: '#E6F0FF', text: '#3970E0' },
  도안:     { bg: '#F0E6FF', text: '#7B39E0' },
  자유게시판: { bg: '#E8F8EF', text: '#2D9E5A' },
}

export const QUESTIONS = [
  // ── 실 ─────────────────────────────────────────────────
  {
    id: '1', category: '실',
    title: '메리노울 실 추천해주세요!',
    body: '처음 뜨개질 시작하는데 메리노울 실 어떤 게 좋을까요? 예산은 1만원~2만원대이고 손감이 부드러운 걸 원해요.',
    author: { id: 'u1', name: '뜨개입문자' },
    createdAt: '2시간 전', likes: 5,
    answers: [
      { id: 'a1-1', author: { id: 'u2', name: '실전문가뜨개맘', avatar: '🧶' }, body: '퍼피 메리노울 추천드려요! 가성비 좋고 손감이 부드러워서 입문자분께 딱이에요. 색상도 다양하게 나와 있어요.', likes: 12, isBest: true, createdAt: '1시간 전', ts: BASE - 1*H },
      { id: 'a1-2', author: { id: 'u3', name: '코바늘장인', avatar: '🪡' }, body: '저는 리치모어 스테이플 메리노도 추천해요. 조금 더 비싸지만 퀄리티가 확실해요.', likes: 4, isBest: false, createdAt: '30분 전', ts: BASE - 30*M },
    ],
  },
  {
    id: '2', category: '실',
    title: '아이 목도리용 실은 어떤 게 좋아요?',
    body: '5살 아이 목도리 뜨려고 하는데 피부에 자극 없는 실 추천해 주세요.',
    author: { id: 'u4', name: '육아맘뜨개' },
    createdAt: '5시간 전', likes: 8,
    answers: [
      { id: 'a2-1', author: { id: 'u5', name: '베이비뜨개전문', avatar: '🍼' }, body: '아이용은 저자극 아크릴이나 베이비알파카 추천드려요. 소프트람 실이 자극 없고 세탁도 편해요!', likes: 9, isBest: true, createdAt: '4시간 전', ts: BASE - 4*H },
      { id: 'a2-2', author: { id: 'u2', name: '실전문가뜨개맘', avatar: '🧶' }, body: '이지케어 울도 좋아요. 세탁기에 넣어도 되거든요 ㅎㅎ', likes: 3, isBest: false, createdAt: '3시간 전', ts: BASE - 3*H },
    ],
  },
  {
    id: '3', category: '실',
    title: '여름용 실은 어떤 종류를 써야 하나요?',
    body: '여름에도 뜨개질하고 싶은데 시원한 느낌의 실이 있나요? 코튼이 좋다고 들었는데 다른 것도 궁금해요.',
    author: { id: 'u6', name: '사계절뜨개' },
    createdAt: '1일 전', likes: 11,
    answers: [
      { id: 'a3-1', author: { id: 'u3', name: '코바늘장인', avatar: '🪡' }, body: '여름엔 코튼이나 린넨 실이 제일 좋아요. 코튼은 관리도 쉽고 색도 예쁘게 나와요.', likes: 14, isBest: true, createdAt: '22시간 전', ts: BASE - 22*H },
      { id: 'a3-2', author: { id: 'u8', name: '도구덕후', avatar: '🔧' }, body: '리오셀 혼방 실도 강추예요! 드레이프가 예쁘게 떨어져요.', likes: 6, isBest: false, createdAt: '18시간 전', ts: BASE - 18*H },
    ],
  },
  {
    id: '4', category: '실',
    title: '실 끊김 없이 색 바꾸는 방법이 있나요?',
    body: '줄무늬 뜰 때마다 실 끝 처리가 너무 많아서 힘들어요. 더 깔끔하게 할 수 있는 방법 없을까요?',
    author: { id: 'u9', name: '코바늘시작' },
    createdAt: '2일 전', likes: 17,
    answers: [
      { id: 'a4-1', author: { id: 'u2', name: '실전문가뜨개맘', avatar: '🧶' }, body: '2색 이상이면 털실 잇기 방법으로 매듭 없이 연결하면 끝 처리가 훨씬 줄어요!', likes: 19, isBest: true, createdAt: '1일 전', ts: BASE - 24*H },
    ],
  },
  // ── 도구 ────────────────────────────────────────────────
  {
    id: '5', category: '도구',
    title: '대바늘 입문자 세트 추천해주세요',
    body: '대바늘 처음 시작하려는데 세트로 사는 게 좋을까요, 낱개로 사는 게 좋을까요?',
    author: { id: 'u7', name: '뜨개초보77' },
    createdAt: '3시간 전', likes: 6,
    answers: [
      { id: 'a5-1', author: { id: 'u8', name: '도구덕후', avatar: '🔧' }, body: '클로버 입문자 세트 강추예요! 4·5·6mm가 기본으로 들어 있어서 처음 배우기에 딱 좋아요.', likes: 7, isBest: true, createdAt: '2시간 전', ts: BASE - 2*H },
      { id: 'a5-2', author: { id: 'u2', name: '실전문가뜨개맘', avatar: '🧶' }, body: '처음엔 세트가 훨씬 이득이에요. 낱개로 사다 보면 어느새 돈이 더 나가더라고요 ㅎㅎ', likes: 5, isBest: false, createdAt: '1시간 전', ts: BASE - 1*H },
    ],
  },
  {
    id: '6', category: '도구',
    title: '코바늘 호수 선택 기준이 뭔가요?',
    body: '실 라벨에 3.5mm 표기가 있는데 그냥 3.5mm 코바늘 쓰면 되나요?',
    author: { id: 'u9', name: '코바늘시작' },
    createdAt: '6시간 전', likes: 9,
    answers: [
      { id: 'a6-1', author: { id: 'u3', name: '코바늘장인', avatar: '🪡' }, body: '기본적으로 라벨 기준대로 쓰면 되는데, 코가 빡빡하면 한 호수 올리고 느슨하면 내리면 돼요.', likes: 11, isBest: true, createdAt: '5시간 전', ts: BASE - 5*H },
    ],
  },
  {
    id: '7', category: '도구',
    title: '줄바늘 vs 짧은바늘, 스웨터 뜰 때 뭐가 편한가요?',
    body: '바텀업 스웨터 뜨는 중인데 줄바늘로 통으로 뜨는 게 낫나요, 짧은바늘 4개로 뜨는 게 나은가요?',
    author: { id: 'u10', name: '스웨터도전중' },
    createdAt: '2일 전', likes: 15,
    answers: [
      { id: 'a7-1', author: { id: 'u8', name: '도구덕후', avatar: '🔧' }, body: '줄바늘이 훨씬 편해요. 80cm 이상 줄이면 마법의 루프 방법도 쓸 수 있어서 코 수 많을 때 최고예요.', likes: 18, isBest: true, createdAt: '1일 전', ts: BASE - 24*H },
      { id: 'a7-2', author: { id: 'u3', name: '코바늘장인', avatar: '🪡' }, body: '저도 줄바늘 추천! 짧은바늘은 코 빠질 위험도 있어요.', likes: 7, isBest: false, createdAt: '20시간 전', ts: BASE - 20*H },
    ],
  },
  // ── 패턴 ────────────────────────────────────────────────
  {
    id: '8', category: '도안',
    title: '고무뜨기 패턴 이해가 안 가요ㅠ',
    body: '1코 고무뜨기인데 겉뜨기 다음에 실을 앞으로 빼고 안뜨기 하는 게 맞나요?',
    author: { id: 'u11', name: '패턴초보' },
    createdAt: '4시간 전', likes: 7,
    answers: [
      { id: 'a8-1', author: { id: 'u3', name: '코바늘장인', avatar: '🪡' }, body: '네 맞아요! 겉뜨기 후 실 앞으로 → 안뜨기 → 실 뒤로 → 겉뜨기 반복이에요. 금방 손에 익어요!', likes: 10, isBest: true, createdAt: '3시간 전', ts: BASE - 3*H },
    ],
  },
  {
    id: '9', category: '도안',
    title: '도안 기호 읽는 법 알려주세요',
    body: '일본 도안인데 기호들이 너무 많아 헷갈려요. 기본 기호표 어디서 구하나요?',
    author: { id: 'u12', name: '일본도안도전' },
    createdAt: '7시간 전', likes: 20,
    answers: [
      { id: 'a9-1', author: { id: 'u2', name: '실전문가뜨개맘', avatar: '🧶' }, body: '일본 뜨개 기호 JIS 표준 기호표 검색하시면 돼요! 네이버 카페에 한국어 설명 붙은 것도 많아요.', likes: 22, isBest: true, createdAt: '6시간 전', ts: BASE - 6*H },
      { id: 'a9-2', author: { id: 'u8', name: '도구덕후', avatar: '🔧' }, body: '유튜브에 "일본 뜨개 기호" 검색하면 영상으로도 잘 설명해줘요!', likes: 8, isBest: false, createdAt: '5시간 전', ts: BASE - 5*H },
    ],
  },
  {
    id: '10', category: '도안',
    title: '코늘리기 할 때 구멍이 생겨요',
    body: 'M1L, M1R 할 때 자꾸 구멍이 생기는데 어떻게 하면 깔끔하게 늘릴 수 있나요?',
    author: { id: 'u13', name: '구멍고민중' },
    createdAt: '1일 전', likes: 13,
    answers: [
      { id: 'a10-1', author: { id: 'u3', name: '코바늘장인', avatar: '🪡' }, body: 'M1L은 왼쪽 바늘로 앞 고리를 떠야 구멍이 안 생겨요. 뒤 고리를 뜨면 꼭 구멍이 나더라고요.', likes: 16, isBest: true, createdAt: '22시간 전', ts: BASE - 22*H },
    ],
  },
  // ── 기타 ────────────────────────────────────────────────
  {
    id: '11', category: '자유게시판',
    title: '뜨개질 처음 시작, 어디서 배우나요?',
    body: '혼자 유튜브 보면서 해보려는데 잘 안되네요. 오프라인 클래스 다니는 게 나을까요?',
    author: { id: 'u14', name: '뜨개시작하고파' },
    createdAt: '3시간 전', likes: 18,
    answers: [
      { id: 'a11-1', author: { id: 'u2', name: '실전문가뜨개맘', avatar: '🧶' }, body: '처음엔 오프라인 클래스 한두 번 다니는 게 훨씬 빨라요! 자세 잡는 게 제일 중요하거든요.', likes: 21, isBest: true, createdAt: '2시간 전', ts: BASE - 2*H },
      { id: 'a11-2', author: { id: 'u5', name: '베이비뜨개전문', avatar: '🍼' }, body: '저는 이음실 앱에서 동네 선생님 찾아 배웠어요! 편하게 집에서 1:1로 배울 수 있어요.', likes: 9, isBest: false, createdAt: '1시간 전', ts: BASE - 1*H },
    ],
  },
  {
    id: '12', category: '자유게시판',
    title: '완성된 니트 보관 방법이 궁금해요',
    body: '손뜨개 스웨터 여름에 어떻게 보관해야 좀이 안 먹나요?',
    author: { id: 'u15', name: '소중한스웨터' },
    createdAt: '8시간 전', likes: 12,
    answers: [
      { id: 'a12-1', author: { id: 'u6', name: '사계절뜨개', avatar: '🌿' }, body: '방충제 넣고 지퍼백 밀봉 후 서늘한 곳에 보관하세요! 세탁 후 완전 건조가 제일 중요해요.', likes: 15, isBest: true, createdAt: '7시간 전', ts: BASE - 7*H },
    ],
  },
  {
    id: '13', category: '자유게시판',
    title: '텐션 유지가 너무 힘들어요',
    body: '뜨다 보면 처음이랑 나중이랑 코 크기가 달라지더라고요. 텐션 유지 팁 있나요?',
    author: { id: 'u16', name: '텐션고민' },
    createdAt: '2일 전', likes: 25,
    answers: [
      { id: 'a13-1', author: { id: 'u3', name: '코바늘장인', avatar: '🪡' }, body: '텐션은 연습밖에 없어요. 게이지 스와치 꼭 뜨시고 항상 같은 자세로 앉는 습관 들이면 금방 안정돼요.', likes: 28, isBest: true, createdAt: '1일 전', ts: BASE - 24*H },
      { id: 'a13-2', author: { id: 'u8', name: '도구덕후', avatar: '🔧' }, body: '텐션링이라는 보조도구도 있어요! 손가락에 끼우는 건데 텐션 잡는 데 정말 도움 돼요.', likes: 11, isBest: false, createdAt: '20시간 전', ts: BASE - 20*H },
    ],
  },
]

export const USERS = {
  u1:  { id: 'u1',  name: '뜨개입문자',    avatar: '🌱' },
  u2:  { id: 'u2',  name: '실전문가뜨개맘', avatar: '🧶' },
  u3:  { id: 'u3',  name: '코바늘장인',    avatar: '🪡' },
  u4:  { id: 'u4',  name: '육아맘뜨개',    avatar: '🍀' },
  u5:  { id: 'u5',  name: '베이비뜨개전문', avatar: '🍼' },
  u6:  { id: 'u6',  name: '사계절뜨개',    avatar: '🌿' },
  u7:  { id: 'u7',  name: '뜨개초보77',    avatar: '🐣' },
  u8:  { id: 'u8',  name: '도구덕후',      avatar: '🔧' },
  u9:  { id: 'u9',  name: '코바늘시작',    avatar: '✨' },
  u10: { id: 'u10', name: '스웨터도전중',  avatar: '🧥' },
  u11: { id: 'u11', name: '패턴초보',      avatar: '📝' },
  u12: { id: 'u12', name: '일본도안도전',  avatar: '📖' },
  u13: { id: 'u13', name: '구멍고민중',    avatar: '🔍' },
  u14: { id: 'u14', name: '뜨개시작하고파', avatar: '🌟' },
  u15: { id: 'u15', name: '소중한스웨터',  avatar: '💎' },
  u16: { id: 'u16', name: '텐션고민',      avatar: '😅' },
  me:  { id: 'me',  name: '실뭉치',       avatar: '🧶' },
}
