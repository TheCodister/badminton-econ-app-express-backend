# Backend Express.js

Express.js backend for the badminton e-commerce application, migrated from NestJS.

## Features

- Express.js with TypeScript
- Prisma ORM for database management
- JWT authentication
- RESTful API endpoints
- CORS enabled for frontend integration

## Project Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_jwt_secret_key"
PORT=3001
```

## Development

```bash
# Start development server with hot reload
pnpm run start:dev

# Build for production
pnpm run build

# Start production server
pnpm run start:prod
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/verify` - Verify JWT token

### Products
- `GET /products` - Get all products (with optional search query)

### Rackets
- `GET /rackets` - Get all rackets (with filters)
- `GET /rackets/:id` - Get racket by ID
- `POST /rackets` - Create a new racket
- `POST /rackets/bulk` - Bulk create rackets

### Shopping Cart
- `GET /shoppingcart/:customerId` - Get cart by customer ID
- `POST /shoppingcart/:customerId/:productId` - Add product to cart
- `POST /shoppingcart/:customerId/:productId/:quantity` - Change quantity
- `DELETE /shoppingcart/:customerId/:productId` - Remove product from cart
- `DELETE /shoppingcart/:customerId` - Clear cart

## Database

This project uses Prisma ORM with PostgreSQL. The schema is defined in `prisma/schema.prisma`.

## License

UNLICENSED

