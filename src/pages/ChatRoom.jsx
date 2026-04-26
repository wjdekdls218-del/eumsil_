import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, ChevronDown } from 'lucide-react'
import { C, FONT } from '../theme'

// ─── 더미 데이터
const CHAT_ROOMS = [
  { id: 1, user: { name: '알파카팜',    avatar: 'https://picsum.photos/seed/user10/100/100' }, productId: 10 },
  { id: 2, user: { name: '실뭉치언니',  avatar: 'https://picsum.photos/seed/user1/100/100'  }, productId: 1  },
  { id: 3, user: { name: '코바늘요정',  avatar: 'https://picsum.photos/seed/user12/100/100' }, productId: 12 },
  { id: 4, user: { name: '니팅데이즈',  avatar: 'https://picsum.photos/seed/user11/100/100' }, productId: 11 },
]

const PRODUCTS = {
  1:  { title: '메리노울 실 100g 핑크',    type: 'share', price: 0,    status: '나눔',   image: 'https://picsum.photos/seed/knit11/300/300' },
  10: { title: '알파카 혼방 실 베이지',    type: 'sell',  price: 8000, status: '판매중', image: 'https://picsum.photos/seed/knit10/300/300' },
  11: { title: '대바늘 7mm 2쌍 거의 새것', type: 'share', price: 0,    status: '나눔',   image: 'https://picsum.photos/seed/knit66/300/300' },
  12: { title: '코바늘 5/0호 미개봉',      type: 'sell',  price: 3500, status: '예약중', image: 'https://picsum.photos/seed/knit77/300/300' },
}

const ROOM_MESSAGES = {
  1: [
    { id: 1, type: 'other', text: '안녕하세요! 알파카 실 아직 있나요?',      time: '오후 2:10', date: '2026.04.24' },
    { id: 2, type: 'me',    text: '네 있어요! 미개봉 새 제품이에요 :)',       time: '오후 2:15', date: '2026.04.24' },
    { id: 3, type: 'other', text: '혹시 직거래 가능하신가요?',               time: '오후 2:34', date: '2026.04.24' },
  ],
  2: [
    { id: 1, type: 'me',    text: '안녕하세요! 나눔 신청할게요 :)',           time: '오전 10:50', date: '2026.04.24' },
    { id: 2, type: 'other', text: '네~ 어떻게 받으실 건가요?',               time: '오전 10:55', date: '2026.04.24' },
    { id: 3, type: 'me',    text: '택배로 받을게요, 주소 드릴게요!',          time: '오전 11:00', date: '2026.04.24' },
    { id: 4, type: 'other', text: '나눔 감사합니다 🧶',                       time: '오전 11:05', date: '2026.04.24' },
  ],
  3: [
    { id: 1, type: 'other', text: '코바늘 아직 있나요?',                     time: '오후 3:00', date: '2026.04.23' },
    { id: 2, type: 'me',    text: '네 있어요! 3,500원에 드려요',             time: '오후 3:10', date: '2026.04.23' },
    { id: 3, type: 'other', text: '계좌번호 알려주세요!',                    time: '오후 3:15', date: '2026.04.23' },
    { id: 4, type: 'me',    text: '네 택배로 보내드릴게요!',                 time: '오후 3:20', date: '2026.04.23' },
  ],
  4: [
    { id: 1, type: 'other', text: '대바늘 나눔 신청해요!',                   time: '오후 1:00', date: '2026.04.22' },
    { id: 2, type: 'me',    text: '오케이요! 주소 알려주세요',               time: '오후 1:05', date: '2026.04.22' },
    { id: 3, type: 'other', text: '서울시 마포구 동교동이에요',              time: '오후 1:10', date: '2026.04.22' },
    { id: 4, type: 'other', text: '감사합니다. 잘 쓸게요!',                 time: '오후 1:30', date: '2026.04.22' },
  ],
}

const STATUS_OPTIONS = ['판매중', '예약중', '거래완료']

// ─── 상태 뱃지
function StatusBadge({ status }) {
  const map = {
    '나눔':     { bg: C.point,    color: C.white },
    '판매중':   { bg: C.text,     color: C.white },
    '예약중':   { bg: '#9E9E9E',  color: C.white },
    '거래완료': { bg: '#DDD5CB',  color: '#9E9E9E' },
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

// ─── 날짜 구분선
function DateDivider({ date }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 16px' }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 11, color: C.gray, letterSpacing: '-0.01em' }}>{date}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  )
}

// ─── ChatRoom
export default function ChatRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const roomId = parseInt(id)

  const room    = CHAT_ROOMS.find(r => r.id === roomId) ?? CHAT_ROOMS[0]
  const product = PRODUCTS[room.productId]

  const [messages,        setMessages]        = useState(ROOM_MESSAGES[roomId] ?? [])
  const [inputText,       setInputText]       = useState('')
  const [productStatus,   setProductStatus]   = useState(product?.status ?? '판매중')
  const [showStatusMenu,  setShowStatusMenu]  = useState(false)

  const scrollRef    = useRef(null)
  const inputRef     = useRef(null)

  // 메시지 추가 시 스크롤 하단 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 현재 시각 포맷
  const getNow = () => {
    const now = new Date()
    const time = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true })
    const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
    return { time, date }
  }

  const sendMessage = () => {
    if (!inputText.trim()) return
    const { time, date } = getNow()
    setMessages(prev => [...prev, {
      id:   Date.now(),
      type: 'me',
      text: inputText.trim(),
      time,
      date,
    }])
    setInputText('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div style={{
      maxWidth: 390, margin: '0 auto',
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: C.bg, fontFamily: FONT,
    }}>

      {/* ─── 헤더 */}
      <header style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        zIndex: 50,
      }}>
        <button onClick={() => navigate(-1)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <img src={room.user.avatar} alt={room.user.name}
          style={{ width: 34, height: 34, borderRadius: 999, objectFit: 'cover' }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          {room.user.name}
        </span>
      </header>

      {/* ─── 거래 상품 카드 */}
      {product && (
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px',
          background: C.white, borderBottom: `1px solid ${C.border}`,
        }}>
          <img src={product.image} alt={product.title}
            style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: C.text,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {product.title}
            </p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700,
              color: product.type === 'share' ? C.point : C.text }}>
              {product.type === 'share' ? '나눔' : `${product.price.toLocaleString()}원`}
            </p>
          </div>

          {/* 상태 변경 버튼 */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setShowStatusMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                border: 'none', background: 'transparent', cursor: 'pointer', padding: 4,
              }}
            >
              <StatusBadge status={productStatus} />
              <ChevronDown size={13} color={C.gray} strokeWidth={2} />
            </button>

            {showStatusMenu && (
              <>
                {/* 딤 배경 (메뉴 외부 클릭 닫기) */}
                <div
                  onClick={() => setShowStatusMenu(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                  background: C.white, borderRadius: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  overflow: 'hidden', zIndex: 100, minWidth: 110,
                }}>
                  {STATUS_OPTIONS.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => { setProductStatus(s); setShowStatusMenu(false) }}
                      style={{
                        display: 'block', width: '100%', padding: '11px 16px',
                        textAlign: 'left', border: 'none', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 13, fontWeight: productStatus === s ? 700 : 400,
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

      {/* ─── 메시지 목록 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {messages.map((msg, i) => {
          const showDate = i === 0 || messages[i - 1].date !== msg.date

          return (
            <div key={msg.id}>
              {showDate && <DateDivider date={msg.date} />}

              {/* 메시지 버블 */}
              <div style={{
                display: 'flex',
                justifyContent: msg.type === 'me' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
              }}>
                <div style={{ maxWidth: '72%' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: msg.type === 'me' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.type === 'me' ? C.point : C.white,
                    color: msg.type === 'me' ? C.white : C.text,
                    fontSize: 14, lineHeight: 1.5,
                    letterSpacing: '-0.01em',
                    boxShadow: msg.type === 'me' ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                    wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                  <p style={{
                    margin: '4px 4px 0',
                    fontSize: 10, color: C.gray,
                    textAlign: msg.type === 'me' ? 'right' : 'left',
                  }}>
                    {msg.time}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── 메시지 입력창 */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
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
            padding: '10px 16px',
            fontSize: 14, color: C.text,
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

    </div>
  )
}
