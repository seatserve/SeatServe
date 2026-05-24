#!/bin/bash
echo "🚀 Starting SeatServe devcontainer setup..."

# 1. Setup Backend environment variables
if [ ! -f backend/.env ]; then
  echo "📄 Creating backend .env file..."
  cat <<EOT > backend/.env
MONGO_URL=mongodb://localhost:27017
DB_NAME=seatserve
SUPER_ADMIN_EMAIL=owner@cinebites.in
SUPER_ADMIN_PASSWORD=owner123
JWT_SECRET=super-secret-key-saas
EOT
fi

# 2. Setup Frontend environment variables
if [ ! -f frontend/.env ]; then
  echo "📄 Creating frontend .env file..."
  cat <<EOT > frontend/.env
REACT_APP_BACKEND_URL=
EOT
fi

# 3. Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip3 install -r backend/requirements.txt

# 4. Install Node.js dependencies
echo "📦 Installing Node.js packages..."
npm install --prefix frontend

echo "✅ SeatServe Codespace environment is fully configured and ready!"
EOT
