import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc, Timestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAJzi8TDsrMim6Sfm9uK1JAiwrRkCcr9PY",
  authDomain: "eumsil-ab852.firebaseapp.com",
  projectId: "eumsil-ab852",
  storageBucket: "eumsil-ab852.firebasestorage.app",
  messagingSenderId: "246424613141",
  appId: "1:246424613141:web:0bd8742208982c9b98391c",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// 기존 공지 전체 삭제
const snap = await getDocs(collection(db, 'notices'))
for (const d of snap.docs) {
  await deleteDoc(doc(db, 'notices', d.id))
  console.log('삭제:', d.data().title)
}

// 새 공지 등록
const now = Timestamp.now()
const oneYearLater = Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))

await addDoc(collection(db, 'notices'), {
  title: '이음실에 오신 걸 환영해요 🧶',
  content: `안녕하세요, 이음실입니다!\n뜨개를 하다 보면 어느새 쌓여있는 실들... 버리기엔 아깝고, 보관하기엔 너무 많고. 그 마음 다들 아시죠?\n이음실은 그런 실들이 새 주인을 만날 수 있는 공간이에요. 내가 쓰던 실이 다른 니터의 작품이 되는 것, 그게 바로 이음실이 꿈꾸는 뜨개 생태계예요 🌿\n나눔도 좋고, 판매도 좋아요. 뜨개에 관한 궁금증은 질문방에서 함께 해결해요. 서로의 이음실이 되어주는 것, 저희와 함께해요!\n\n자세한 이용 가이드와 운영 규정은 곧 업로드될 예정이에요. 조금만 기다려주세요 🙏`,
  isPinned: true,
  showPopup: true,
  popupStart: now,
  popupEnd: oneYearLater,
  createdAt: now,
})

console.log('✅ 공지 등록 완료!')
process.exit(0)
