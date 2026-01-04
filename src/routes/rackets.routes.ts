import express, { Request, Response } from 'express'
import { Prisma, Brand, Balance, Stiffness } from '@prisma/client'
import prisma from '../config/prisma'

const router = express.Router()

// Create racket
router.post('/', async (req: Request, res: Response) => {
  try {
    const { racket, ...productData } = req.body

    const created = await prisma.product.create({
      data: {
        ...productData,
        racket: {
          create: {
            ...racket,
          },
        },
      },
    })

    return res.status(201).json(created)
  } catch (error) {
    console.error('Create racket error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Bulk create rackets
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const data = req.body

    if (!Array.isArray(data)) {
      return res.status(400).json({ message: 'Expected an array of rackets' })
    }

    const created = await prisma.$transaction(
      data.map((entry: any) =>
        prisma.racket.create({
          data: {
            balance: entry.racket.balance,
            length: entry.racket.length,
            player_level: entry.racket.player_level,
            playing_style: entry.racket.playing_style,
            stiffness: entry.racket.stiffness,
            weight: entry.racket.weight,
            line: entry.racket.line,
            technology: entry.racket.technology,
            max_tension: entry.racket.max_tension,
            product: {
              create: {
                image_url: entry.image_url,
                product_name: entry.product_name,
                brand: entry.brand,
                price: entry.price,
                description: entry.description,
                status: entry.status,
                sales: entry.sales,
                stock: entry.stock,
                available_location: entry.available_location,
              },
            },
          },
        }),
      ),
    )

    return res.status(201).json(created)
  } catch (error) {
    console.error('Bulk create rackets error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Get all rackets with filters (specific route must come before parameterized route)
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = req.query
    const where: Prisma.RacketWhereInput = {}

    if (filters.brand) {
      const brands = (filters.brand as string)
        .toUpperCase()
        .split(',') as Brand[]
      where.product = {
        brand: { in: brands },
      }
    }

    if (filters.weight) {
      const weights = (filters.weight as string).split(',').map((w) => w.trim())
      where.OR = weights.map((w) => ({
        weight: { contains: w, mode: 'insensitive' },
      }))
    }

    if (filters.balance) {
      const balances = (filters.balance as string)
        .split(',')
        .map((b) => b.replace(/\s+/g, '') as Balance)
      where.balance = { in: balances }
    }

    if (filters.stiffness) {
      const stiffness = (filters.stiffness as string)
        .split(',')
        .map((s) => s.replace(/\s+/g, '') as Stiffness)
      where.stiffness = { in: stiffness }
    }

    const orderBy: Prisma.RacketOrderByWithRelationInput[] = []
    if (filters.price) {
      orderBy.push({
        product: {
          price:
            (filters.price as string).toLowerCase() === 'asc' ? 'asc' : 'desc',
        },
      })
    }

    const take = filters.limit ? parseInt(filters.limit as string, 10) : undefined
    const page = filters.page ? parseInt(filters.page as string, 10) : 1
    const skip = take ? (page - 1) * take : undefined

    // Fetch the total count of matching records
    const totalCount = await prisma.racket.count({
      where,
    })

    // Fetch the paginated data
    const racks = await prisma.racket.findMany({
      where,
      orderBy,
      take,
      skip,
      include: { product: true },
    })

    return res.json({
      total: totalCount,
      data: racks.map((r) => ({
        ...r,
        product: {
          ...r.product,
          price: parseFloat((+r.product.price / 24000).toFixed(2)),
        },
      })),
    })
  } catch (error) {
    console.error('Get rackets error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Get racket by ID (parameterized route must come after specific routes)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const racket = await prisma.racket.findUnique({
      where: { id },
      include: { product: true },
    })

    if (!racket) {
      return res.status(404).json({ message: 'Racket not found' })
    }

    return res.json({
      ...racket,
      product: {
        ...racket.product,
        price: parseFloat((+racket.product.price / 24000).toFixed(2)),
      },
    })
  } catch (error) {
    console.error('Get racket by ID error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router

