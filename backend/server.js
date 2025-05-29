require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')

const app = express()
const port = process.env.PORT

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
)

app.use(express.json())

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

// Generate Google auth URL
app.get('/auth/google/url', (_, res) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid',
    ],
    prompt: 'consent',
  })
  console.log('Generated Google auth URL:', authorizeUrl)
  res.json({ url: authorizeUrl })
})

// Handle Google callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query

  try {
    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code)
    oAuth2Client.setCredentials(tokens)

    // Verify ID token
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    }

    // Create JWT
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' })

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${token}`)
  } catch (error) {
    console.error('Authentication error:', error)
    res.redirect(`${process.env.FRONTEND_URL}/login-error`)
  }
})

// Protected route example
app.get('/profile', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).send('Unauthorized')

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    res.json(decoded)
  } catch (err) {
    res.status(401).send('Invalid token')
  }
})

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`)
})
