import express, { Request, Response, Router } from 'express'
import prisma from '../config/prisma'

const router: Router = express.Router()

// Get cart by customer ID
router.get('/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params

    const cart = await prisma.shoppingCart.findUnique({
      where: { customer_id: customerId },
      include: {
        cart_items: {
          include: {
            product: {
              select: {
                id: true,
                product_name: true,
                price: true,
                image_url: true,
              },
            },
          },
        },
      },
    })

    if (!cart) {
      return res.json(null)
    }

    return res.json({
      ...cart,
      cart_items: cart.cart_items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          price: parseFloat((+item.product.price / 24000).toFixed(2)),
        },
      })),
    })
  } catch (error) {
    console.error('Get cart error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Add product to cart
router.post('/:customerId/:productId', async (req: Request, res: Response) => {
  try {
    const { customerId, productId } = req.params
    const { quantity } = req.body
    const qty = quantity || 1

    // Check if customer exists
    const customer = await prisma.user.findUnique({
      where: { user_id: customerId },
    })

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    // Find or create shopping cart
    let cart = await prisma.shoppingCart.findUnique({
      where: { customer_id: customerId },
    })

    if (!cart) {
      cart = await prisma.shoppingCart.create({
        data: { customer_id: customerId },
      })
    }

    // Check if product is already in cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: { cart_id: cart.cart_id, product_id: productId },
    })

    if (existingCartItem) {
      const updated = await prisma.cartItem.update({
        where: { item_id: existingCartItem.item_id },
        data: { quantity: existingCartItem.quantity + qty },
      })
      return res.status(200).json(updated)
    }

    const newItem = await prisma.cartItem.create({
      data: { cart_id: cart.cart_id, product_id: productId, quantity: qty },
    })

    return res.status(201).json(newItem)
  } catch (error) {
    console.error('Add to cart error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Change quantity
router.post('/:customerId/:productId/:quantity', async (req: Request, res: Response) => {
  try {
    const { customerId, productId, quantity } = req.params
    const qty = parseInt(quantity, 10)

    if (isNaN(qty)) {
      return res.status(400).json({ message: 'Invalid quantity' })
    }

    const cart = await prisma.shoppingCart.findUnique({
      where: { customer_id: customerId },
    })

    if (!cart) {
      return res.status(404).json({ message: 'Shopping cart not found' })
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { cart_id: cart.cart_id, product_id: productId },
    })

    if (!cartItem) {
      return res.status(404).json({ message: 'Product not found in cart' })
    }

    const updated = await prisma.cartItem.update({
      where: { item_id: cartItem.item_id },
      data: { quantity: qty },
    })

    return res.json(updated)
  } catch (error) {
    console.error('Change quantity error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Remove product from cart
router.delete('/:customerId/:productId', async (req: Request, res: Response) => {
  try {
    const { customerId, productId } = req.params

    const cart = await prisma.shoppingCart.findUnique({
      where: { customer_id: customerId },
    })

    if (!cart) {
      return res.status(404).json({ message: 'Shopping cart not found' })
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { cart_id: cart.cart_id, product_id: productId },
    })

    if (!cartItem) {
      return res.status(404).json({ message: 'Product not found in cart' })
    }

    await prisma.cartItem.delete({
      where: { item_id: cartItem.item_id },
    })

    return res.json({ message: 'Product removed from cart' })
  } catch (error) {
    console.error('Remove from cart error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Clear cart
router.delete('/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params

    const cart = await prisma.shoppingCart.findUnique({
      where: { customer_id: customerId },
    })

    if (!cart) {
      return res.status(404).json({ message: 'Shopping cart not found' })
    }

    await prisma.cartItem.deleteMany({
      where: { cart_id: cart.cart_id },
    })

    return res.json({ message: 'Cart cleared successfully' })
  } catch (error) {
    console.error('Clear cart error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router

