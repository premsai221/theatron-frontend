import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import IndexPage from './routes/unauth/IndexPage'
import UnAuthNavBar from './routes/unauth/UnAuthNavBar'
import { useEffect } from 'react'
import SignInPage from './routes/unauth/SignInPage'
import SignUpPage from './routes/unauth/SignUpPage'
import AuthNavBar from './routes/auth/AuthNavBar'
import ProtectedPage from './routes/auth/ProtectedPage'
import Dashboard from './routes/auth/Dashboard'
import VideoUploadPage from './routes/auth/VideoUploadPage'
import PlayVideoPage from './routes/auth/PlayVideoPage'

function App() {
  return (
    <>
        <Routes>
          <Route element={<UnAuthNavBar/>}>
            <Route index element={<IndexPage />} />
            <Route path='/login' element={<SignInPage />}/>
            <Route path='/signup' element={<SignUpPage />}/>
          </Route>
          <Route element={<AuthNavBar />}>
            <Route path='/dashboard' element={<Dashboard/>}/>
            <Route path='/upload' element={<VideoUploadPage/>} />
            <Route path='/watch/:videoId/:room?' element={<PlayVideoPage />} />
          </Route>
        </Routes>
    </>
  )
}

export default App
