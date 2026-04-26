import { useNavigate } from 'react-router-dom'
import { C, FONT } from '../theme'

// ─── 더미 데이터
const CHAT_ROOMS = [
  {
    id: 1,
    user: { name: '알파카팜', avatar: 'https://picsum.photos/seed/user10/100/100' },
    lastMessage: '혹시 직거래 가능하신가요?',
    time: '오후 2:34',
    unread: 2,
    productId: 10,
  },
  {
    id: 2,
    user: { name: '실뭉치언니', avatar: 'https://picsum.photos/seed/user1/100/100' },
    lastMessage: '나눔 감사합니다 🧶',
    time: '오전 11:05',
    unread: 0,
    productId: 1,
  },
  {
    id: 3,
    user: { name: '코바늘요정', avatar: 'https://picsum.photos/seed/user12/100/100' },
    lastMessage: '네 택배로 보내드릴게요!',
    time: '어제',
    unread: 0,
    productId: 12,
  },
  {
    id: 4,
    user: { name: '니팅데이즈', avatar: 'https://picsum.photos/seed/user11/100/100' },
    lastMessage: '감사합니다. 잘 쓸게요!',
    time: '3일 전',
    unread: 0,
    productId: 11,
  },
]

export default function ChatList() {
  const navigate = useNavigate()

  return (
    <div style={{
      maxWidth: 390, margin: '0 auto', minHeight: '100dvh',
      background: C.bg, fontFamily: FONT,
    }}>
      {/* 헤더 */}
      <header style={{
        padding: '20px 20px 12px',
        position: 'sticky', top: 0, background: C.bg, zIndex: 50,
      }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
          채팅
        </h1>
      </header>

      {/* 채팅방 리스트 */}
      <div style={{ paddingBottom: 90 }}>
        {CHAT_ROOMS.map((room, i) => (
          <div key={room.id}>
            <div
              onClick={() => navigate(`/chat/${room.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px',
                cursor: 'pointer',
                background: C.white,
              }}
            >
              {/* 프로필 이미지 */}
              <img
                src={room.user.avatar}
                alt={room.user.name}
                style={{ width: 52, height: 52, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }}
              />

              {/* 내용 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
                    {room.user.name}
                  </span>
                  <span style={{ fontSize: 11, color: C.gray, flexShrink: 0 }}>{room.time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <p style={{
                    margin: 0, fontSize: 13, color: C.gray,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}>
                    {room.lastMessage}
                  </p>
                  {room.unread > 0 && (
                    <span style={{
                      flexShrink: 0,
                      minWidth: 20, height: 20,
                      borderRadius: 999, padding: '0 6px',
                      background: C.point, color: C.white,
                      fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {room.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* 구분선 (마지막 제외) */}
            {i < CHAT_ROOMS.length - 1 && (
              <div style={{ height: 1, background: C.border, margin: '0 20px' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
