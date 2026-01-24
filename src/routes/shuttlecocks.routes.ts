import { Brand, Prisma } from '@prisma/client'
import express, { Request, Response, Router } from 'express'
import prisma from '../config/prisma'

const router: Router = express.Router()

// Create shuttlecock
router.post('/', async (req: Request, res: Response) => {
  try {
    const { shuttlecock, ...productData } = req.body

    const created = await prisma.product.create({
      data: {
        ...productData,
        shuttlecocks: {
          create: {
            ...shuttlecock,
          },
        },
      },
    })

    return res.status(201).json(created)
  } catch (error) {
    console.error('Create shuttlecock error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Bulk create shuttlecocks
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const data = req.body

    if (!Array.isArray(data)) {
      return res.status(400).json({ message: 'Expected an array of shuttlecocks' })
    }

    const created = await prisma.$transaction(
      data.map((entry: any) =>
        prisma.shuttlecock.create({
          data: {
            shuttle_type: entry.shuttlecock.shuttle_type,
            speed: entry.shuttlecock.speed,
            no_per_tube: entry.shuttlecock.no_per_tube,
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
    console.error('Bulk create shuttlecocks error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Get all shuttlecocks with filters (specific route must come before parameterized route)
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = req.query
    const where: Prisma.ShuttlecockWhereInput = {}

    if (filters.brand) {
      const brands = (filters.brand as string)
        .toUpperCase()
        .split(',') as Brand[]
      where.product = {
        brand: { in: brands },
      }
    }

    if (filters.shuttle_type) {
      const types = (filters.shuttle_type as string).split(',').map((t) => t.trim())
      where.OR = types.map((t) => ({
        shuttle_type: { contains: t, mode: 'insensitive' },
      }))
    }

    if (filters.speed) {
      const speeds = (filters.speed as string)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
      where.speed = { in: speeds }
    }

    const orderBy: Prisma.ShuttlecockOrderByWithRelationInput[] = []
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
    const totalCount = await prisma.shuttlecock.count({
      where,
    })

    // Fetch the paginated data
    const shuttlecocks = await prisma.shuttlecock.findMany({
      where,
      orderBy,
      take,
      skip,
      include: { product: true },
    })

    return res.json({
      total: totalCount,
      data: shuttlecocks.map((s) => ({
        ...s,
        product: {
          ...s.product,
          price: parseFloat((+s.product.price / 24000).toFixed(2)),
        },
      })),
    })
  } catch (error) {
    console.error('Get shuttlecocks error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Get shuttlecock by ID (parameterized route must come after specific routes)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const shuttlecock = await prisma.shuttlecock.findUnique({
      where: { id },
      include: { product: true },
    })

    if (!shuttlecock) {
      return res.status(404).json({ message: 'Shuttlecock not found' })
    }

    return res.json({
      ...shuttlecock,
      product: {
        ...shuttlecock.product,
        price: parseFloat((+shuttlecock.product.price / 24000).toFixed(2)),
      },
    })
  } catch (error) {
    console.error('Get shuttlecock by ID error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
