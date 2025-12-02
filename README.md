# Budget 2025

A personal budgeting application built with Next.js 16, designed to help you track your income, expenses, budgets, and loans. All data is stored in MongoDB, providing a robust and scalable solution for managing your financial information.

## Features

- **Transaction Management**: Track income and expenses with categories
- **Budget Management**: Set monthly budgets per category and track spending
- **Loan Tracking**: Monitor money you've lent to others with payment tracking
- **Dashboard**: Visual overview of your finances with charts and analytics
- **Reports**: View detailed reports and export data to CSV
- **Database**: MongoDB for reliable data storage
- **Authentication**: Secure user authentication with NextAuth.js

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Data Storage**: MongoDB with Mongoose
- **Charts**: Recharts
- **Form Handling**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and set:
- `AUTH_URL`: Your application URL (e.g., `http://localhost:3000`)
- `AUTH_SECRET`: A random secret string (generate one using `openssl rand -base64 32`)
- `AUTH_TRUST_HOST`: Set to `true` for development
- `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb://localhost:27017/budget2025` or MongoDB Atlas connection string)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

6. Create an account and start managing your budget!

## Project Structure

```
/app
  /(auth)          # Authentication pages (login, register)
  /(dashboard)     # Protected dashboard routes
    /dashboard     # Main dashboard
    /transactions  # Transaction management
    /budgets       # Budget management
    /loans         # Lending management
    /reports       # Analytics & reports
    /settings      # User settings
  /api
    /auth          # Auth endpoints
    /transactions  # Transaction CRUD
    /budgets       # Budget CRUD
    /loans         # Loan CRUD
    /data          # Data export/import
/lib
  /utils           # Utility functions
  /validations     # Zod schemas
  /data            # Data access layer (MongoDB operations)
  /db              # MongoDB connection utilities
  /models          # Mongoose models/schemas
/components        # React components
  /ui              # shadcn components
  /dashboard       # Dashboard-specific components
  /transactions    # Transaction components
  /budgets         # Budget components
  /loans           # Loan components
```

## Data Storage

All user data is stored in MongoDB:
- **Users** - User accounts collection
- **Transactions** - User transactions collection
- **Budgets** - User budgets collection
- **Loans** - User loans collection

Make sure MongoDB is running and the `MONGODB_URI` environment variable is set correctly.

## Security

- Passwords are hashed using bcrypt
- Authentication handled by NextAuth.js with JWT sessions
- All API routes are protected and require authentication
- MongoDB connection pooling for efficient database access

## Building for Production

```bash
npm run build
npm start
```

## License

This project is for personal use.

