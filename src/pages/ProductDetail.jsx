import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { C, FONT } from '../theme'
import { db } from '../firebase'

function StatusBadge({ status }) {
  const map = {
    '나눔':   { bg: C.point,   color: C.white },
    '판매중': { bg: C.text,    color: C.white },
    '예약중': { bg: '#9E9E9E', color: C.white },
    '완료':   { bg: '#DDD5CB', color: '#9E9E9E' },
  }
  const s = map[status] ?? map['판매중']
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 999,
      fontSize: 12, fontWeight: 700, background: s.bg, color: s.color,
      letterSpacing: '-0.01em',
    }}>
      {status}
    </span>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'posts', id))
        if (snap.exists()) setProduct({ id: snap.id, ...snap.data() })
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) {
    return (
      <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.gray, fontSize: 14 }}>불러오는 중...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>게시글을 찾을 수 없어요</p>
        <button onClick={() => navigate('/')} style={{ border: 'none', background: C.point, color: C.white, borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          홈으로
        </button>
      </div>
    )
  }

  const imageUrl = product.imageUrl || product.image
  const date = product.createdAt?.toDate().toLocaleDateString('ko-KR') ?? ''

  return (
    <div style={{
      maxWidth: 390, margin: '0 auto', minHeight: '100dvh',
      background: C.bg, fontFamily: FONT,
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
    }}>

      {/* 상품 이미지 + 뒤로가기 */}
      <div style={{ position: 'relative' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', aspectRatio: '1 / 1', background: C.grayLight }} />
        )}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 16, left: 16,
            width: 38, height: 38, borderRadius: 999,
            background: 'rgba(255,255,255,0.92)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <ArrowLeft size={20} color={C.text} strokeWidth={2} />
        </button>
      </div>

      {/* 본문 */}
      <div style={{ background: C.white, borderRadius: '0 0 24px 24px', overflow: 'hidden' }}>

        {/* 판매자 프로필 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 999, flexShrink: 0,
            background: C.grayLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            🧶
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
              {product.seller?.name ?? '실뭉치'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.gray }}>
              {product.region}
            </p>
          </div>
        </div>

        <div style={{ height: 1, background: C.border, margin: '0 20px' }} />

        {/* 상품 정보 */}
        <div style={{ padding: '20px 20px 24px' }}>
          <p style={{
            margin: '0 0 10px',
            fontSize: 18, fontWeight: 700, color: C.text,
            lineHeight: 1.4, letterSpacing: '-0.02em',
          }}>
            {product.title}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              fontSize: 20, fontWeight: 800,
              color: product.type === 'share' ? C.point : C.text,
              letterSpacing: '-0.02em',
            }}>
              {product.type === 'share' ? '나눔' : `${Number(product.price).toLocaleString()}원`}
            </span>
            <StatusBadge status={product.status} />
          </div>

          {product.description ? (
            <p style={{
              margin: '0 0 20px',
              fontSize: 14, color: '#4A4A4A',
              lineHeight: 1.75, letterSpacing: '-0.01em',
            }}>
              {product.description}
            </p>
          ) : null}

          {date ? (
            <p style={{ margin: 0, fontSize: 12, color: C.gray }}>등록일 {date}</p>
          ) : null}
        </div>
      </div>

      {/* 하단 고정 바 */}
      <div style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390,
        background: C.white,
        borderTop: `1px solid ${C.border}`,
        padding: '12px 20px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
        zIndex: 100,
      }}>
        <span style={{
          fontSize: 20, fontWeight: 800,
          color: product.type === 'share' ? C.point : C.text,
          letterSpacing: '-0.02em',
        }}>
          {product.type === 'share' ? '나눔' : `${Number(product.price).toLocaleString()}원`}
        </span>
        <button
          onClick={() => navigate(`/chat/${product.id}`)}
          disabled={product.status === '완료'}
          style={{
            background: product.status === '완료' ? '#DDD5CB' : C.point,
            color: product.status === '완료' ? C.gray : C.white,
            border: 'none', borderRadius: 999,
            padding: '13px 36px',
            fontSize: 15, fontWeight: 700,
            cursor: product.status === '완료' ? 'default' : 'pointer',
            fontFamily: 'inherit', letterSpacing: '-0.01em',
            transition: 'background 0.15s ease',
          }}
        >
          {product.status === '완료' ? '거래 완료' : '채팅하기'}
        </button>
      </div>
    </div>
  )
}
