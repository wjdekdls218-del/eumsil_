import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PostsProvider } from './context/PostsContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import ProductDetail from './pages/ProductDetail'
import Write from './pages/Write'
import ChatList from './pages/ChatList'
import ChatRoom from './pages/ChatRoom'
import Community from './pages/Community'
import CommunityPost from './pages/CommunityPost'
import CommunityWrite from './pages/CommunityWrite'
import UserProfile from './pages/UserProfile'
import MyPage from './pages/MyPage'
import Settings from './pages/Settings'
import Notice from './pages/Notice'
import Notifications from './pages/Notifications'
import MyReviews from './pages/MyReviews'
import ProfileEdit from './pages/ProfileEdit'
import BannedScreen from './pages/BannedScreen'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminReports from './pages/admin/AdminReports'
import AdminReportDetail from './pages/admin/AdminReportDetail'
import AdminPosts from './pages/admin/AdminPosts'
import AdminPostDetail from './pages/admin/AdminPostDetail'
import AdminCommunity from './pages/admin/AdminCommunity'
import AdminCommunityDetail from './pages/admin/AdminCommunityDetail'
import AdminNotices from './pages/admin/AdminNotices'
import AdminNoticeWrite from './pages/admin/AdminNoticeWrite'
import AdminBanned from './pages/admin/AdminBanned'
import DeliveryDetail from './pages/DeliveryDetail'
import Seed from './pages/Seed'

function AppContent() {
  const { user, banInfo } = useAuth()

  if (user && banInfo.isBanned) return <BannedScreen />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* BottomNav 포함 레이아웃 */}
      <Route element={<Layout />}>
        <Route path="/"          element={<Home />} />
        <Route path="/community" element={<Community />} />
        <Route path="/chat"      element={<PrivateRoute><ChatList /></PrivateRoute>} />
        <Route path="/mypage"    element={<PrivateRoute><MyPage /></PrivateRoute>} />
      </Route>

      {/* 단독 페이지 (공개) */}
      <Route path="/product/:id"   element={<ProductDetail />} />
      <Route path="/community/:id" element={<CommunityPost />} />
      <Route path="/user/:id"      element={<UserProfile />} />

      {/* 단독 페이지 (로그인 필요) */}
      <Route path="/chat/:id"        element={<PrivateRoute><ChatRoom /></PrivateRoute>} />
      <Route path="/delivery/:chatId" element={<PrivateRoute><DeliveryDetail /></PrivateRoute>} />
      <Route path="/community/write" element={<PrivateRoute><CommunityWrite /></PrivateRoute>} />
      <Route path="/settings"        element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/notices"           element={<Notice />} />
      <Route path="/notifications"   element={<PrivateRoute><Notifications /></PrivateRoute>} />
      <Route path="/mypage/reviews"  element={<PrivateRoute><MyReviews /></PrivateRoute>} />
      <Route path="/mypage/edit"     element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />
      <Route path="/write"           element={<PrivateRoute><Write /></PrivateRoute>} />

      {/* 시딩 (개발용) */}
      <Route path="/seed" element={<PrivateRoute><Seed /></PrivateRoute>} />

      {/* 관리자 페이지 */}
      <Route path="/admin"                    element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/reports"            element={<AdminRoute><AdminReports /></AdminRoute>} />
      <Route path="/admin/reports/:id"        element={<AdminRoute><AdminReportDetail /></AdminRoute>} />
      <Route path="/admin/posts"              element={<AdminRoute><AdminPosts /></AdminRoute>} />
      <Route path="/admin/posts/:id"          element={<AdminRoute><AdminPostDetail /></AdminRoute>} />
      <Route path="/admin/community"          element={<AdminRoute><AdminCommunity /></AdminRoute>} />
      <Route path="/admin/community/:id"      element={<AdminRoute><AdminCommunityDetail /></AdminRoute>} />
      <Route path="/admin/notices"            element={<AdminRoute><AdminNotices /></AdminRoute>} />
      <Route path="/admin/notices/write"      element={<AdminRoute><AdminNoticeWrite /></AdminRoute>} />
      <Route path="/admin/notices/:id"        element={<AdminRoute><AdminNoticeWrite /></AdminRoute>} />
      <Route path="/admin/banned"             element={<AdminRoute><AdminBanned /></AdminRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <PostsProvider>
            <AppContent />
          </PostsProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
