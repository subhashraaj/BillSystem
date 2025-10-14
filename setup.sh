#!/bin/bash

# Stock Craft Billing System Setup Script
echo "🚀 Setting up Stock Craft Billing System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL Server."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup backend
echo "📦 Setting up backend..."
cd backend

# Install backend dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp env.example .env
    echo "⚠️  Please update the .env file with your MySQL credentials"
fi

cd ..

# Setup frontend
echo "📦 Setting up frontend..."
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your MySQL credentials"
echo "2. Create MySQL database: CREATE DATABASE stock_craft_billing;"
echo "3. Import schema: mysql -u root -p stock_craft_billing < backend/database/schema.sql"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: npm run dev"
echo ""
echo "🌐 Application will be available at http://localhost:5173"
echo "🔗 API will be available at http://localhost:5000"
