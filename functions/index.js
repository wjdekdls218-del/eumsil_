/**
 * 이음실 Cloud Functions 진입점
 *
 * 이 파일은 함수 등록만 담당한다.
 * 실제 비즈니스 로직은 각 도메인 폴더에 작성한다.
 *
 * [폴더 구조]
 * functions/
 *   ├── index.js                  ← 진입점 (여기)
 *   ├── delivery/
 *   │     └── scheduler.js       ← 배송 마감 스케줄 (D+1 알림, D+2 알림, 자동 취소)
 *   ├── notifications/
 *   │     └── sender.js          ← 인앱 알림 생성 유틸
 *   └── utils/
 *         └── firestore.js       ← Firestore db 인스턴스 및 컬렉션 참조
 *
 * [함수 추가 방법]
 * 1. 해당 도메인 폴더에 파일 작성
 * 2. 이 파일에 exports 한 줄 추가
 * 예) const { newFunction } = require("./domain/file");
 *     exports.newFunction = newFunction;
 *
 * [배포]
 * firebase deploy --only functions
 *
 * [로컬 테스트]
 * firebase emulators:start --only functions
 */

const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions");

// Firebase Admin SDK 초기화 (한 번만 실행)
admin.initializeApp();

// 비용 제어: 동시 실행 컨테이너 최대 10개로 제한
setGlobalOptions({ maxInstances: 10 });

// ─── 배송 관련 함수 ───────────────────────────────────────────
const { checkDeliveryDeadlines } = require("./delivery/scheduler");
exports.checkDeliveryDeadlines = checkDeliveryDeadlines;
