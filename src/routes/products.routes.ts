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
        racket: {
          select: {
            id: true,
          },
        },
        shoes: {
          select: {
            id: true,
          },
        },
        shuttlecocks: {
          select: {
            id: true,
          },
        },
      },
      take: limit ? parseInt(String(limit), 10) : undefined,
    })

    // Convert prices from VND to USD and determine product type
    const productsWithUSD = products.map((product) => {
      let productType = 'unknown'
      
      // Determine product type based on which relation exists
      // Since these are one-to-one relations, check if the array has any items
      if (product.racket && product.racket.length > 0) {
        productType = 'racket'
      } else if (product.shoes && product.shoes.length > 0) {
        productType = 'shoes'
      } else if (product.shuttlecocks && product.shuttlecocks.length > 0) {
        productType = 'shuttlecock'
      }

      return {
        id: product.id,
        product_name: product.product_name,
        image_url: product.image_url,
        price: parseFloat((+product.price / 24000).toFixed(2)),
        product_type: productType,
      }
    })

    return res.json(productsWithUSD)
  } catch (error) {
    console.error('Get products error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router

