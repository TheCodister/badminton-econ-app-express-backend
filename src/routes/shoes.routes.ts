import { Brand, Prisma } from '@prisma/client'
import express, { Request, Response, Router } from 'express'
import prisma from '../config/prisma'

const router: Router = express.Router()

// Create shoe
router.post('/', async (req: Request, res: Response) => {
  try {
    const { shoes, ...productData } = req.body

    const created = await prisma.product.create({
      data: {
        ...productData,
        shoes: {
          create: {
            ...shoes,
          },
        },
      },
    })

    return res.status(201).json(created)
  } catch (error) {
    console.error('Create shoe error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Bulk create shoes
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const data = req.body

    if (!Array.isArray(data)) {
      return res.status(400).json({ message: 'Expected an array of shoes' })
    }

    const created = await prisma.$transaction(
      data.map((entry: any) =>
        prisma.shoes.create({
          data: {
            color: entry.shoes.color,
            size: entry.shoes.size,
            available_size: entry.shoes.available_size,
            technology: entry.shoes.technology,
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
    console.error('Bulk create shoes error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Get all shoes with filters (specific route must come before parameterized route)
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = req.query
    const where: Prisma.ShoesWhereInput = {}

    if (filters.brand) {
      const brands = (filters.brand as string)
        .toUpperCase()
        .split(',') as Brand[]
      where.product = {
        brand: { in: brands },
      }
    }

    // Note: JSON field filtering for color and size can be added later
    // For now, we'll filter by brand and price only
    // JSON filtering in Prisma requires specific syntax based on your JSON structure

    const orderBy: Prisma.ShoesOrderByWithRelationInput[] = []
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
    const totalCount = await prisma.shoes.count({
      where,
    })

    // Fetch the paginated data
    const shoes = await prisma.shoes.findMany({
      where,
      orderBy,
      take,
      skip,
      include: { product: true },
    })

    return res.json({
      total: totalCount,
      data: shoes.map((s) => ({
        ...s,
        product: {
          ...s.product,
          price: parseFloat((+s.product.price / 24000).toFixed(2)),
        },
      })),
    })
  } catch (error) {
    console.error('Get shoes error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Get shoe by ID (parameterized route must come after specific routes)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const shoe = await prisma.shoes.findUnique({
      where: { id },
      include: { product: true },
    })

    if (!shoe) {
      return res.status(404).json({ message: 'Shoe not found' })
    }

    return res.json({
      ...shoe,
      product: {
        ...shoe.product,
        price: parseFloat((+shoe.product.price / 24000).toFixed(2)),
      },
    })
  } catch (error) {
    console.error('Get shoe by ID error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
