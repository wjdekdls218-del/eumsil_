import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, ChevronDown, MoreVertical } from 'lucide-react'
import {
  doc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { C, FONT } from '../theme'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import ReportModal from '../components/ReportModal'
const STATUS_OPTIONS = ['판매중', '예약중', '거래완료']

const fmtTime = (ts) => {
  if (!ts?.toDate) return ''
  return ts.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const fmtDate = (ts) => {
  if (!ts?.toDate) return ''
  const d = ts.toDate()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function StatusBadge({ status }) {
  const map = {
    '나눔':     { bg: C.point,   color: C.white },
    '판매중':   { bg: C.text,    color: C.white },
    '예약중':   { bg: '#9E9E9E', color: C.white },
    '거래완료': { bg: '#DDD5CB', color: '#9E9E9E' },
  }
  const s = map[status] ?? map['판매중']
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, background: s.bg, color: s.color,
      whiteSpace: 'nowrap', letterSpacing: '-0.01em',
    }}>
      {status}
    </span>
  )
}

function DateDivider({ date }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 16px' }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 11, color: C.gray, letterSpacing: '-0.01em' }}>{date}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  )
}

export default function ChatRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, banInfo } = useAuth()
  const ME = user?.uid ?? 'me'

  const [chatId, setChatId]               = useState(null)
  const [product, setProduct]             = useState(null)
  const [otherName, setOtherName]         = useState('상대방')
  const [otherUid, setOtherUid]           = useState(null)
  const [messages, setMessages]           = useState([])
  const [inputText, setInputText]         = useState('')
  const [productStatus, setProductStatus] = useState('판매중')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [loading, setLoading]             = useState(true)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const [showReport, setShowReport]       = useState(false)

  const scrollRef = useRef(null)
  const inputRef  = useRef(null)

  // 채팅방 초기화 (chatId 또는 productId로 진입)
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      // 먼저 채팅 문서로 직접 조회
      const chatSnap = await getDoc(doc(db, 'chats', id))

      if (chatSnap.exists()) {
        // id가 chatId인 경우
        const data = chatSnap.data()
        if (cancelled) return
        setChatId(id)
        const other = data.otherName ?? data.participants?.find(p => p !== ME) ?? '상대방'
        setOtherName(other)
        const uid = data.participants?.find(p => p !== ME) ?? null
        setOtherUid(uid)

        if (data.productId) {
          const prodSnap = await getDoc(doc(db, 'posts', data.productId))
          if (!cancelled && prodSnap.exists()) {
            const p = { id: prodSnap.id, ...prodSnap.data() }
            setProduct(p)
            setProductStatus(p.status ?? '판매중')
          }
        }
        if (!cancelled) setLoading(false)
      } else {
        // id가 productId인 경우 — 기존 채팅 조회 또는 새로 생성
        const productId = id
        const prodSnap = await getDoc(doc(db, 'posts', productId))
        if (cancelled) return

        if (prodSnap.exists()) {
          const p = { id: prodSnap.id, ...prodSnap.data() }
          setProduct(p)
          setProductStatus(p.status ?? '판매중')

          const sellerName = p.seller?.name ?? '판매자'
          const sellerId   = p.seller?.id ?? 'seller'
          setOtherName(sellerName)

          // 기존 채팅 찾기
          const q = query(
            collection(db, 'chats'),
            where('productId', '==', productId),
            where('participants', 'array-contains', ME)
          )
          const existing = await getDocs(q)
          if (cancelled) return

          let resolvedChatId
          if (!existing.empty) {
            resolvedChatId = existing.docs[0].id
          } else {
            // 새 채팅 생성
            const ref = await addDoc(collection(db, 'chats'), {
              productId,
              participants: [ME, sellerId],
              otherName: sellerName,
              lastMessage: '',
              lastMessageTime: serverTimestamp(),
            })
            resolvedChatId = ref.id
          }

          if (cancelled) return
          // URL을 chatId로 교체
          navigate(`/chat/${resolvedChatId}`, { replace: true })
          // navigate 후 id가 바뀌면 effect 재실행됨 → 위 chatSnap.exists() 분기로 처리
        } else {
          if (!cancelled) setLoading(false)
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [id, ME])

  // 메시지 실시간 구독
  useEffect(() => {
    if (!chatId) return
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [chatId])

  // 새 메시지 도착 시 스크롤 하단
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!inputText.trim() || !chatId || banInfo?.isBanned) return
    const text = inputText.trim()
    setInputText('')
    inputRef.current?.focus()

    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text,
      senderId: ME,
      createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
    })

    // 상대방에게 채팅 알림 생성
    if (otherUid) {
      const senderName = user?.displayName || '누군가'
      addDoc(collection(db, 'notifications'), {
        uid: otherUid,
        type: 'chat',
        message: `${senderName}님이 메시지를 보냈어요`,
        relatedId: chatId,
        isRead: false,
        createdAt: serverTimestamp(),
      }).catch(err => console.error('[ChatRoom] 알림 생성 실패:', err))
    }
  }

  const handleStatusChange = async (s) => {
    setProductStatus(s)
    setShowStatusMenu(false)
    if (product?.id) {
      await updateDoc(doc(db, 'posts', product.id), { status: s })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 390, margin: '0 auto', height: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.gray, fontSize: 14 }}>불러오는 중...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: FONT }}>

      {/* 헤더 */}
      <header style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', background: C.bg, borderBottom: `1px solid ${C.border}`, zIndex: 50,
      }}>
        <button onClick={() => navigate(-1)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <div style={{
          width: 34, height: 34, borderRadius: 999, background: C.grayLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          🧶
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', flex: 1 }}>
          {otherName}
        </span>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowHeaderMenu(v => !v)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <MoreVertical size={20} color={C.gray} strokeWidth={1.8} />
          </button>
          {showHeaderMenu && (
            <>
              <div onClick={() => setShowHeaderMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
              <div style={{
                position: 'absolute', top: '100%', right: 0, zIndex: 100,
                background: C.white, borderRadius: 12,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                overflow: 'hidden', minWidth: 120,
              }}>
                <button
                  onClick={() => { setShowReport(true); setShowHeaderMenu(false) }}
                  style={{
                    display: 'block', width: '100%', padding: '12px 16px',
                    textAlign: 'left', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 14, color: '#E53E3E', background: C.white,
                  }}
                >
                  신고하기
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 거래 상품 카드 */}
      {product && (
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px', background: C.white, borderBottom: `1px solid ${C.border}`,
        }}>
          <img
            src={product.imageUrl || product.image}
            alt={product.title}
            style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              {product.title}
            </p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: product.type === 'share' ? C.point : C.text }}>
              {product.type === 'share' ? '나눔' : `${Number(product.price).toLocaleString()}원`}
            </p>
          </div>

          {/* 상태 변경 */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setShowStatusMenu(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
            >
              <StatusBadge status={productStatus} />
              <ChevronDown size={13} color={C.gray} strokeWidth={2} />
            </button>
            {showStatusMenu && (
              <>
                <div onClick={() => setShowStatusMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                  background: C.white, borderRadius: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  overflow: 'hidden', zIndex: 100, minWidth: 110,
                }}>
                  {STATUS_OPTIONS.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      style={{
                        display: 'block', width: '100%', padding: '11px 16px',
                        textAlign: 'left', border: 'none', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 13,
                        fontWeight: productStatus === s ? 700 : 400,
                        color: productStatus === s ? C.point : C.text,
                        background: productStatus === s ? '#F0FAF9' : C.white,
                        borderBottom: i < STATUS_OPTIONS.length - 1 ? `1px solid ${C.border}` : 'none',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 메시지 목록 */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column' }}>
        {messages.map((msg, i) => {
          const isMe = msg.senderId === ME
          const date = fmtDate(msg.createdAt)
          const prevDate = i > 0 ? fmtDate(messages[i - 1].createdAt) : null
          const showDate = date && (i === 0 || prevDate !== date)

          return (
            <div key={msg.id}>
              {showDate && <DateDivider date={date} />}
              <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                <div style={{ maxWidth: '72%' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isMe ? C.point : C.white,
                    color: isMe ? C.white : C.text,
                    fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.01em',
                    boxShadow: isMe ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                    wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                  <p style={{ margin: '4px 4px 0', fontSize: 10, color: C.gray, textAlign: isMe ? 'right' : 'left' }}>
                    {fmtTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 입력창 */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
        background: C.white, borderTop: `1px solid ${C.border}`,
      }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="메시지를 입력해주세요"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1, border: 'none', outline: 'none',
            background: C.bg, borderRadius: 999,
            padding: '10px 16px', fontSize: 14, color: C.text,
            fontFamily: 'inherit', letterSpacing: '-0.01em',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!inputText.trim()}
          style={{
            width: 42, height: 42, borderRadius: 999, flexShrink: 0,
            background: inputText.trim() ? C.point : C.border,
            border: 'none', cursor: inputText.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s ease',
          }}
        >
          <Send size={17} color={C.white} strokeWidth={2} />
        </button>
      </div>

      {showReport && (
        <ReportModal
          targetType="chat"
          targetId={chatId ?? ''}
          reportedId={otherUid ?? ''}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
