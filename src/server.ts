import express, { Express } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import productsRoutes from './routes/products.routes'
import racketsRoutes from './routes/rackets.routes'
import cartRoutes from './routes/cart.routes'

// Load environment variables
dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://badminton-econ-app.vercel.app',
    'https://badminton-econ-app-nkv4.vercel.app',
  ],
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/auth', authRoutes)
app.use('/products', productsRoutes)
app.use('/rackets', racketsRoutes)
app.use('/shoppingcart', cartRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
})

export default app

