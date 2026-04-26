import { createContext, useContext, useState } from 'react'

// ─── 초기 더미 데이터 (Home.jsx에서 이동)
const INITIAL_POSTS = [
  { id: 10, title: '알파카 혼방 실 베이지',    type: 'sell',  price: 8000,  region: '성동구',   status: '판매중', image: 'https://picsum.photos/seed/knit10/300/300' },
  { id: 11, title: '대바늘 7mm 2쌍 거의 새것', type: 'share', price: 0,     region: '마포구',   status: '나눔',   image: 'https://picsum.photos/seed/knit66/300/300' },
  { id: 12, title: '코바늘 5/0호 미개봉',      type: 'sell',  price: 3500,  region: '강서구',   status: '예약중', image: 'https://picsum.photos/seed/knit77/300/300' },
  { id: 13, title: '손뜨개 가방 키트 세트',    type: 'sell',  price: 15000, region: '은평구',   status: '판매중', image: 'https://picsum.photos/seed/knit88/300/300' },
  { id: 14, title: '연두 울실 50g',            type: 'share', price: 0,     region: '서대문구', status: '나눔',   image: 'https://picsum.photos/seed/knit99/300/300' },
  { id: 15, title: '터키쉬 코튼 블루 100g',    type: 'sell',  price: 6500,  region: '노원구',   status: '판매중', image: 'https://picsum.photos/seed/knit100/300/300' },
]

const PostsContext = createContext(null)

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState(INITIAL_POSTS)

  const addPost = (post) => {
    setPosts(prev => [post, ...prev])
  }

  return (
    <PostsContext.Provider value={{ posts, addPost }}>
      {children}
    </PostsContext.Provider>
  )
}

export const usePosts = () => useContext(PostsContext)
