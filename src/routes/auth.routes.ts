import express, { Request, Response } from 'express'
import * as bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma'

const router = express.Router()

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { mail, password } = req.body
    console.log(req.body)

    if (!mail || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({
      where: { mail },
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const passwordValid = await bcrypt.compare(password, user.password)

    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const jwtSecret = process.env.JWT_SECRET || 'BenCuber@2002'
    const token = jwt.sign({ userId: user.user_id }, jwtSecret, {
      expiresIn: '1h',
    })

    return res.json({
      user_id: user.user_id,
      username: user.username,
      mail: user.mail,
      access_token: token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, phone, password, address } = req.body

    if (!username || !email || !phone || !password || !address) {
      return res
        .status(400)
        .json({ message: 'All fields are required' })
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { mail: email },
    })

    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    await prisma.user.create({
      data: {
        username,
        mail: email,
        phone_number: phone,
        password: hashedPassword,
        role: 'CUSTOMER',
        address,
      },
    })

    return res.json({ message: 'User registered successfully' })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Verify token
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const jwtSecret = process.env.JWT_SECRET || 'BenCuber@2002'

    try {
      const decoded = jwt.verify(token, jwtSecret)
      return res.json(decoded)
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }
  } catch (error) {
    console.error('Verify token error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router

