/**
 * 이음실 더미 데이터 삽입 스크립트
 *
 * 사용법:
 *   node scripts/seed.cjs                  → 게시글 + 커뮤니티 전체 삽입
 *   node scripts/seed.cjs posts            → 게시글만
 *   node scripts/seed.cjs community        → 커뮤니티만
 *   node scripts/seed.cjs clear            → 더미 데이터 전체 삭제
 *   node scripts/seed.cjs clear posts      → 더미 게시글만 삭제
 *   node scripts/seed.cjs clear community  → 더미 커뮤니티 글만 삭제
 *
 * 삭제는 isSeedDoc: true 인 문서만 지운다. 직접 작성한 글은 이 플래그가 없어 안전하다.
 *
 * 데이터 수정: 아래 POSTS, COMMUNITY_POSTS 배열을 직접 편집하세요.
 */

const https  = require('https')
const fs     = require('fs')
const os     = require('os')
const path   = require('path')

const PROJECT  = 'eumsil-ab852'
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

// ──────────────────────────────────────────
// 작성자 정보 (기존 계정과 동일하게)
// ──────────────────────────────────────────
const AUTHOR = {
  uid:      'DQzMIO7t3iUfPvHbzQOWXZSC5SO2',
  nickname: '애치치',
  region:   '서울 마포구',
}

// ──────────────────────────────────────────
// 게시글 데이터 (자유롭게 수정하세요)
//
// [주의] Write.jsx 의 유효성 검사와 반드시 맞출 것.
//  - category 는 'yarn'(실) 또는 'tool'(도구) 둘 중 하나 (필수)
//  - weight 는 g 단위 문자열 (필수)
//  - 50g 미만은 판매 불가, 나눔(share)만 가능 → Write.jsx 의 isSellLowWeight
// 이 조건을 어기면 수정 화면에서 저장 버튼이 활성화되지 않는다.
// ──────────────────────────────────────────
const POSTS = [
  {
    title:       '멜란지 그레이 울 콘사',
    type:        'sell',   // sell | share
    price:       10000,
    status:      '판매중', // 판매중 | 나눔 | 예약중
    category:    'yarn',
    weight:      '500',
    description: '멜란지 그레이 색상이 오묘하게 예뻐요. 콘사라 양이 넉넉하고 니트나 가방 작업에 좋아요. 거의 사용 안 하고 보관만 했어요.',
  },
  {
    title:       '민트 모헤어',
    type:        'share',
    price:       0,
    status:      '나눔',
    category:    'yarn',
    weight:      '25',
    description: '헤어감이 적당해서 거슬리지 않아요. 민트 색상이 은은하게 살아있고 얇은 소품 작업에 좋아요. 반 정도 사용했어요.',
  },
  {
    title:       '메리노울 실 레드',
    type:        'share',
    price:       0,
    status:      '나눔',
    category:    'yarn',
    weight:      '50',
    description: '토마토같은 선명한 레드 컬러예요. 메리노울 특유의 부드러운 촉감이 좋아서 가을 소품에 잘 어울려요.',
  },
  {
    // 코바늘 단품은 50g 미만이라 판매 불가 → 나눔으로
    title:       '코바늘 5호 새 상품',
    type:        'share',
    price:       0,
    status:      '나눔',
    category:    'tool',
    weight:      '15',
    description: '포장만 뜯은 새상품이에요. 선물받았는데 이미 갖고 있는 사이즈라 나눔해요. 5호는 입문자에게도 딱 좋아요.',
  },
  {
    title:       '코튼 여름실 아이보리',
    type:        'share',
    price:       0,
    status:      '나눔',
    category:    'yarn',
    weight:      '40',
    description: '색감이 맑은 아이보리 실이에요. 스와치 작업해보기 딱 좋은 양이고, 여름 소품이나 가벼운 작업에 잘 어울려요.',
  },
  {
    title:       '알파카 혼방 베이지 실',
    type:        'sell',
    price:       15000,
    status:      '판매중',
    category:    'yarn',
    weight:      '100',
    description: '알파카 30% 혼방이라 아주 부드럽고 따뜻해요. 베이지 컬러라 어떤 작업에도 잘 어울려요. 2볼 묶음으로 판매해요.',
  },
  {
    title:       '대바늘 세트 4~8호',
    type:        'sell',
    price:       12000,
    status:      '판매중',
    category:    'tool',
    weight:      '200',
    description: '4호, 5호, 6호, 7호, 8호 다섯 가지 세트예요. 각 사이즈 2개씩 구성이에요. 전반적으로 상태 좋고 깨끗해요.',
  },
  {
    title:       '울 그래니백 도안 + 실 세트',
    type:        'sell',
    price:       18000,
    status:      '판매중',
    category:    'yarn',
    weight:      '250',
    description: '직접 제작한 그래니백 도안이에요. 도안 PDF + 필요한 실까지 함께 드려요. 코바늘 4호 기준이고 초보자도 가능해요.',
  },
  {
    title:       '얀홀더 우드 원형',
    type:        'sell',
    price:       9000,
    status:      '판매중',
    category:    'tool',
    weight:      '150',
    description: '나무 소재 원형 얀홀더예요. 실이 굴러다니지 않게 잡아줘서 작업할 때 훨씬 편해요. 거의 새것이에요.',
  },
  {
    title:       '형광 핑크 코튼실',
    type:        'share',
    price:       0,
    status:      '나눔',
    category:    'yarn',
    weight:      '80',
    description: '여름에 충동구매 했다가 색이 너무 튀어서 못 쓰고 있어요ㅠ 과감한 작업 좋아하시는 분 가져가세요! 거의 다 있어요.',
  },
  {
    // 코바늘 단품은 50g 미만이라 판매 불가 → 나눔으로
    title:       '모사 코바늘 3호',
    type:        'share',
    price:       0,
    status:      '나눔',
    category:    'tool',
    weight:      '15',
    description: '클로버 제품이에요. 그립감 좋고 잘 미끄러지지 않아요. 3호라 세밀한 작업에 적합한데 저는 잘 안 쓰게 되네요.',
  },
  {
    title:       '램스울 크림 색상 1볼',
    type:        'share',
    price:       0,
    status:      '나눔',
    category:    'yarn',
    weight:      '50',
    description: '다른 작업하다 남은 1볼이에요. 양이 적지만 소품이나 스와치 작업엔 충분해요. 따뜻하고 포근한 실이에요.',
  },
  {
    // 링 마커 세트도 50g 미만이라 판매 불가 → 나눔으로
    title:       '링 마커 세트 20개',
    type:        'share',
    price:       0,
    status:      '나눔',
    category:    'tool',
    weight:      '20',
    description: '색깔별 링 마커 20개 세트예요. 코 수 세기에 필수인데 두 세트가 생겨서 나눔해요. 스테인리스라 튼튼해요.',
  },
  {
    title:       '뜨개 가방 키트 민트',
    type:        'sell',
    price:       22000,
    status:      '판매중',
    category:    'yarn',
    weight:      '300',
    description: '민트 색상 실 + 가방 도안 + 지퍼까지 풀 키트예요. 한 번도 시작 못 했어요. 새것 상태예요.',
  },
  {
    title:       '퍼 실 화이트 2볼',
    type:        'sell',
    price:       7000,
    status:      '예약중',
    category:    'yarn',
    weight:      '100',
    description: '폭신폭신한 퍼 실이에요. 인형이나 폰케이스 작업에 좋아요. 흰색이라 다양하게 활용 가능해요.',
  },
]

// ──────────────────────────────────────────
// 커뮤니티(질문방) 데이터
// ──────────────────────────────────────────
const COMMUNITY_POSTS = [
  {
    category:    '실',
    title:       '세탁매직이 뭔가요?',
    body:        '실 보다보면 세탁매직이 좋은 실이라고 하는데 어떤건지 모르겠어요!',
    content:     '뜨개 커뮤니티에서 세탁매직이라는 말을 자주 보는데 정확히 어떤 건지 모르겠어요. 어떻게 하는 건가요?',
  },
  {
    category:    '도안',
    title:       '뜨개질 약어 알려주세요',
    body:        '도안 보다보니까 ssk, SL1wyif 이런 약어가 있는데 어떻게 하는건가요?',
    content:     '도안 보다보면 k, p, yo, ssk 같은 약어가 나오는데 정리된 자료가 있을까요? 초보라 어렵네요ㅠ',
  },
  {
    category:    '도구',
    title:       '얀홀더 괜찮나요?',
    body:        '다들 얀홀더 사용하시는 것 같길래 혹해서.. 저도 하나 사볼까 해서요!',
    content:     '실 뭉치가 막 굴러다녀서 얀홀더 하나 사려고 하는데요. 사용해보신 분들 추천 부탁드려요!',
  },
  {
    category:    '초보질문',
    title:       '코 줍기가 너무 어려워요',
    body:        '소매 코 줍기를 할 때마다 구멍이 생기는 것 같아요. 코치해주실 분 계신가요?',
    content:     '니트 작업 중인데 소매 코 줍기에서 매번 막혀요. 구멍이 생기지 않게 하는 팁이 있을까요?',
  },
  {
    category:    '실',
    title:       '모헤어랑 다른 실 합사해도 되나요?',
    body:        '모헤어 단독으로 쓰기엔 얇은 것 같아서 다른 실이랑 합사해볼까 하는데요.',
    content:     '모헤어 단독 작업은 늘어지는 것 같더라고요. 울이나 코튼이랑 합사하면 느낌이 어떤가요? 경험해보신 분들 의견 부탁해요!',
  },
  {
    category:    '도안',
    title:       '비대칭 슬리브 도안 추천해주세요',
    body:        '한쪽 어깨가 드러나는 비대칭 니트 도안 찾고 있어요.',
    content:     '요즘 비대칭 슬리브 니트가 너무 예쁘더라고요. 초중급 정도 수준에서 해볼 만한 도안 추천 부탁드려요!',
  },
  {
    category:    '도구',
    title:       '줄바늘 브랜드 추천',
    body:        '줄바늘 처음 사려고 하는데 클로버랑 아디 중 뭐가 나을까요?',
    content:     '대바늘로 모자 작업하려고 줄바늘 구매하려는데 입문자한테는 어느 브랜드가 좋을까요? 가격 차이가 꽤 나더라고요.',
  },
  {
    category:    '초보질문',
    title:       '실 끝 처리 어떻게 하세요?',
    body:        '작업 끝내고 실 끝 정리할 때 자꾸 풀려서요ㅠ',
    content:     '작업 완성하고 나서 실 끝 처리를 돗바늘로 하는데 자꾸 빠지는 것 같아요. 더 단단하게 마무리하는 방법이 있을까요?',
  },
  {
    category:    '실',
    title:       '여름실 추천해주세요',
    body:        '코튼 말고 여름에 쓸 만한 실 있을까요?',
    content:     '여름 소품 작업하려고 하는데 코튼 외에도 시원하고 작업하기 좋은 실이 있는지 궁금해요. 리넨이나 뱀부 사용해보신 분들 어떠셨어요?',
  },
  {
    category:    '도안',
    title:       '무료 도안 사이트 알려주세요',
    body:        '유료 말고 무료로 좋은 도안 구할 수 있는 곳 있나요?',
    content:     '뜨개 시작한 지 얼마 안 됐는데 도안 사는 게 부담스러워요. 무료로 퀄리티 있는 도안 구할 수 있는 사이트나 채널 있으면 알려주세요!',
  },
]

// ──────────────────────────────────────────────
// 이 아래는 수정하지 않아도 됩니다
// ──────────────────────────────────────────────

function getToken() {
  const configPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json')
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  const refreshToken = config.tokens.refresh_token
  const clientId     = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
  const clientSecret = 'j9iVZfS8kkCEFUPaAeJV0sAi'

  return new Promise((resolve, reject) => {
    const body = `client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, (res) => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => resolve(JSON.parse(data).access_token))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function firestoreRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null
    const req = https.request({
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT}/databases/(default)/documents${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    }, (res) => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => resolve(JSON.parse(data)))
    })
    req.on('error', reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

function toFirestore(obj) {
  const fields = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && v.__type === 'timestamp') {
      fields[k] = { timestampValue: v.value }
    } else if (typeof v === 'string')  fields[k] = { stringValue: v }
    else if (typeof v === 'number' && Number.isInteger(v)) fields[k] = { integerValue: String(v) }
    else if (typeof v === 'number') fields[k] = { doubleValue: v }
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v }
    else if (Array.isArray(v)) fields[k] = { arrayValue: { values: v.map(i => ({ stringValue: i })) } }
  }
  return { fields }
}

// Firestore Timestamp 값 (REST API용)
function ts(offsetMinutes = 0) {
  return { __type: 'timestamp', value: new Date(Date.now() + offsetMinutes * 60 * 1000).toISOString() }
}

/**
 * Write.jsx 의 유효성 검사(isValid)를 그대로 옮긴 것.
 * REST API 로 직접 넣으면 폼 검증을 우회하게 되므로, 앱에서 수정·저장이
 * 불가능한 데이터가 DB 에 들어가는 걸 여기서 막는다.
 * Write.jsx 의 규칙이 바뀌면 이 함수도 같이 고칠 것.
 */
function validatePost(post) {
  const errors = []
  if (!post.title?.trim())        errors.push('title 없음')
  if (!post.description?.trim())  errors.push('description 없음')
  if (!['yarn', 'tool'].includes(post.category)) errors.push(`category 는 yarn/tool 이어야 함 (현재: ${post.category})`)
  if (!String(post.weight ?? '').trim())         errors.push('weight 없음')
  if (post.type === 'sell') {
    if (!post.price)                      errors.push('판매글인데 price 없음')
    if (parseFloat(post.weight) < 50)     errors.push(`50g 미만은 판매 불가 (현재 ${post.weight}g) → type 을 share 로`)
  }
  return errors
}

async function seedPosts(token) {
  // 삽입 전 전체 검증 — 하나라도 어긋나면 아무것도 넣지 않고 중단
  const invalid = POSTS
    .map(p => ({ title: p.title, errors: validatePost(p) }))
    .filter(r => r.errors.length > 0)

  if (invalid.length > 0) {
    console.log('\n❌ 앱 유효성 규칙에 맞지 않는 게시글이 있어요. 삽입을 중단합니다.\n')
    invalid.forEach(r => console.log(`  · ${r.title}\n      ${r.errors.join('\n      ')}`))
    process.exit(1)
  }

  console.log(`\n📦 게시글 ${POSTS.length}개 삽입 중...`)
  for (const post of POSTS) {
    const data = toFirestore({
      ...post,
      ...AUTHOR,
      images:    [],
      hidden:    false,
      isSeedDoc: true,
      createdAt: ts(-Math.floor(Math.random() * 720)), // 최근 12시간 내 랜덤
      updatedAt: ts(),
    })
    const res = await firestoreRequest('POST', '/posts', data, token)
    if (res.name) {
      const id = res.name.split('/').pop()
      console.log(`  ✅ [${id}] ${post.title}`)
    } else {
      console.log(`  ❌ 실패: ${post.title}`, res.error?.message)
    }
  }
}

async function seedCommunity(token) {
  console.log(`\n💬 커뮤니티 글 ${COMMUNITY_POSTS.length}개 삽입 중...`)
  for (const post of COMMUNITY_POSTS) {
    const data = toFirestore({
      ...post,
      ...AUTHOR,
      likes:       0,
      answerCount: 0,
      isSeedDoc:   true,
      createdAt:   ts(-Math.floor(Math.random() * 1440)),
      updatedAt:   ts(),
    })
    const res = await firestoreRequest('POST', '/community', data, token)
    if (res.name) {
      const id = res.name.split('/').pop()
      console.log(`  ✅ [${id}] ${post.title}`)
    } else {
      console.log(`  ❌ 실패: ${post.title}`, res.error?.message)
    }
  }
}

async function clearSeedData(token, targets = ['posts', 'community']) {
  console.log(`\n🗑️  더미 데이터 삭제 중... (대상: ${targets.join(', ')})`)

  for (const col of targets) {
    const snap = await firestoreRequest('GET', `/${col}?pageSize=200`, null, token)
    const docs = snap.documents ?? []
    let deleted = 0
    for (const doc of docs) {
      const f = doc.fields ?? {}
      if (f.isSeedDoc?.booleanValue === true) {
        const docPath = '/' + doc.name.split('/documents/')[1]
        await firestoreRequest('DELETE', docPath, null, token)
        deleted++
      }
    }
    console.log(`  ${col}: ${deleted}개 삭제`)
  }
  console.log('✅ 완료!')
}

async function main() {
  const arg    = process.argv[2]
  const target = process.argv[3]   // clear 뒤에 posts / community 를 붙이면 해당 컬렉션만 삭제
  console.log('🔑 인증 중...')
  const token = await getToken()
  console.log('✅ 인증 완료')

  if (arg === 'clear') {
    if (target && !['posts', 'community'].includes(target)) {
      console.log(`❌ 삭제 대상은 posts 또는 community 만 가능해요 (입력: ${target})`)
      process.exit(1)
    }
    await clearSeedData(token, target ? [target] : ['posts', 'community'])
  } else if (arg === 'posts') {
    await seedPosts(token)
  } else if (arg === 'community') {
    await seedCommunity(token)
  } else {
    await seedPosts(token)
    await seedCommunity(token)
  }
  console.log('\n🎉 완료!')
}

main().catch(e => { console.error('❌ 에러:', e.message); process.exit(1) })
