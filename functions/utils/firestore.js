/**
 * Firestore 공통 유틸
 * - db 인스턴스 및 자주 쓰는 컬렉션 참조를 중앙에서 관리
 * - 새 컬렉션이 생기면 여기에 추가할 것
 */

const admin = require("firebase-admin");

const db = admin.firestore();

module.exports = {
  db,
  collections: {
    users:         () => db.collection("users"),
    chats:         () => db.collection("chats"),
    notifications: () => db.collection("notifications"),
    posts:         () => db.collection("posts"),
  },
};
