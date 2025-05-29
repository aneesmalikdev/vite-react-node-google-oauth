import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

function Home() {
  const [user, setUser] = useState(null)
  const [googleAuthUrl, setGoogleAuthUrl] = useState('')
  const backendUrl = import.meta.env.VITE_BACKEND_URL

  // Check existing session on load
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const userData = jwtDecode(token)
        setUser(userData)
      } catch (error) {
        console.error('Session restore error:', error)
        logout()
      }
    }

    // Get Google auth URL
    axios
      .get(`${backendUrl}/auth/google/url`)
      .then((response) => setGoogleAuthUrl(response.data.url))
      .catch((error) => console.error('Error getting Google URL:', error))
  }, [backendUrl])

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (!googleAuthUrl) {
    return (
      <div style={{ minWidth: '100vw', display: 'flex', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className='app' style={{ minWidth: '100vw', display: 'flex', justifyContent: 'center' }}>
      {user ? (
        <div className='profile' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1>Welcome, {user.name}!</h1>
          <img src={user.picture} alt={user.name} width={100} height={100} style={{ borderRadius: '50%' }} />
          <p>Email: {user.email}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div className='login' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1>Google Login Demo</h1>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
            onClick={() => (window.location.href = googleAuthUrl)}
          >
            <img
              src='https://developers.google.com/identity/images/g-logo.png'
              alt='Google logo'
              width='20'
            />
            <div>Login with Google</div>
          </button>
        </div>
      )}
    </div>
  )
}

function LoginSuccess() {
  const navigate = useNavigate()

  useEffect(() => {
    // Extract token from URL
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      try {
        // Store token and decode user info
        localStorage.setItem('token', token)
        navigate('/')
      } catch (error) {
        console.error('Token handling error:', error)
        navigate('/')
      }
    } else {
      navigate('/')
    }
  }, [navigate])

  return (
    <div style={{ minWidth: '100vw', display: 'flex', justifyContent: 'center' }}>Processing login...</div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login-success' element={<LoginSuccess />} />
        <Route
          path='/login-error'
          element={
            <>
              <h1>Error Login</h1>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
