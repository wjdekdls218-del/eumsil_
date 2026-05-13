import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { C, FONT } from '../theme'
import { db } from '../firebase'
import { usePosts } from '../context/PostsContext'
import { useNotifications } from '../context/NotificationsContext'

// ─── 아이콘 ───────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const BubbleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
)

const LocationIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

// ─── SearchBar ────────────────────────────────────────────────
function SearchBar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: C.white, borderRadius: 999,
      padding: '11px 16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    }}>
      <span style={{ color: C.gray, display: 'flex', flexShrink: 0 }}>
        <SearchIcon />
      </span>
      <input
        type="search"
        placeholder="뜨개 재료를 검색해보세요"
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontSize: 14, color: C.text, width: '100%',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

// ─── FilterTabs ───────────────────────────────────────────────
function FilterTabs({ filter, onChange }) {
  const tabs = [
    { key: 'all',   label: '전체' },
    { key: 'share', label: '나눠보기' },
    { key: 'sell',  label: '실 올리기' },
  ]
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {tabs.map(tab => {
        const active = filter === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              borderRadius: 999, padding: '7px 20px',
              fontSize: 13, fontWeight: active ? 700 : 400,
              border: active ? 'none' : `1.5px solid ${C.border}`,
              background: active ? C.point : C.white,
              color: active ? C.white : C.text,
              cursor: 'pointer', transition: 'all 0.15s ease',
              fontFamily: 'inherit', letterSpacing: '-0.01em',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── ShareCard ────────────────────────────────────────────────
function ShareCard({ item }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/product/${item.id}`)}
      style={{
        flexShrink: 0, width: 148,
        background: C.white, borderRadius: 16,
        overflow: 'hidden', cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        transition: 'transform 0.15s ease',
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{ position: 'relative' }}>
        <img src={item.imageUrl || item.image} alt={item.title}
          style={{ width: '100%', height: 136, objectFit: 'cover', display: 'block' }} />
        <span style={{
          position: 'absolute', top: 8, left: 8,
          background: C.point, color: C.white,
          fontSize: 10, fontWeight: 700,
          borderRadius: 999, padding: '3px 8px',
        }}>
          나눔
        </span>
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 600, color: C.text,
          lineHeight: 1.45, letterSpacing: '-0.01em',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {item.title}
        </p>
        <p style={{ margin: '5px 0 0', fontSize: 11, color: C.gray, display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 600, color: C.text, flexShrink: 0 }}>{item.nickname ?? item.seller?.name ?? '익명'}</span>
          <span style={{ color: C.border, flexShrink: 0 }}>·</span>
          <LocationIcon />{item.region}
        </p>
      </div>
    </div>
  )
}

// ─── ShareSection ─────────────────────────────────────────────
function ShareSection({ items }) {
  if (!items.length) return null
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '0 16px' }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          🧶 지금 나눔 중이에요
        </h2>
        <span style={{ fontSize: 12, color: C.gray, cursor: 'pointer' }}>더보기</span>
      </div>
      <div className="hide-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 16px 8px' }}>
        {items.map(item => <ShareCard key={item.id} item={item} />)}
      </div>
    </section>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    '나눔':   { bg: C.point,    color: C.white },
    '판매중': { bg: C.text,     color: C.white },
    '예약중': { bg: '#9E9E9E',  color: C.white },
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

// ─── LatestCard ───────────────────────────────────────────────
function LatestCard({ item }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/product/${item.id}`)}
      style={{
        display: 'flex', gap: 14,
        background: C.white, borderRadius: 16,
        padding: '14px', cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        alignItems: 'center',
        transition: 'transform 0.15s ease',
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <img src={item.imageUrl || item.image} alt={item.title}
        style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: '0 0 5px', fontSize: 14, fontWeight: 600, color: C.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}>
          {item.title}
        </p>
        <p style={{
          margin: '0 0 5px', fontSize: 14, fontWeight: 700,
          color: item.type === 'share' ? C.point : C.text,
          letterSpacing: '-0.01em',
        }}>
          {item.type === 'share' ? '나눔' : `${item.price.toLocaleString()}원`}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: C.gray, display: 'flex', alignItems: 'center', gap: 3 }}>
          {item.profileImage && (
            <img
              src={item.profileImage}
              alt=""
              style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              referrerPolicy="no-referrer"
            />
          )}
          <span style={{ fontWeight: 600, color: C.text }}>{item.nickname ?? item.seller?.name ?? '익명'}</span>
          <span style={{ color: C.border }}>·</span>
          <LocationIcon />{item.region}
        </p>
      </div>
      <div style={{ flexShrink: 0 }}>
        <StatusBadge status={item.status} />
      </div>
    </div>
  )
}

// ─── LatestSection ────────────────────────────────────────────
function LatestSection({ items }) {
  return (
    <section style={{ padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          최신 등록
        </h2>
        <span style={{ fontSize: 12, color: C.gray, cursor: 'pointer' }}>더보기</span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: C.gray, fontSize: 14, background: C.white, borderRadius: 16 }}>
          해당 카테고리 상품이 없어요
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => <LatestCard key={item.id} item={item} />)}
        </div>
      )}
    </section>
  )
}

// ─── FAQSection ───────────────────────────────────────────────
function FAQSection({ items }) {
  const navigate = useNavigate()
  return (
    <section style={{ padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          💬 이런 질문 많아요
        </h2>
        <span style={{ fontSize: 12, color: C.gray, cursor: 'pointer' }}>더보기</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => navigate(`/community/${item.id}`)}
            style={{
              background: C.white, borderRadius: 16, padding: '16px',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14,
            }}
          >
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.text, flex: 1, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              {item.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, color: C.point }}>
              <BubbleIcon />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{item.answerCount}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── NoticePopup ──────────────────────────────────────────────
function NoticePopup({ notice, onClose, onDismissToday, onGoTo }) {
  const previewLine = (notice.content || notice.body || '').split('\n')[0]
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 270, background: '#FFFFFF',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        fontFamily: FONT,
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 14px 0' }}>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }}>
            <X size={20} color="#9E9E9E" strokeWidth={2} />
          </button>
        </div>
        <div style={{ padding: '8px 20px 24px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
            {notice.title}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {previewLine}
          </p>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid #F0F0F0' }}>
          <button
            onClick={onDismissToday}
            style={{
              flex: 1, padding: '14px 0', border: 'none', background: 'transparent',
              fontSize: 13, color: '#9E9E9E', cursor: 'pointer', fontFamily: FONT,
              borderRight: '1px solid #F0F0F0',
            }}
          >
            오늘 하루 보지 않기
          </button>
          <button
            onClick={onGoTo}
            style={{
              flex: 1, padding: '14px 0', border: 'none', background: 'transparent',
              fontSize: 14, fontWeight: 700, color: C.point, cursor: 'pointer', fontFamily: FONT,
            }}
          >
            보러가기
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Home ─────────────────────────────────────────────────────
export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { posts } = usePosts()
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()
  const filter = searchParams.get('filter') || 'all'
  const [popup, setPopup] = useState(null)
  const [faqItems, setFaqItems] = useState([])

  // 인기 질문 로드 (점수 = answerCount×0.5 + likes×0.5)
  useEffect(() => {
    getDocs(collection(db, 'community'))
      .then(snap => {
        const scored = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .map(item => ({
            ...item,
            score: (item.answerCount ?? 0) * 0.5 + (item.likes ?? 0) * 0.5,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 2)
        setFaqItems(scored)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const now = new Date()
    const todayKey = `popup_dismiss_${now.toISOString().slice(0, 10)}`
    console.log('[팝업] todayKey:', todayKey, '/ dismissed:', !!localStorage.getItem(todayKey))
    if (localStorage.getItem(todayKey)) return

    getDocs(collection(db, 'notices'))
      .then(snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        console.log('[팝업] 전체 notices:', all.length, '개', all.map(n => ({ id: n.id, title: n.title, showPopup: n.showPopup, popupStart: n.popupStart, popupEnd: n.popupEnd })))

        const withPopup = all.filter(n => n.showPopup === true)
        console.log('[팝업] showPopup:true 공지:', withPopup.length, '개', withPopup.map(n => n.title))

        const active = withPopup.find(n => {
          const start = n.popupStart?.toDate?.() ?? null
          const end   = n.popupEnd?.toDate?.() ?? null
          console.log(`[팝업] "${n.title}" → start:${start}, end:${end}, now:${now}, 통과:${!(start && now < start) && !(end && now > end)}`)
          if (start && now < start) return false
          if (end && now > end) return false
          return true
        })
        console.log('[팝업] 최종 선택된 공지:', active?.title ?? '없음')
        if (active) setPopup(active)
      })
      .catch(err => console.error('[팝업] Firestore 로드 실패:', err))
  }, [])

  const handleFilter = (next) => {
    setSearchParams({ filter: next })
  }

  const filteredLatest = posts.filter(item => {
    if (filter === 'share') return item.type === 'share'
    if (filter === 'sell')  return item.type === 'sell'
    return true
  })

  const shareItems = posts.filter(p => p.type === 'share').slice(0, 5)
  const showShare  = filter !== 'sell' && shareItems.length > 0
  const showFAQ    = filter === 'all' && faqItems.length > 0

  const handleDismissToday = () => {
    const key = `popup_dismiss_${new Date().toISOString().slice(0, 10)}`
    localStorage.setItem(key, '1')
    setPopup(null)
  }

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto', minHeight: '100dvh',
      background: C.bg, fontFamily: FONT, position: 'relative',
    }}>
      {/* 스티키 헤더 */}
      <header style={{
        position: 'sticky', top: 0, background: C.bg, zIndex: 50,
        padding: '16px 16px 12px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
            이음실<span style={{ color: C.point }}>.</span>
          </span>
          <button
            onClick={() => navigate('/notifications')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', position: 'relative' }}
          >
            <Bell size={22} color={C.text} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 8, height: 8, borderRadius: '50%',
                background: '#E53E3E',
                border: `1.5px solid ${C.bg}`,
              }} />
            )}
          </button>
        </div>
        <SearchBar />
        <FilterTabs filter={filter} onChange={handleFilter} />
      </header>

      {/* 콘텐츠 */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingTop: 8, paddingBottom: 110 }}>
        {showShare && <ShareSection items={shareItems} />}
        <LatestSection items={filteredLatest} />
        {showFAQ && <FAQSection items={faqItems} />}
      </main>

      {popup && (
        <NoticePopup
          notice={popup}
          onClose={() => setPopup(null)}
          onDismissToday={handleDismissToday}
          onGoTo={() => { setPopup(null); navigate(`/notices?id=${popup.id}`) }}
        />
      )}
    </div>
  )
}
