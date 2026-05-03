import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { C, FONT } from '../theme'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'

const formatTime = (ts) => {
  if (!ts?.toDate) return ''
  const d = ts.toDate()
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true })
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

export default function ChatList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unreadChatIds } = useNotifications()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    )
    return onSnapshot(q, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const tA = a.lastMessageTime?.toDate?.()?.getTime() ?? 0
          const tB = b.lastMessageTime?.toDate?.()?.getTime() ?? 0
          return tB - tA
        })
      setChats(list)
      setLoading(false)
    }, () => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>
      <header style={{ padding: '20px 20px 12px', position: 'sticky', top: 0, background: C.bg, zIndex: 50 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>채팅</h1>
      </header>

      <div style={{ paddingBottom: 90 }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: C.gray, fontSize: 14 }}>
            불러오는 중...
          </div>
        ) : chats.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: C.gray, fontSize: 14 }}>
            아직 채팅이 없어요.
          </div>
        ) : chats.map((room, i) => {
          const otherName = room.otherName ?? (room.participants?.find(p => p !== 'me') ?? '상대방')
          const hasUnread = unreadChatIds.has(room.id)
          return (
            <div key={room.id}>
              <div
                onClick={() => navigate(`/chat/${room.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer', background: C.white }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 999,
                  background: C.grayLight, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  🧶
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
                      {otherName}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {hasUnread && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 999,
                          background: C.point, color: C.white,
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
                        }}>
                          NEW
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: C.gray }}>
                        {formatTime(room.lastMessageTime)}
                      </span>
                    </div>
                  </div>
                  <p style={{
                    margin: 0, fontSize: 13,
                    color: hasUnread ? C.text : C.gray,
                    fontWeight: hasUnread ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}>
                    {room.lastMessage ?? ''}
                  </p>
                </div>
              </div>
              {i < chats.length - 1 && (
                <div style={{ height: 1, background: C.border, margin: '0 20px' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
