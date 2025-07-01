# Setup Development Environment Command

Set up the complete GXO Signify development environment for: $ARGUMENTS

## Steps:

### 1. Prerequisites Check
```bash
# Check Node.js (18+)
node --version

# Check Python (3.11+)
python --version

# Check AWS CLI
aws --version

# Check Docker (optional but recommended)
docker --version
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Update VITE_API_BASE_URL in .env.local
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Update DATABASE_URL and AWS credentials in .env
```

### 4. Database Setup
```bash
# Start PostgreSQL locally
brew services start postgresql  # macOS
# Or use Docker:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15

# Create database
createdb gxo_signify_dev

# Run migrations
cd backend
alembic upgrade head

# Seed sample data (if available)
python scripts/seed_data.py
```

### 5. AWS Local Development
```bash
# Configure AWS profile
aws configure --profile gxo-signify-dev

# Install LocalStack for local AWS testing (optional)
pip install localstack
docker run -d -p 4566:4566 localstack/localstack

# Set up S3 bucket for local testing
aws s3 mb s3://gxo-signify-pilot-dev --endpoint-url http://localhost:4566
```

### 6. Start Development Servers
```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 3: LocalStack (if using)
localstack start
```

### 7. Verification
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Common Issues:

1. **Port conflicts**: Change ports in vite.config.ts or use --port flag
2. **Database connection**: Verify PostgreSQL is running and credentials are correct
3. **AWS credentials**: Ensure AWS_PROFILE is set correctly
4. **Node modules**: Try `rm -rf node_modules package-lock.json && npm install`

Usage: `/setup-environment [frontend|backend|full]`