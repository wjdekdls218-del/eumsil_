/**
 * 배송 마감 스케줄러
 *
 * [비즈니스 규칙]
 * - 거래 수락 후 2일(48시간) 이내에 판매자가 송장번호를 등록해야 한다.
 * - D+1(24시간 경과): 판매자에게 발송 독촉 알림
 * - D+2(48시간 경과): 판매자에게 마감 임박 알림 + 연장 요청 안내
 * - D+2 초과 + 연장 미요청: 거래 자동 취소, 양측에 알림
 *
 * [연장 요청 흐름 - 프론트에서 처리]
 * 판매자가 채팅방에서 "발송 연장 요청" 버튼 클릭
 *   → chats/{id}.extensionRequest.status = 'pending'
 *   → 구매자가 동의 시 status = 'approved', extendedDeadline 갱신
 *   → 구매자가 거절 또는 24시간 무응답 시 status = 'declined' → 거래 취소
 *
 * [스케줄]
 * 매일 오전 9시 (KST) 실행
 * 변경 시 exports.checkDeliveryDeadlines 의 schedule 파라미터 수정
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { collections } = require("../utils/firestore");
const { createNotification } = require("../notifications/sender");

exports.checkDeliveryDeadlines = onSchedule(
  {
    schedule: "0 9 * * *",   // 매일 09:00 KST
    timeZone: "Asia/Seoul",
  },
  async () => {
    const now = new Date();

    // 송장 미등록 상태인 거래 전체 조회
    const snapshot = await collections.chats()
      .where("tradeStatus", "==", "pending")
      .get();

    const tasks = snapshot.docs.map(async (doc) => {
      const chat = doc.data();
      const chatId = doc.id;
      const deadline = chat.trackingDeadline?.toDate?.();

      if (!deadline) return;

      const msLeft = deadline - now;
      const hoursLeft = msLeft / (1000 * 60 * 60);

      // --- D+1: 발송 독촉 알림 ---
      // 마감까지 24~36시간 남았을 때 1회 발송
      // (매일 1회 실행이므로 중복 방지를 위해 notifiedD1 플래그 사용)
      if (hoursLeft <= 36 && hoursLeft > 24 && !chat.notifiedD1) {
        await createNotification(
          chat.sellerId,
          "delivery",
          "📦 내일까지 택배 발송이 필요해요. 빠른 발송 부탁드려요!",
          chatId
        );
        await collections.chats().doc(chatId).update({ notifiedD1: true });
      }

      // --- D+2: 마감 임박 알림 ---
      // 마감까지 0~24시간 남았을 때 1회 발송
      if (hoursLeft <= 24 && hoursLeft > 0 && !chat.notifiedD2) {
        await createNotification(
          chat.sellerId,
          "delivery",
          "⚠️ 오늘까지 발송이 필요해요. 어려우시면 채팅방에서 연장을 요청해주세요.",
          chatId
        );
        await collections.chats().doc(chatId).update({ notifiedD2: true });
      }

      // --- 마감 초과: 거래 자동 취소 ---
      // 연장 요청이 없거나 거절된 경우만 취소 처리
      const extensionStatus = chat.extensionRequest?.status;
      const isExtensionPending = extensionStatus === "pending";
      const isExtended = extensionStatus === "approved";

      if (hoursLeft <= 0 && !isExtensionPending && !isExtended) {
        await collections.chats().doc(chatId).update({
          tradeStatus: "cancelled",
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          cancelReason: "발송 기한 초과 자동 취소",
        });

        // 판매자 알림
        await createNotification(
          chat.sellerId,
          "delivery",
          "발송 기한이 초과되어 거래가 자동 취소됐어요.",
          chatId
        );
        // 구매자 알림
        await createNotification(
          chat.buyerId,
          "delivery",
          "판매자가 기한 내 발송하지 않아 거래가 자동 취소됐어요.",
          chatId
        );
      }
    });

    await Promise.all(tasks);
  }
);
