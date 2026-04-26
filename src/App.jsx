import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PostsProvider } from './context/PostsContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Write from './pages/Write'
import ChatList from './pages/ChatList'
import ChatRoom from './pages/ChatRoom'
import Community from './pages/Community'
import CommunityPost from './pages/CommunityPost'
import MyPage from './pages/MyPage'

export default function App() {
  return (
    <PostsProvider>
    <BrowserRouter>
      <Routes>
        {/* BottomNav가 포함된 레이아웃 */}
        <Route element={<Layout />}>
          <Route path="/"            element={<Home />} />
          <Route path="/chat"        element={<ChatList />} />
          <Route path="/community"   element={<Community />} />
          <Route path="/mypage"      element={<MyPage />} />
        </Route>

        {/* 자체 하단 바 / BottomNav 없는 단독 페이지 */}
        <Route path="/product/:id"    element={<ProductDetail />} />
        <Route path="/chat/:id"       element={<ChatRoom />} />
        <Route path="/community/:id"  element={<CommunityPost />} />
        <Route path="/write"          element={<Write />} />
      </Routes>
    </BrowserRouter>
    </PostsProvider>
  )
}
