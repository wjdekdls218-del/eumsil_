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

// 게시글 상태 (홈 목록에서 보이는 상태)
const STATUS_OPTIONS = ['판매중', '예약중', '거래완료']

// 지원 택배사 목록
const CARRIERS = ['CJ대한통운', '한진택배', '롯데택배', '우체국택배', '로젠택배']

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

/**
 * 거래 방식 선택 모달 (판매자 전용)
 * - 직거래: 송장번호 없이 진행
 * - 택배: 택배사 + 송장번호 입력 필수
 */
function TradeModal({ onClose, onConfirm }) {
  const [deliveryType, setDeliveryType] = useState('parcel') // parcel | direct
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')

  const isValid = deliveryType === 'direct' || (carrier && trackingNumber.trim())

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430, background: C.white,
          borderRadius: '20px 20px 0 0', padding: '24px 20px 40px',
          fontFamily: FONT,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
            거래 방식 선택
          </h3>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: C.gray, padding: 0, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* 직거래 / 택배 선택 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'parcel', label: '📦 택배 거래' },
            { key: 'direct', label: '🤝 직접 만나기로 했어요' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDeliveryType(key)}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 12,
                border: `2px solid ${deliveryType === key ? C.point : C.border}`,
                background: deliveryType === key ? '#F0FAF9' : C.white,
                color: deliveryType === key ? C.point : C.gray,
                fontFamily: FONT, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 택배사 + 송장번호 (택배 선택 시) */}
        {deliveryType === 'parcel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: C.gray }}>택배사 선택</p>
              <select
                value={carrier}
                onChange={e => setCarrier(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  border: `1.5px solid ${C.border}`, background: C.white,
                  fontFamily: FONT, fontSize: 14, color: carrier ? C.text : C.gray,
                  outline: 'none', boxSizing: 'border-box',
                }}
              >
                <option value="">택배사를 선택해주세요</option>
                {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: C.gray }}>
                송장번호 <span style={{ color: '#E53E3E' }}>*</span>
              </p>
              <input
                type="text"
                placeholder="송장번호를 입력해주세요"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  border: `1.5px solid ${C.border}`, background: C.white,
                  fontFamily: FONT, fontSize: 14, color: C.text,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        {/* 직거래 안내 */}
        {deliveryType === 'direct' && (
          <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: '#F0FAF9', marginBottom: 20,
          }}>
            <p style={{ margin: 0, fontSize: 13, color: C.point, fontWeight: 600 }}>
              직거래로 진행됩니다. 안전한 장소에서 거래하세요 🤝
            </p>
          </div>
        )}

        <button
          onClick={() => isValid && onConfirm({ deliveryType, carrier, trackingNumber: trackingNumber.trim() })}
          disabled={!isValid}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 999,
            background: isValid ? C.point : C.border,
            color: C.white, border: 'none',
            fontFamily: FONT, fontSize: 16, fontWeight: 700,
            cursor: isValid ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
        >
          확인
        </button>
      </div>
    </div>
  )
}

export default function ChatRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, banInfo } = useAuth()
  const ME = user?.uid ?? 'me'

  const [chatId, setChatId]                 = useState(null)
  const [product, setProduct]               = useState(null)
  const [otherName, setOtherName]           = useState('상대방')
  const [otherUid, setOtherUid]             = useState(null)
  const [otherPhoto, setOtherPhoto]         = useState(null)
  const [messages, setMessages]             = useState([])
  const [inputText, setInputText]           = useState('')
  const [productStatus, setProductStatus]   = useState('판매중')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [loading, setLoading]               = useState(true)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const [showReport, setShowReport]         = useState(false)

  // 채팅 거래 상태
  // chatting  : 대화중 (기본값)
  // trading   : 거래중 (판매자가 송장 등록 또는 직거래 선택한 상태)
  // completed : 거래완료
  const [chatTradeStatus, setChatTradeStatus] = useState('chatting')
  const [deliveryInfo, setDeliveryInfo]       = useState(null)
  const [showTradeModal, setShowTradeModal]   = useState(false)

  const scrollRef    = useRef(null)
  const inputRef     = useRef(null)
  const isSendingRef = useRef(false)

  // 판매자 여부: 게시글 작성자(uid)가 나인 경우
  const isSeller = product?.uid === ME

  // 거래완료 버튼 활성화 조건
  // - 구매자: 거래중 상태이면 항상 가능
  // - 판매자: 배송 등록 후 7일 경과 시에만 가능 (구매자 미응답 보호)
  // - 직거래: 판매자도 즉시 완료 가능
  const canComplete = (() => {
    if (chatTradeStatus !== 'trading') return false
    if (deliveryInfo?.deliveryType === 'direct') return true
    if (!isSeller) return true
    const shippedAt = deliveryInfo?.shippedAt?.toDate?.() ?? null
    if (!shippedAt) return false
    const daysSince = (Date.now() - shippedAt.getTime()) / (1000 * 60 * 60 * 24)
    return daysSince >= 7
  })()

  // 채팅방 초기화 (chatId 또는 productId로 진입)
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const chatSnap = await getDoc(doc(db, 'chats', id))

      if (chatSnap.exists()) {
        // id가 chatId인 경우
        const data = chatSnap.data()
        if (cancelled) return
        setChatId(id)
        const uid = data.participants?.find(p => p !== ME) ?? null
        setOtherUid(uid)

        // 거래 상태 로드
        if (data.chatTradeStatus) setChatTradeStatus(data.chatTradeStatus)
        if (data.deliveryInfo)    setDeliveryInfo(data.deliveryInfo)

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

          const sellerId = p.uid  // 게시글 작성자 = 판매자
          setOtherUid(sellerId)

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
            // sellerId, buyerId는 Cloud Functions(스케줄러)에서 알림 발송에 사용됨
            const ref = await addDoc(collection(db, 'chats'), {
              productId,
              participants: [ME, sellerId],
              sellerId,
              buyerId: ME,
              otherName: p.nickname ?? '판매자',
              lastMessage: '',
              lastMessageTime: serverTimestamp(),
              chatTradeStatus: 'chatting',
            })
            resolvedChatId = ref.id
          }

          if (cancelled) return
          navigate(`/chat/${resolvedChatId}`, { replace: true })
        } else {
          if (!cancelled) setLoading(false)
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [id, ME])

  // 상대방 프로필 로드
  useEffect(() => {
    if (!otherUid) return
    getDoc(doc(db, 'users', otherUid)).then(snap => {
      if (!snap.exists()) return
      const d = snap.data()
      if (d.photoURL)     setOtherPhoto(d.photoURL)
      if (d.displayName)  setOtherName(d.displayName)
    })
  }, [otherUid])

  // 채팅 문서 실시간 구독 — 거래 상태 변경 감지 (양측 화면 동기화)
  useEffect(() => {
    if (!chatId) return
    return onSnapshot(doc(db, 'chats', chatId), (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      if (data.chatTradeStatus) setChatTradeStatus(data.chatTradeStatus)
      if (data.deliveryInfo)    setDeliveryInfo(data.deliveryInfo)
    })
  }, [chatId])

  // 채팅방 입장 시 알림 읽음 처리
  useEffect(() => {
    if (!chatId || !ME || ME === 'me') return
    getDocs(query(collection(db, 'notifications'), where('uid', '==', ME))).then(snap => {
      snap.docs
        .filter(d => { const x = d.data(); return x.type === 'chat' && x.relatedId === chatId && !x.isRead })
        .forEach(d => updateDoc(doc(db, 'notifications', d.id), { isRead: true }))
    })
  }, [chatId, ME])

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
    if (!inputText.trim() || !chatId || banInfo?.isBanned || isSendingRef.current) return
    isSendingRef.current = true
    const text = inputText.trim()
    setInputText('')
    inputRef.current?.focus()
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId: ME,
        createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
      })
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
    } finally {
      isSendingRef.current = false
    }
  }

  // 게시글 상태 변경 (판매중 / 예약중 / 거래완료)
  const handleStatusChange = async (s) => {
    setProductStatus(s)
    setShowStatusMenu(false)
    if (product?.id) {
      await updateDoc(doc(db, 'posts', product.id), { status: s })
    }
  }

  /**
   * 거래중 확정 (판매자 전용)
   * - 직거래: deliveryType = 'direct', 송장번호 없음
   * - 택배: deliveryType = 'parcel', 택배사 + 송장번호 저장
   */
  const handleTradeConfirm = async ({ deliveryType, carrier, trackingNumber }) => {
    if (!chatId) return
    setShowTradeModal(false)

    const newDeliveryInfo = {
      deliveryType,
      carrier:        deliveryType === 'parcel' ? carrier       : null,
      trackingNumber: deliveryType === 'parcel' ? trackingNumber : null,
      shippedAt:      serverTimestamp(),
    }

    await updateDoc(doc(db, 'chats', chatId), {
      chatTradeStatus: 'trading',
      deliveryInfo:    newDeliveryInfo,
      tradeAcceptedAt: serverTimestamp(),
      // Cloud Functions 스케줄러가 이 필드로 2일 마감 체크
      trackingDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    })

    // 시스템 메시지 생성
    const systemText = deliveryType === 'direct'
      ? '직거래로 진행하기로 했어요 🤝'
      : '판매자가 송장번호를 등록했어요. 확인하러 갈까요? →'

    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      type:     'system',
      text:     systemText,
      // action: 'viewDelivery' → 구매자가 탭하면 배송 상세 페이지로 이동
      action:   deliveryType === 'parcel' ? 'viewDelivery' : null,
      senderId: 'system',
      createdAt: serverTimestamp(),
    })

    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage:     systemText,
      lastMessageTime: serverTimestamp(),
    })
  }

  /**
   * 거래완료 처리
   * - 구매자: 언제든 가능
   * - 판매자: 직거래 또는 배송 7일 후 가능
   */
  const handleComplete = async () => {
    if (!chatId || !canComplete) return

    await updateDoc(doc(db, 'chats', chatId), {
      chatTradeStatus: 'completed',
      completedAt:     serverTimestamp(),
    })

    if (product?.id) {
      await updateDoc(doc(db, 'posts', product.id), { status: '거래완료' })
      setProductStatus('거래완료')
    }

    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      type:     'system',
      text:     '거래가 완료됐어요 ✅',
      senderId: 'system',
      createdAt: serverTimestamp(),
    })

    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage:     '거래가 완료됐어요 ✅',
      lastMessageTime: serverTimestamp(),
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 430, margin: '0 auto', height: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.gray, fontSize: 14 }}>불러오는 중...</p>
      </div>
    )
  }

  // 거래 상태 탭 버튼 설정
  const tradeStatusTabs = [
    {
      key:     'chatting',
      label:   '대화중',
      // 대화중 탭은 클릭 불가 (상태 표시용)
      onClick: null,
      active:  chatTradeStatus === 'chatting',
    },
    {
      key:     'trading',
      label:   '거래중',
      // 거래중: 판매자만 클릭 가능, 이미 거래중/완료이면 비활성
      onClick: isSeller && chatTradeStatus === 'chatting' ? () => setShowTradeModal(true) : null,
      active:  chatTradeStatus === 'trading',
    },
    {
      key:     'completed',
      label:   '거래완료',
      // 거래완료: canComplete 조건 충족 시 클릭 가능
      onClick: canComplete ? handleComplete : null,
      active:  chatTradeStatus === 'completed',
    },
  ]

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: FONT }}>

      {/* 헤더 */}
      <header style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', background: C.bg, borderBottom: `1px solid ${C.border}`, zIndex: 50,
      }}>
        <button onClick={() => navigate(-1)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <div
          onClick={() => otherUid && navigate(`/user/${otherUid}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, cursor: otherUid ? 'pointer' : 'default' }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 999, background: C.grayLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            overflow: 'hidden', flexShrink: 0,
          }}>
            {otherPhoto
              ? <img src={otherPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
              : '🧶'}
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
            {otherName}
          </span>
        </div>
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
        <div style={{ flexShrink: 0, background: C.white, borderBottom: `1px solid ${C.border}` }}>
          {/* 상품 정보 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
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
            {/* 판매자만 게시글 상태 변경 가능 */}
            {isSeller && (
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
            )}
            {/* 구매자는 상태 뱃지만 표시 */}
            {!isSeller && <StatusBadge status={productStatus} />}
          </div>

          {/* 거래 상태 바 */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '8px 16px 10px', gap: 8,
          }}>
            <span style={{ fontSize: 12, color: C.gray, fontWeight: 600, flexShrink: 0 }}>
              거래중이신가요?
            </span>
            <div style={{ display: 'flex', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
              {tradeStatusTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={tab.onClick ?? undefined}
                  style={{
                    padding: '5px 12px', borderRadius: 999,
                    border: `1.5px solid ${tab.active ? C.point : C.border}`,
                    background: tab.active ? C.point : C.white,
                    color: tab.active ? C.white : C.gray,
                    fontFamily: FONT, fontSize: 12, fontWeight: 700,
                    cursor: tab.onClick ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
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
          const prevMsg = i > 0 ? messages[i - 1] : null
          const showAvatar = !isMe && (prevMsg?.senderId !== msg.senderId || showDate)

          // 시스템 메시지 렌더링 (중앙 정렬, 클릭 가능)
          if (msg.type === 'system') {
            return (
              <div key={msg.id}>
                {showDate && <DateDivider date={date} />}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                  <button
                    onClick={() => {
                      if (msg.action === 'viewDelivery' && chatId) {
                        navigate(`/delivery/${chatId}`)
                      }
                    }}
                    style={{
                      padding: '8px 14px', borderRadius: 20,
                      background: '#F0F0F0', border: 'none',
                      fontFamily: FONT, fontSize: 12, color: '#555',
                      cursor: msg.action ? 'pointer' : 'default',
                      lineHeight: 1.4, textAlign: 'center',
                    }}
                  >
                    {msg.text}
                  </button>
                </div>
              </div>
            )
          }

          // 일반 메시지 렌더링
          return (
            <div key={msg.id}>
              {showDate && <DateDivider date={date} />}
              <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
                {!isMe && (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: C.grayLight, flexShrink: 0, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                    visibility: showAvatar ? 'visible' : 'hidden',
                  }}>
                    {otherPhoto
                      ? <img src={otherPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                      : '🧶'}
                  </div>
                )}
                <div style={{ maxWidth: '72%' }}>
                  {!isMe && showAvatar && (
                    <p style={{ margin: '0 0 4px 2px', fontSize: 11, fontWeight: 600, color: C.gray }}>{otherName}</p>
                  )}
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

      {/* 거래 방식 선택 모달 */}
      {showTradeModal && (
        <TradeModal
          onClose={() => setShowTradeModal(false)}
          onConfirm={handleTradeConfirm}
        />
      )}

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
