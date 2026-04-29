import { createContext, useContext, useState, useEffect } from 'react'
import {
  collection, addDoc, onSnapshot,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

const PostsContext = createContext(null)

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const addPost = async (post) => {
    const { id: _ignored, ...data } = post
    await addDoc(collection(db, 'posts'), {
      ...data,
      createdAt: serverTimestamp(),
    })
  }

  return (
    <PostsContext.Provider value={{ posts, addPost, loading }}>
      {children}
    </PostsContext.Provider>
  )
}

export const usePosts = () => useContext(PostsContext)
