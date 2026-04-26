import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { C, FONT } from '../theme'

// ─── 더미 상품 데이터 ─────────────────────────────────────────
const PRODUCTS = {
  1: {
    id: 1, title: '메리노울 실 100g 핑크', type: 'share', price: 0,
    region: '마포구', status: '나눔',
    image: 'https://picsum.photos/seed/knit11/600/600',
    seller: { name: '실뭉치언니', avatar: 'https://picsum.photos/seed/user1/100/100', region: '마포구' },
    description: '메리노울 100% 핑크 실이에요. 미개봉 새 제품입니다. 색상이 예뻐서 구매했는데 다른 프로젝트에 집중하게 되어 나눔합니다. 손에 부드럽고 발색이 좋아요. 원하시는 분 가져가세요!',
    date: '2026.04.24',
  },
  2: {
    id: 2, title: '코바늘 세트 5종', type: 'share', price: 0,
    region: '서초구', status: '나눔',
    image: 'https://picsum.photos/seed/knit22/600/600',
    seller: { name: '뜨개마녀', avatar: 'https://picsum.photos/seed/user2/100/100', region: '서초구' },
    description: '코바늘 5종 세트입니다. 2mm · 3mm · 4mm · 5mm · 6mm 구성이에요. 입문자분들 입문용으로 딱 좋고, 원하시면 초보용 도안 책도 같이 드릴 수 있어요.',
    date: '2026.04.23',
  },
  3: {
    id: 3, title: '아이보리 면사 200g', type: 'share', price: 0,
    region: '강남구', status: '나눔',
    image: 'https://picsum.photos/seed/knit33/600/600',
    seller: { name: '홈니팅', avatar: 'https://picsum.photos/seed/user3/100/100', region: '강남구' },
    description: '여름용 면사 아이보리 컬러 200g입니다. 핸드워시 권장이고, 가볍고 통기성이 좋아서 여름 소품 뜨기에 딱이에요. 반쯤 사용한 실이라 양을 감안해 나눔합니다.',
    date: '2026.04.22',
  },
  4: {
    id: 4, title: '뜨개 도안 모음집', type: 'share', price: 0,
    region: '종로구', status: '완료',
    image: 'https://picsum.photos/seed/knit44/600/600',
    seller: { name: '니트할머니', avatar: 'https://picsum.photos/seed/user4/100/100', region: '종로구' },
    description: '대바늘·코바늘 도안이 섞인 모음집 두 권입니다. 소품부터 스웨터까지 다양하게 수록되어 있어요. 이미 다 참고해서 상태는 보통이지만 내용은 알차요.',
    date: '2026.04.21',
  },
  5: {
    id: 5, title: '모헤어 혼방 흰색 실', type: 'share', price: 0,
    region: '용산구', status: '나눔',
    image: 'https://picsum.photos/seed/knit55/600/600',
    seller: { name: '털실러버', avatar: 'https://picsum.photos/seed/user5/100/100', region: '용산구' },
    description: '모헤어 50% 아크릴 50% 혼방 실입니다. 보송보송한 감촉이 매력적이에요. 흰색이라 어디에나 잘 어울립니다. 소량 남아있어 필요하신 분 가져가세요.',
    date: '2026.04.20',
  },
  10: {
    id: 10, title: '알파카 혼방 실 베이지', type: 'sell', price: 8000,
    region: '성동구', status: '판매중',
    image: 'https://picsum.photos/seed/knit10/600/600',
    seller: { name: '알파카팜', avatar: 'https://picsum.photos/seed/user10/100/100', region: '성동구' },
    description: '알파카 30% 울 70% 혼방 실입니다. 베이지 컬러로 어떤 소품에도 잘 어울려요. 100g 한 볼이고 미개봉 새 제품입니다. 직거래 가능하고 택배 거래도 돼요. (택배비 별도)',
    date: '2026.04.24',
  },
  11: {
    id: 11, title: '대바늘 7mm 2쌍 거의 새것', type: 'share', price: 0,
    region: '마포구', status: '나눔',
    image: 'https://picsum.photos/seed/knit66/600/600',
    seller: { name: '니팅데이즈', avatar: 'https://picsum.photos/seed/user11/100/100', region: '마포구' },
    description: '7mm 대바늘 2쌍입니다. 한 번 써보고 대바늘이 안 맞아서 코바늘로 전향했어요. 거의 새것이라 상태 매우 좋습니다. 뜨개 입문자분께 드리고 싶어요.',
    date: '2026.04.23',
  },
  12: {
    id: 12, title: '코바늘 5/0호 미개봉', type: 'sell', price: 3500,
    region: '강서구', status: '예약중',
    image: 'https://picsum.photos/seed/knit77/600/600',
    seller: { name: '코바늘요정', avatar: 'https://picsum.photos/seed/user12/100/100', region: '강서구' },
    description: '클로버 코바늘 5/0호 미개봉 제품입니다. 편안한 그립감으로 유명한 제품이에요. 실수로 두 개 구매해서 판매합니다. 정가 7,500원짜리 반값에 드려요.',
    date: '2026.04.22',
  },
  13: {
    id: 13, title: '손뜨개 가방 키트 세트', type: 'sell', price: 15000,
    region: '은평구', status: '판매중',
    image: 'https://picsum.photos/seed/knit88/600/600',
    seller: { name: '백짜랑', avatar: 'https://picsum.photos/seed/user13/100/100', region: '은평구' },
    description: '코바늘 버킷백 키트 세트입니다. 실 · 바늘 · 도안 · 손잡이까지 모두 포함되어 있어요. 선물 받았는데 이미 비슷한 키트가 있어서 판매해요. 미개봉 새 제품입니다.',
    date: '2026.04.21',
  },
  14: {
    id: 14, title: '연두 울실 50g', type: 'share', price: 0,
    region: '서대문구', status: '나눔',
    image: 'https://picsum.photos/seed/knit99/600/600',
    seller: { name: '초록뜨개', avatar: 'https://picsum.photos/seed/user14/100/100', region: '서대문구' },
    description: '봄봄한 연두 울실 50g입니다. 스웨터 프로젝트 남은 실이에요. 양이 많지 않아 소품이나 포인트로 쓰기 좋아요. 가져가실 분 댓글 주세요!',
    date: '2026.04.20',
  },
  15: {
    id: 15, title: '터키쉬 코튼 블루 100g', type: 'sell', price: 6500,
    region: '노원구', status: '판매중',
    image: 'https://picsum.photos/seed/knit100/600/600',
    seller: { name: '수입실창고', avatar: 'https://picsum.photos/seed/user15/100/100', region: '노원구' },
    description: '터키산 코튼 100% 파란색 실입니다. 여름용 가방이나 모자 뜨기에 딱 좋아요. 광택이 은은하고 발색이 굉장히 예쁩니다. 100g 한 볼이에요. 직거래·택배 모두 가능합니다.',
    date: '2026.04.19',
  },
}

const FALLBACK = {
  id: 0, title: '상품 정보', type: 'sell', price: 10000,
  region: '서울', status: '판매중',
  image: 'https://picsum.photos/seed/default/600/600',
  seller: { name: '판매자', avatar: 'https://picsum.photos/seed/defaultuser/100/100', region: '서울' },
  description: '상품 설명이 없습니다.',
  date: '2026.04.01',
}

// ─── 상태 뱃지 ────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    '나눔':   { bg: C.point,    color: C.white },
    '판매중': { bg: C.text,     color: C.white },
    '예약중': { bg: '#9E9E9E',  color: C.white },
    '완료':   { bg: '#DDD5CB',  color: '#9E9E9E' },
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

// ─── ProductDetail ────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = PRODUCTS[Number(id)] ?? FALLBACK

  return (
    <div style={{
      maxWidth: 390, margin: '0 auto', minHeight: '100dvh',
      background: C.bg, fontFamily: FONT,
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
    }}>

      {/* 상품 이미지 + 뒤로가기 */}
      <div style={{ position: 'relative' }}>
        <img
          src={product.image}
          alt={product.title}
          style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
        />
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
          <img
            src={product.seller.avatar}
            alt={product.seller.name}
            style={{ width: 44, height: 44, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }}
          />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
              {product.seller.name}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.gray }}>
              {product.seller.region}
            </p>
          </div>
        </div>

        {/* 구분선 */}
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
              {product.type === 'share' ? '나눔' : `${product.price.toLocaleString()}원`}
            </span>
            <StatusBadge status={product.status} />
          </div>

          <p style={{
            margin: '0 0 20px',
            fontSize: 14, color: '#4A4A4A',
            lineHeight: 1.75, letterSpacing: '-0.01em',
          }}>
            {product.description}
          </p>

          <p style={{ margin: 0, fontSize: 12, color: C.gray }}>
            등록일 {product.date}
          </p>
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
          {product.type === 'share' ? '나눔' : `${product.price.toLocaleString()}원`}
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
