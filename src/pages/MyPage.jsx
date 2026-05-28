import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Settings, Star, Pencil, Package, MapPin } from 'lucide-react'
import {
  collection, query, where, getDocs, orderBy, doc, getDoc
} from 'firebase/firestore'
import { C, FONT } from '../theme'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'

const STATUS_STYLE = {
  '판매중': { bg: C.text,    color: C.white },
  '나눔':   { bg: C.point,   color: C.white },
  '예약중': { bg: '#9E9E9E', color: C.white },
  '완료':   { bg: '#DDD5CB', color: '#9E9E9E' },
  '거래완료': { bg: '#DDD5CB', color: '#9E9E9E' },
}

// ─── 탭: 판매 내역 ─────────────────────────────────────────────
function SalesTab({ myPosts }) {
  const navigate = useNavigate()

  if (myPosts.length === 0) {
    return (
      <p style={{ margin: 0, padding: '28px 0', fontSize: 13, color: C.gray, textAlign: 'center' }}>
        아직 올린 게시글이 없어요.
      </p>
    )
  }

  return (
    <div style={{ background: C.white, borderRadius: 16, overflow: 'hidden' }}>
      {myPosts.map((item, idx) => {
        const s = STATUS_STYLE[item.status] ?? STATUS_STYLE['판매중']
        return (
          <div key={item.id}>
            <div
              onClick={() => navigate(`/product/${item.id}`, { state: { product: item } })}
              style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              {item.images?.[0] && (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                />
              )}
              <span style={{
                fontSize: 14, fontWeight: 600, color: C.text,
                letterSpacing: '-0.01em', flex: 1, minWidth: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.title}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: item.type === 'share' ? C.point : C.gray, flexShrink: 0 }}>
                {item.type === 'share' ? '나눔' : `${Number(item.price ?? 0).toLocaleString()}원`}
              </span>
              <span style={{
                marginLeft: 2, flexShrink: 0,
                padding: '2px 8px', borderRadius: 999,
                fontSize: 11, fontWeight: 700, background: s.bg, color: s.color,
              }}>
                {item.status}
              </span>
            </div>
            {idx < myPosts.length - 1 && (
              <div style={{ height: 1, background: C.border, margin: '0 16px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── 탭: 구매 내역 ─────────────────────────────────────────────
function PurchasesTab({ purchases, loadingPurchases }) {
  const navigate = useNavigate()

  if (loadingPurchases) {
    return (
      <p style={{ margin: 0, padding: '28px 0', fontSize: 13, color: C.gray, textAlign: 'center' }}>
        불러오는 중...
      </p>
    )
  }

  if (purchases.length === 0) {
    return (
      <p style={{ margin: 0, padding: '28px 0', fontSize: 13, color: C.gray, textAlign: 'center' }}>
        아직 구매한 내역이 없어요.
      </p>
    )
  }

  return (
    <div style={{ background: C.white, borderRadius: 16, overflow: 'hidden' }}>
      {purchases.map((item, idx) => {
        const isParcel      = item.deliveryInfo?.deliveryType === 'parcel'
        const tradeStatus   = item.chatTradeStatus ?? 'chatting'
        const statusLabel   = tradeStatus === 'completed' ? '거래완료' : tradeStatus === 'trading' ? '거래중' : '대화중'
        const statusColor   = tradeStatus === 'completed' ? C.gray : tradeStatus === 'trading' ? C.point : C.text

        return (
          <div key={item.chatId}>
            <div
              onClick={() => navigate(`/chat/${item.chatId}`)}
              style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              {/* 상품 썸네일 */}
              {item.product?.images?.[0] ? (
                <img
                  src={item.product.images[0]}
                  alt={item.product.title}
                  style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 48, height: 48, borderRadius: 10, background: C.grayLight,
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  🧶
                </div>
              )}

              {/* 정보 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: C.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  letterSpacing: '-0.02em',
                }}>
                  {item.product?.title ?? '(게시글 삭제됨)'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* 거래 방식 아이콘 */}
                  {tradeStatus === 'trading' || tradeStatus === 'completed' ? (
                    isParcel
                      ? <Package size={12} color={C.gray} strokeWidth={1.8} />
                      : <MapPin  size={12} color={C.gray} strokeWidth={1.8} />
                  ) : null}
                  <span style={{ fontSize: 12, color: C.gray }}>
                    {tradeStatus === 'trading' || tradeStatus === 'completed'
                      ? isParcel ? '택배' : '직거래'
                      : item.product?.type === 'share' ? '나눔' : `${Number(item.product?.price ?? 0).toLocaleString()}원`
                    }
                  </span>
                </div>
              </div>

              {/* 상태 뱃지 */}
              <span style={{
                flexShrink: 0,
                fontSize: 12, fontWeight: 700, color: statusColor,
                letterSpacing: '-0.01em',
              }}>
                {statusLabel}
              </span>
            </div>

            {/* 배송 조회 버튼 (택배 거래중인 경우) */}
            {isParcel && (tradeStatus === 'trading' || tradeStatus === 'completed') && (
              <div style={{ padding: '0 16px 12px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/delivery/${item.chatId}`) }}
                  style={{
                    width: '100%', padding: '9px 0', borderRadius: 8,
                    border: `1px solid ${C.border}`, background: C.bg,
                    color: C.text, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    letterSpacing: '-0.01em',
                  }}
                >
                  배송 상세 보기
                </button>
              </div>
            )}

            {idx < purchases.length - 1 && (
              <div style={{ height: 1, background: C.border, margin: '0 16px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────
export default function MyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [activeTab, setActiveTab]           = useState('sales')   // 'sales' | 'purchases'
  const [profile, setProfile]               = useState(null)
  const [myPosts, setMyPosts]               = useState([])
  const [purchases, setPurchases]           = useState([])
  const [loadingPurchases, setLoadingPurchases] = useState(false)

  // 프로필 로드 (ProfileEdit 후 돌아와도 재조회)
  useEffect(() => {
    if (!user) return
    let cancelled = false
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (cancelled) return
      setProfile(snap.exists() ? snap.data() : { displayName: user.displayName, photoURL: user.photoURL })
    })
    return () => { cancelled = true }
  }, [user?.uid, location.key])

  // 내 판매 게시글 로드
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'posts'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    getDocs(q)
      .then(snap => setMyPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(err => console.error('[MyPage] 판매 게시글 쿼리 실패:', err))
  }, [user?.uid])

  // 구매 내역 로드 (buyerId == ME 인 채팅방 + 거래 시작된 것만)
  useEffect(() => {
    if (!user || activeTab !== 'purchases') return
    if (purchases.length > 0) return  // 이미 로드됨
    setLoadingPurchases(true)

    const q = query(
      collection(db, 'chats'),
      where('buyerId', '==', user.uid),
      where('chatTradeStatus', 'in', ['trading', 'completed']),
      orderBy('updatedAt', 'desc')
    )

    getDocs(q)
      .then(async snap => {
        const items = await Promise.all(
          snap.docs.map(async d => {
            const chat = { chatId: d.id, ...d.data() }
            // 게시글 정보 병합
            if (chat.postId) {
              const pSnap = await getDoc(doc(db, 'posts', chat.postId))
              chat.product = pSnap.exists() ? { id: pSnap.id, ...pSnap.data() } : null
            }
            return chat
          })
        )
        setPurchases(items)
      })
      .catch(err => console.error('[MyPage] 구매 내역 쿼리 실패:', err))
      .finally(() => setLoadingPurchases(false))
  }, [user?.uid, activeTab])

  const userName  = profile?.displayName || user?.displayName || '실뭉치'
  const userPhoto = profile?.photoURL    || user?.photoURL    || null
  const reviewCount = 0 // TODO: 실제 후기 수

  const TAB = [
    { key: 'sales',     label: '판매' },
    { key: 'purchases', label: '구매' },
  ]

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>

      {/* 헤더 */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 16px 14px',
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
          마이페이지
        </h1>
        <button
          onClick={() => navigate('/settings')}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <Settings size={22} color={C.text} strokeWidth={1.8} />
        </button>
      </header>

      <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 프로필 카드 */}
        <div style={{ background: C.white, borderRadius: 16, padding: '20px 20px 18px', position: 'relative' }}>
          <button
            onClick={() => navigate('/mypage/edit')}
            style={{
              position: 'absolute', top: 16, right: 16,
              border: 'none', background: 'transparent',
              cursor: 'pointer', padding: 4, display: 'flex',
            }}
          >
            <Pencil size={17} color={C.point} strokeWidth={1.8} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* 아바타 */}
            <div style={{
              width: 68, height: 68, borderRadius: '50%', flexShrink: 0,
              background: C.grayLight, overflow: 'hidden',
              border: `2.5px solid ${C.point}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34,
            }}>
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={userName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  referrerPolicy="no-referrer"
                />
              ) : '🧶'}
            </div>

            {/* 닉네임 + 후기 */}
            <div style={{ flex: 1, paddingRight: 24 }}>
              <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
                {userName}
              </p>
              <button
                onClick={() => navigate('/mypage/reviews')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  border: 'none', background: 'transparent', padding: 0,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {reviewCount > 0 ? (
                  <>
                    <Star size={14} color={C.point} fill={C.point} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>5.0</span>
                    <span style={{ fontSize: 13, color: C.gray }}>· 후기 {reviewCount}개</span>
                    <span style={{ fontSize: 12, color: C.gray, marginLeft: 1 }}>›</span>
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: C.gray, letterSpacing: '-0.01em' }}>
                    첫 거래를 시작해보세요!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 판매 / 구매 탭 */}
        <section>
          {/* 탭 헤더 */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderBottom: `2px solid ${C.border}` }}>
            {TAB.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  flex: 1, padding: '10px 0',
                  border: 'none', background: 'transparent',
                  fontFamily: 'inherit', cursor: 'pointer',
                  fontSize: 15, fontWeight: activeTab === t.key ? 800 : 500,
                  color: activeTab === t.key ? C.text : C.gray,
                  borderBottom: `2px solid ${activeTab === t.key ? C.text : 'transparent'}`,
                  marginBottom: -2,
                  letterSpacing: '-0.02em',
                  transition: 'color 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          {activeTab === 'sales'
            ? <SalesTab myPosts={myPosts} />
            : <PurchasesTab purchases={purchases} loadingPurchases={loadingPurchases} />
          }
        </section>

        {/* 바로가기 메뉴 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <MenuRow label="질문방 활동" onClick={() => navigate(`/user/${user?.uid ?? 'me'}`)} />
          <MenuRow label="공지사항"    onClick={() => navigate('/notices')} />
        </div>

      </div>
    </div>
  )
}

function MenuRow({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'transparent', padding: '10px 0',
        border: 'none', borderBottom: `1px solid ${C.border}`,
        cursor: 'pointer', fontFamily: 'inherit', width: '100%',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
        {label}
      </span>
      <span style={{ fontSize: 18, color: C.text, lineHeight: 1 }}>›</span>
    </button>
  )
}
