/**
 * 알림 발송 모듈
 *
 * Firestore notifications 컬렉션에 문서를 추가하는 방식으로 알림을 생성한다.
 * 프론트엔드는 onSnapshot으로 실시간 구독 중이므로 별도 FCM 없이 인앱 알림 가능.
 *
 * 추후 FCM(Firebase Cloud Messaging) 푸시 알림 추가 시
 * sendPushNotification() 함수를 이 파일에 작성하고 createNotification() 내부에서 호출하면 된다.
 */

const admin = require("firebase-admin");
const { collections } = require("../utils/firestore");

/**
 * 인앱 알림 생성
 * @param {string} uid        - 알림 받을 유저 uid
 * @param {string} type       - 알림 종류: 'chat' | 'answer' | 'delivery'
 * @param {string} message    - 알림 메시지
 * @param {string} relatedId  - 관련 채팅방/게시글 id (클릭 시 이동할 대상)
 */
async function createNotification(uid, type, message, relatedId) {
  await collections.notifications().add({
    uid,
    type,
    message,
    relatedId,
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

module.exports = { createNotification };
