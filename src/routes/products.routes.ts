import express, { Request, Response, Router } from 'express'
import prisma from '../config/prisma'

const router: Router = express.Router()

// Get all products with optional search
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, limit } = req.query

    const products = await prisma.product.findMany({
      where: search
        ? {
            product_name: {
              contains: search as string,
              mode: 'insensitive',
            },
          }
        : undefined,
      select: {
        id: true,
        product_name: true,
        image_url: true,
        price: true,
      },
      take: limit ? parseInt(String(limit), 10) : undefined,
    })

    // Convert prices from VND to USD
    const productsWithUSD = products.map((product) => ({
      ...product,
      price: parseFloat((+product.price / 24000).toFixed(2)),
    }))

    return res.json(productsWithUSD)
  } catch (error) {
    console.error('Get products error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router

