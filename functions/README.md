# 이음실 Cloud Functions

## 개요
Firebase Cloud Functions 기반 백엔드 서버.
프론트엔드(React)에서 처리하기 어려운 자동화/스케줄 작업을 담당한다.

## 기술 스택
- Runtime: Node.js 18
- Firebase Functions v2
- Firebase Admin SDK
- 언어: JavaScript

## 폴더 구조
```
functions/
  ├── index.js                  진입점 - 함수 등록만 담당
  ├── delivery/
  │     └── scheduler.js       배송 마감 스케줄러
  ├── notifications/
  │     └── sender.js          인앱 알림 생성 유틸
  └── utils/
        └── firestore.js       Firestore 인스턴스 및 컬렉션 참조
```

## 현재 구현된 함수

### `checkDeliveryDeadlines`
- **종류**: 스케줄 함수 (매일 오전 9시 KST 실행)
- **역할**: 송장 미등록 거래를 체크해 알림 발송 및 자동 취소 처리
- **로직**:
  - D+1 (24~36시간 경과): 판매자에게 발송 독촉 알림
  - D+2 (0~24시간 남음): 판매자에게 마감 임박 알림
  - D+2 초과 + 연장 없음: 거래 자동 취소 + 양측 알림

## Firestore 필드 의존성

### chats 컬렉션
| 필드 | 타입 | 설명 |
|---|---|---|
| `tradeStatus` | string | `pending` \| `extended` \| `shipped` \| `delivered` \| `cancelled` |
| `sellerId` | string | 판매자 uid |
| `buyerId` | string | 구매자 uid |
| `tradeAcceptedAt` | timestamp | 거래 수락 시각 |
| `trackingDeadline` | timestamp | 송장 등록 마감 (tradeAcceptedAt + 48시간) |
| `trackingNumber` | string | 송장번호 |
| `carrier` | string | 택배사명 |
| `notifiedD1` | boolean | D+1 알림 발송 여부 (중복 방지) |
| `notifiedD2` | boolean | D+2 알림 발송 여부 (중복 방지) |
| `extensionRequest.status` | string | `pending` \| `approved` \| `declined` |
| `extensionRequest.newDeadline` | timestamp | 연장 요청된 새 마감일 |

## 로컬 개발 환경

```bash
cd functions
npm install

# 에뮬레이터로 로컬 테스트
firebase emulators:start --only functions

# 스케줄 함수 수동 테스트 (에뮬레이터에서 HTTP 트리거로 호출)
curl http://localhost:5001/eumsil-ab852/us-central1/checkDeliveryDeadlines
```

## 배포

```bash
# 전체 배포
firebase deploy --only functions

# 특정 함수만 배포
firebase deploy --only functions:checkDeliveryDeadlines
```

## 함수 추가 방법

1. 해당 도메인 폴더에 파일 작성 (예: `payment/processor.js`)
2. `index.js`에 등록:
```js
const { processPayment } = require("./payment/processor");
exports.processPayment = processPayment;
```
3. `firebase deploy --only functions`

## 향후 추가 예정
- 본인인증 연동 (PASS / 아임포트)
- 결제 처리 (토스페이먼츠)
- FCM 푸시 알림
- 배송조회 API 연동 (스마트택배)
