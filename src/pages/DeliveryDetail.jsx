/**
 * 배송 상세 페이지
 *
 * 채팅방의 거래중 시스템 메시지 "확인하러 갈까요?" 클릭 시 이동
 * 경로: /delivery/:chatId
 *
 * 표시 정보:
 *  - 거래 방식 (택배 / 직거래)
 *  - 택배사 및 송장번호
 *  - 배송 조회 외부 링크 (택배인 경우)
 *  - 거래 완료 버튼 (구매자: 항상 / 판매자: 발송 후 7일 경과 시)
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Package, MapPin, CheckCircle2, Clock } from 'lucide-react'
import { doc, getDoc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore'
import { C, FONT } from '../theme'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

// 택배사별 배송 조회 URL (송장번호를 URL 끝에 붙이면 바로 조회 가능)
const CARRIER_TRACKING_URL = {
  'CJ대한통운': 'https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=',
  '한진택배':   'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=',
  '롯데택배':   'https://www.lotteglogis.com/open/tracking?InvNo=',
  '우체국택배': 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=',
  '로젠택배':   'https://www.ilogen.com/web/personal/trace/',
}

// 거래 완료 처리 시 게시글 상태도 '거래완료'로 업데이트
async function markComplete(chatId, chatData) {
  const batch = []

  batch.push(
    updateDoc(doc(db, 'chats', chatId), {
      chatTradeStatus: 'completed',
      completedAt: serverTimestamp(),
    })
  )

  if (chatData.postId) {
    batch.push(
      updateDoc(doc(db, 'posts', chatData.postId), { status: '거래완료' })
    )
  }

  // 시스템 메시지: 거래 완료
  batch.push(
    addDoc(collection(db, 'chats', chatId, 'messages'), {
      type: 'system',
      action: 'completed',
      text: '거래가 완료됐어요. 감사합니다! 🎉',
      createdAt: serverTimestamp(),
    })
  )

  await Promise.all(batch)
}

export default function DeliveryDetail() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const ME = user?.uid

  const [chatData, setChatData]     = useState(null)
  const [product, setProduct]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [completing, setCompleting] = useState(false)

  // 채팅 문서 로드
  useEffect(() => {
    if (!chatId) return
    getDoc(doc(db, 'chats', chatId)).then(async (snap) => {
      if (!snap.exists()) { setLoading(false); return }
      const data = { id: snap.id, ...snap.data() }
      setChatData(data)

      // 연결된 게시글 로드
      if (data.postId) {
        const pSnap = await getDoc(doc(db, 'posts', data.postId))
        if (pSnap.exists()) setProduct({ id: pSnap.id, ...pSnap.data() })
      }
      setLoading(false)
    })
  }, [chatId])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', fontFamily: FONT }}>
        <span style={{ color: C.gray, fontSize: 14 }}>불러오는 중...</span>
      </div>
    )
  }

  if (!chatData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', fontFamily: FONT }}>
        <span style={{ color: C.gray, fontSize: 14 }}>거래 정보를 찾을 수 없어요.</span>
      </div>
    )
  }

  const deliveryInfo  = chatData.deliveryInfo ?? {}
  const isParcel      = deliveryInfo.deliveryType === 'parcel'
  const isSeller      = chatData.sellerId === ME
  const tradeStatus   = chatData.chatTradeStatus ?? 'chatting'
  const isCompleted   = tradeStatus === 'completed'

  // 거래 완료 버튼 활성화 조건
  // - 구매자: 항상 누를 수 있음
  // - 판매자: 발송 후 7일 경과 시 또는 직거래
  const canComplete = (() => {
    if (tradeStatus !== 'trading') return false
    if (!isParcel) return true                          // 직거래는 양쪽 모두 가능
    if (!isSeller) return true                          // 구매자는 항상 가능
    const shippedAt = deliveryInfo.shippedAt?.toDate?.() ?? null
    if (!shippedAt) return false
    const daysSince = (Date.now() - shippedAt.getTime()) / (1000 * 60 * 60 * 24)
    return daysSince >= 7
  })()

  const trackingUrl = isParcel && deliveryInfo.carrier && deliveryInfo.trackingNumber
    ? (CARRIER_TRACKING_URL[deliveryInfo.carrier] ?? '') + deliveryInfo.trackingNumber
    : null

  const handleComplete = async () => {
    if (!canComplete || completing) return
    setCompleting(true)
    try {
      await markComplete(chatId, chatData)
      setChatData(prev => ({ ...prev, chatTradeStatus: 'completed' }))
    } catch (e) {
      console.error('[DeliveryDetail] 거래 완료 실패:', e)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>
      {/* 헤더 */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 8px 12px',
        background: C.white,
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 8px', display: 'flex' }}
        >
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          배송 상세
        </span>
      </header>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 상품 정보 */}
        {product && (
          <div
            onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
            style={{
              background: C.white, borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}
          >
            {product.images?.[0] && (
              <img
                src={product.images[0]}
                alt={product.title}
                style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: '0 0 3px', fontSize: 15, fontWeight: 700, color: C.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                letterSpacing: '-0.02em',
              }}>
                {product.title}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.gray }}>
                {product.type === 'share' ? '나눔' : `${Number(product.price ?? 0).toLocaleString()}원`}
              </p>
            </div>
          </div>
        )}

        {/* 거래 방식 카드 */}
        <div style={{ background: C.white, borderRadius: 14, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 거래 방식 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isParcel
              ? <Package size={20} color={C.point} strokeWidth={1.8} />
              : <MapPin  size={20} color={C.point} strokeWidth={1.8} />
            }
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
              {isParcel ? '택배 거래' : '직거래'}
            </span>
          </div>

          {/* 택배 세부 정보 */}
          {isParcel && (
            <>
              <div style={{ height: 1, background: C.border }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Row label="택배사" value={deliveryInfo.carrier ?? '-'} />
                <Row label="송장번호" value={deliveryInfo.trackingNumber ?? '-'} mono />
              </div>

              {/* 배송 조회 버튼 */}
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    marginTop: 4,
                    padding: '11px 0', borderRadius: 10,
                    background: C.point, color: C.white,
                    fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={15} strokeWidth={2} />
                  배송 조회하기
                </a>
              )}
            </>
          )}
        </div>

        {/* 거래 상태 카드 */}
        <div style={{ background: C.white, borderRadius: 14, padding: '18px 16px' }}>
          {isCompleted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={20} color="#4CAF50" strokeWidth={1.8} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#4CAF50', letterSpacing: '-0.02em' }}>
                거래 완료됐어요!
              </span>
            </div>
          ) : tradeStatus === 'trading' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={20} color={C.point} strokeWidth={1.8} />
                <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
                  거래 진행 중
                </span>
              </div>
              {isSeller && !canComplete && isParcel && (
                <p style={{ margin: 0, fontSize: 12, color: C.gray, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                  발송 후 7일이 지나면 거래 완료 처리할 수 있어요.
                </p>
              )}
              {canComplete && (
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  style={{
                    padding: '12px 0', borderRadius: 10, border: 'none',
                    background: completing ? C.grayLight : C.text,
                    color: completing ? C.gray : C.white,
                    fontSize: 15, fontWeight: 700, cursor: completing ? 'not-allowed' : 'pointer',
                    letterSpacing: '-0.01em', fontFamily: 'inherit',
                  }}
                >
                  {completing ? '처리 중...' : '거래 완료'}
                </button>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: C.gray, textAlign: 'center' }}>
              거래가 시작되면 배송 정보가 표시돼요.
            </p>
          )}
        </div>

      </div>
    </div>
  )
}

// 라벨-값 행 컴포넌트
function Row({ label, value, mono = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 13, color: C.gray, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 14, fontWeight: 600, color: C.text, letterSpacing: mono ? '0.04em' : '-0.01em',
        fontFamily: mono ? 'monospace' : 'inherit',
      }}>
        {value}
      </span>
    </div>
  )
}
