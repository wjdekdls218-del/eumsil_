import { useNavigate } from 'react-router-dom'
import { Settings, Star, ChevronRight } from 'lucide-react'
import { C, FONT } from '../theme'

const MY_USER = { id: 'me', name: '실뭉치', avatar: '🧶', rating: 4.8, reviewCount: 12 }

const MY_POSTS = [
  { id: 101, title: '메리노울 핑크 50g',    type: 'sell',  price: 5000,  status: '판매중' },
  { id: 102, title: '코바늘 세트 미사용',   type: 'share', price: 0,     status: '나눔'   },
  { id: 103, title: '베이지 아크릴 100g',   type: 'sell',  price: 3000,  status: '예약중' },
  { id: 104, title: '대바늘 4mm 클로버',    type: 'sell',  price: 4500,  status: '판매중' },
]

const STATUS_STYLE = {
  '판매중': { bg: C.text,    color: C.white },
  '나눔':   { bg: C.point,   color: C.white },
  '예약중': { bg: '#9E9E9E', color: C.white },
}

export default function MyPage() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>
      {/* Header */}
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
        {/* Profile card */}
        <div style={{ background: C.white, borderRadius: 16, padding: '20px 20px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Avatar */}
          <div style={{
            width: 68, height: 68, borderRadius: '50%', flexShrink: 0,
            background: C.grayLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, border: `2.5px solid ${C.point}`,
          }}>
            {MY_USER.avatar}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
              {MY_USER.name}
            </p>
            <button
              onClick={() => navigate('/mypage/reviews')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                border: 'none', background: 'transparent', padding: 0,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Star size={14} color={C.point} fill={C.point} />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{MY_USER.rating}</span>
              <span style={{ fontSize: 13, color: C.gray }}>· 후기 {MY_USER.reviewCount}개</span>
              <span style={{ fontSize: 12, color: C.gray, marginLeft: 1 }}>›</span>
            </button>
          </div>
        </div>

        {/* My posts */}
        <section>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
            내 게시글
          </h2>
          <div style={{ background: C.white, borderRadius: 16, overflow: 'hidden' }}>
            {MY_POSTS.map((item, idx) => {
              const s = STATUS_STYLE[item.status]
              return (
                <div key={item.id}>
                  <div
                    onClick={() => navigate(`/product/${item.id}`)}
                    style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <span style={{
                      fontSize: 14, fontWeight: 600, color: C.text,
                      letterSpacing: '-0.01em', flexShrink: 1, minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.type === 'share' ? C.point : C.gray, flexShrink: 0 }}>
                      {item.type === 'share' ? '나눔' : `${item.price.toLocaleString()}원`}
                    </span>
                    <span style={{
                      marginLeft: 'auto', flexShrink: 0,
                      padding: '2px 8px', borderRadius: 999,
                      fontSize: 11, fontWeight: 700, background: s.bg, color: s.color,
                    }}>
                      {item.status}
                    </span>
                  </div>
                  {idx < MY_POSTS.length - 1 && (
                    <div style={{ height: 1, background: C.border, margin: '0 16px' }} />
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Community activity */}
        <button
          onClick={() => navigate(`/user/${MY_USER.id}`)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'transparent', padding: '4px 0',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
            질문방 활동
          </span>
          <ChevronRight size={18} color={C.text} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
