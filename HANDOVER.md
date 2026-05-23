# 이음실 프로젝트 인수인계서 (2026-05-15 기준)

## 프로젝트 개요
뜨개 재료 중고거래 + 커뮤니티 모바일 웹 서비스

- **배포 URL (메인)**: https://eumsil.vercel.app
- **배포 URL (포트폴리오)**: 별도 Vercel 프로젝트 (아직 GitHub Disconnect 안 함 → 작업 완료 후 Disconnect 예정)
- **GitHub**: https://github.com/wjdekdls218-del/eumsil_
- **로컬 경로**: `/Users/jeongsuji/무제 폴더 2`

## 기술 스택
- Frontend: React (Vite)
- Database: Firebase Firestore (`eumsil-ab852`)
- Auth: Firebase Authentication (구글 로그인, 전화 인증)
- 이미지 저장: Cloudinary (cloud name: `dw4hwiskc`, upload preset: `ai5j2gjk`)
- 지도: 카카오 맵 API
- 배포: Vercel (GitHub 연동, main 브랜치 자동 배포)

## 디자인 스펙
- 배경색: `#F5F0E8`
- 포인트 컬러: `#3DBDB8`
- 텍스트: `#0C0C0C`
- 폰트: **MaruBuri** (웹폰트 URL: `https://hangeul.pstatic.net/hangeul_static/css/maru-buri.css`)
- FONT 상수: `src/theme.js`에서 관리
- 최대 너비: 430px (모바일 웹)

## 이번 세션에서 작업한 내용

### 1. 채팅 목록 닉네임 표시 수정 (`src/pages/ChatList.jsx`)
- **문제**: 채팅 목록에서 상대방 이름이 "상대방"으로 고정되어 표시됨
- **원인**: Firestore users 컬렉션의 닉네임 필드가 `nickname`이 아닌 `displayName`으로 저장됨
- **수정**: 상대방 uid로 Firestore에서 `displayName` 필드를 직접 조회하여 표시
- **관련 필드**: `users/{uid}.displayName`, `users/{uid}.photoURL`

### 2. 포트폴리오용 브랜치 분리
- GitHub에 `portfolio` 브랜치 생성 (현재 main과 동일한 상태)
- Vercel에 포트폴리오용 별도 프로젝트 추가 생성
- **TODO**: 포트폴리오 최종 확정 후 Vercel 포트폴리오 프로젝트에서 **Disconnect** 버튼 눌러 GitHub 연결 해제 → 해당 시점 상태로 고정됨

### 3. 환영 공지 등록 (`scripts/setup-notice.mjs`)
- 기존 테스트 공지 전체 삭제 후 새 공지 등록
- Firestore `notices` 컬렉션에 직접 삽입하는 스크립트: `node scripts/setup-notice.mjs`
- 공지 내용: "이음실에 오신 걸 환영해요 🧶"
- `showPopup: true`, `popupStart: 등록일`, `popupEnd: 1년 후`

### 4. 홈 팝업 UI 개선 (`src/pages/Home.jsx`)
- 팝업 폭 축소 (maxWidth: 342 → 270px)
- 제목 가운데 정렬
- 내용: 첫 줄만 한 줄 미리보기 (말줄임표 처리)
- "확인" 버튼 → "보러가기"로 변경
- 보러가기 클릭 시 `/notices?id=${notice.id}`로 이동

### 5. 공지사항 페이지 개선 (`src/pages/Notice.jsx`)
- URL 쿼리 `?id=xxx`로 접근 시 해당 공지 자동 펼침 (`useSearchParams` 활용)
- 본문 필드명 통일: `notice.content || notice.body`

### 6. Vercel SPA 라우팅 설정 (`vercel.json`)
- 추가 이유: React Router 사용 시 직접 URL 접근하면 404 발생
- 모든 경로를 `index.html`로 리다이렉트

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### 7. BrowserRouter 위치 수정 (`src/App.jsx`)
- **문제**: BrowserRouter가 AppContent(인증 컨텍스트 내부) 안에 있어, Firebase 인증 상태 변경 시 라우터가 재생성되어 "No routes matched" 에러 발생
- **수정**: BrowserRouter를 앱 최상단(AuthProvider 바깥)으로 이동

```jsx
// 수정 후 구조
<BrowserRouter>
  <AuthProvider>
    <NotificationsProvider>
      <PostsProvider>
        <AppContent />  {/* Routes만 포함 */}
      </PostsProvider>
    </NotificationsProvider>
  </AuthProvider>
</BrowserRouter>
```

### 8. 누락 파일 커밋
- `src/pages/admin/AdminBanned.jsx` — git 미추적 상태였음
- `src/pages/Seed.jsx` — git 미추적 상태였음
- `src/adminTheme.js` — git 미추적 상태였음
- `dist/` 폴더를 `.gitignore`에 추가 (이전에 빌드 결과물이 커밋되어 Vercel 빌드 스킵 현상 발생)

### 9. 폰트 변경
- Pretendard → **MaruBuri**
- `index.html`에 웹폰트 CSS 링크 추가
- `src/theme.js`의 FONT 상수 변경

### 10. 탭 이름 변경
- `나눠보기` → `나눔해요`
- `실 올리기` → `주인을 찾아요`
- 변경 파일: `src/pages/Home.jsx`, `src/pages/Write.jsx`

## Firestore 주요 필드 정보
- **users**: `uid`, `displayName`(닉네임), `photoURL`, `phoneVerified`, `isAdmin`, `banUntil`
- **notices**: `title`, `content`, `isPinned`, `showPopup`, `popupStart`, `popupEnd`, `createdAt`
- **posts**: `uid`, `nickname`, `type('share'|'sell')`, `status('available'|'reserved'|'completed')`, `hidden`
- **chats**: `participants([uid1,uid2])`, `lastMessage`, `lastMessageTime`
- **community**: `uid`, `isAnonymous`, `likes`, answers 서브컬렉션

## 관리자 설정
- Firestore `users/{uid}` 문서에 `isAdmin: true` 추가
- 관리자 페이지: `eumsil.vercel.app/admin`

## 남은 작업
- 포트폴리오 Vercel 프로젝트 최종 확정 후 GitHub Disconnect
- 거래 후기 시스템 (현재 미구현, MyReviews.jsx 존재)
- UI 개선 (당근마켓과 차별화)
- 상용화 준비 (도메인 구매, Firebase Blaze 플랜 업그레이드)

## 로컬 개발 환경
```bash
cd "/Users/jeongsuji/무제 폴더 2"
npm run dev      # 개발 서버 (보통 localhost:5176)
npm run build    # 프로덕션 빌드
node scripts/setup-notice.mjs  # 공지 초기화 스크립트
```
