# Stock Craft Billing System

A comprehensive billing and inventory management system for manufacturing businesses, built with React frontend and Node.js/Express backend with MySQL database.

## Features

- **Customer Management**: Add, edit, and manage customer information
- **Inventory Management**: Track items and raw materials with stock levels
- **Manufacturing Tracking**: Report manufactured items and track production
- **Invoice Management**: Create and manage customer invoices
- **Payment Processing**: Record and track payments
- **Real-time Data**: Live updates with React Query
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- React Router for navigation
- React Query for data fetching
- Tailwind CSS for styling
- shadcn/ui for components
- Sonner for toast notifications

### Backend
- Node.js with Express
- MySQL database with mysql2
- Express Validator for input validation
- CORS enabled for cross-origin requests
- Helmet for security headers

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MySQL Server (v8.0 or higher)
- npm or yarn package manager

### Database Setup

1. **Install MySQL Server**
   - Download and install MySQL Server from [mysql.com](https://dev.mysql.com/downloads/mysql/)
   - Create a root user with password

2. **Create Database**
   ```sql
   CREATE DATABASE stock_craft_billing;
   ```

3. **Import Schema**
   ```bash
   mysql -u root -p stock_craft_billing < backend/database/schema.sql
   ```

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=stock_craft_billing
   DB_PORT=3306
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_here
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to project root**
   ```bash
   cd ..
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

## API Endpoints

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Items
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `PATCH /api/items/:id/stock` - Update item stock

### Raw Materials
- `GET /api/raw-materials` - Get all raw materials
- `GET /api/raw-materials/:id` - Get raw material by ID
- `POST /api/raw-materials` - Create new raw material
- `PUT /api/raw-materials/:id` - Update raw material
- `DELETE /api/raw-materials/:id` - Delete raw material
- `PATCH /api/raw-materials/:id/stock` - Update raw material stock

### Manufacturing
- `GET /api/manufacturing` - Get all manufacturing records
- `GET /api/manufacturing/:id` - Get manufacturing record by ID
- `POST /api/manufacturing` - Create new manufacturing record
- `PUT /api/manufacturing/:id` - Update manufacturing record
- `DELETE /api/manufacturing/:id` - Delete manufacturing record

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID with items
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

## Usage

1. **Start both servers** (backend on port 5000, frontend on port 5173)
2. **Open the application** in your browser at `http://localhost:5173`
3. **Navigate through the sections**:
   - Dashboard: Overview of the system
   - Customers: Manage customer information
   - Items: Manage manufactured products
   - Raw Materials: Track raw material inventory
   - Manufacturing: Report manufactured items
   - Invoices: Create and manage invoices
   - Payments: Record and track payments

## Database Schema

The system includes the following main tables:
- `customers` - Customer information
- `items` - Manufactured products
- `raw_materials` - Raw material inventory
- `manufacturing` - Manufacturing records
- `invoices` - Customer invoices
- `invoice_items` - Invoice line items
- `payments` - Payment records

## Development

### Adding New Features
1. Create API endpoints in `backend/routes/`
2. Add API functions in `src/services/api.ts`
3. Create custom hooks in `src/hooks/useAPI.ts`
4. Build UI components in `src/components/`
5. Update pages in `src/pages/`

### Code Structure
```
├── backend/
│   ├── routes/          # API route handlers
│   ├── database/         # Database schema and migrations
│   └── server.js        # Express server setup
├── src/
│   ├── components/      # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API service layer
│   └── pages/          # Page components
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **CORS Errors**
   - Verify `FRONTEND_URL` in backend `.env`
   - Check that frontend is running on correct port

3. **API Not Responding**
   - Check backend server is running on port 5000
   - Verify all dependencies are installed
   - Check console for error messages

### Logs
- Backend logs: Check terminal where `npm run dev` is running
- Frontend logs: Check browser developer console
- Database logs: Check MySQL error logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.