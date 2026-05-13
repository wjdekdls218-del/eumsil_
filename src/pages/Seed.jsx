import { useState } from 'react'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { C, FONT } from '../theme'

const ADJECTIVES = ['따뜻한', '포근한', '보송한', '폭신한', '나긋한', '부드러운']
const NOUNS      = ['고양이', '실뭉치', '바늘', '스웨터', '목도리', '장갑']
const randNick   = () =>
  `뜨개${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]}${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`

function buildData(uid) {
  const now = Timestamp.now()

  const posts = [
    {
      uid, nickname: randNick(), type: 'share', status: 'available', category: '실',
      title: '코튼 여름실 40g 아이보리',
      description: '색감이 맑은 아이보리 실이에요. 스와치 작업해보기 딱 좋은 양이고, 여름 소품이나 가벼운 작업에 잘 어울려요.',
      location: '마포구',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      createdAt: now,
    },
    {
      uid, nickname: randNick(), type: 'share', status: 'available', category: '실',
      title: '메리노울 실 50g 레드',
      description: '토마토같은 선명한 레드 컬러예요. 메리노울 특유의 부드러운 촉감이 좋아서 가을 소품에 잘 어울려요.',
      location: '원미구',
      imageUrl: 'https://images.unsplash.com/photo-1604537466158-719b1972feb8?w=400',
      createdAt: now,
    },
    {
      uid, nickname: randNick(), type: 'share', status: 'available', category: '실',
      title: '모헤어 30g 민트',
      description: '헤어감이 적당해서 거슬리지 않아요. 민트 색상이 은은하게 살아있고 얇은 소품 작업에 좋아요.',
      location: '강서구',
      imageUrl: 'https://images.unsplash.com/photo-1585914924626-c1e7e4f9b9c8?w=400',
      createdAt: now,
    },
    {
      uid, nickname: randNick(), type: 'share', status: 'available', category: '실',
      title: '알파카 혼방 실 베이지 50g',
      description: '알파카 특유의 보송보송한 느낌이 살아있어요. 겨울 소품에 잘 어울리는 따뜻한 베이지 색상이에요.',
      location: '서대문구',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
      createdAt: now,
    },
    {
      uid, nickname: randNick(), type: 'sell', status: 'available', category: '도구',
      title: '대바늘 3개 세트',
      description: '4mm, 4.5mm, 5mm 세트예요. 가장 자주 쓰이는 두께의 바늘로 구성했어요. 사용감 있지만 깨끗하게 관리했어요.',
      price: 12000, location: '마포구',
      imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400',
      createdAt: now,
    },
    {
      uid, nickname: randNick(), type: 'sell', status: 'available', category: '실',
      title: '멜란지 그레이 울 콘사 120g',
      description: '멜란지 그레이 색상이 오묘하게 예뻐요. 콘사라 양이 넉넉하고 니트나 가방 작업에 좋아요.',
      price: 10000, location: '원미구',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
      createdAt: now,
    },
    {
      uid, nickname: randNick(), type: 'sell', status: 'available', category: '도구',
      title: '코바늘 5호 새 상품',
      description: '포장만 뜯은 새상품이에요. 5호는 입문자에게도 딱 좋은 사이즈예요.',
      price: 8000, location: '강서구',
      imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400',
      createdAt: now,
    },
  ]

  const community = (() => {
    const items = [
      { category: '실',  title: '세탁매직이 뭔가요?',    body: '뜨개 커뮤니티에서 세탁매직이라는 말을 자주 보는데 정확히 어떤 건지 모르겠어요. 어떻게 하는 건가요?' },
      { category: '도구', title: '얀홀더 추천해주세요',   body: '실 뭉치가 막 굴러다녀서 얀홀더 하나 사려고 하는데요. 사용해보신 분들 추천 부탁드려요!' },
      { category: '도안', title: '뜨개질 약어 알려주세요', body: '도안 보다보면 k, p, yo, ssk 같은 약어가 나오는데 정리된 자료가 있을까요? 초보라 어렵네요ㅠ' },
    ]
    return items.map(({ category, title, body }) => {
      const nickname = randNick()
      return { uid, nickname, author: { id: uid, name: nickname }, isAnonymous: true, category, title, body, likes: 0, answerCount: 0, createdAt: now }
    })
  })()

  return { posts, community }
}

export default function Seed() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [log, setLog]       = useState([])
  const [running, setRunning] = useState(false)
  const [done, setDone]     = useState(false)

  const append = (msg) => setLog(prev => [...prev, msg])

  const run = async () => {
    if (!user) { alert('로그인이 필요해요.'); return }
    setRunning(true)
    setLog([])
    setDone(false)

    const { posts, community } = buildData(user.uid)

    try {
      for (const data of posts) {
        const ref = await addDoc(collection(db, 'posts'), data)
        append(`✓ posts/${ref.id}  "${data.title}"`)
      }
      for (const data of community) {
        const ref = await addDoc(collection(db, 'community'), data)
        append(`✓ community/${ref.id}  "${data.title}"`)
      }
      append('─────────────────────────')
      append('✅ 완료! 총 10개 문서 삽입')
      setDone(true)
    } catch (err) {
      append(`❌ 오류: ${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, padding: '48px 20px 40px' }}>
      <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.gray, fontSize: 13, marginBottom: 24, padding: 0 }}>
        ← 뒤로
      </button>

      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>더미 데이터 삽입</h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: C.gray }}>
        {user ? `uid: ${user.uid}` : '로그인 필요'}
      </p>

      <button
        onClick={run}
        disabled={running || done || !user}
        style={{
          width: '100%', padding: '14px', borderRadius: 999,
          border: 'none', cursor: running || done || !user ? 'default' : 'pointer',
          background: done ? C.gray : C.point,
          color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
          letterSpacing: '-0.02em', marginBottom: 20,
        }}
      >
        {running ? '삽입 중...' : done ? '완료됨' : '삽입 시작'}
      </button>

      {log.length > 0 && (
        <div style={{
          background: '#1a1a2e', borderRadius: 12, padding: '16px',
          fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7,
          color: '#b8f5b0', overflowX: 'auto',
        }}>
          {log.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}
    </div>
  )
}
