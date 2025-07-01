# Quality Check Command

Run comprehensive quality validation for GXO Signify project components.

## Quality Checks:

### 1. Frontend Code Quality
```bash
cd frontend

# TypeScript type checking
npm run type-check

# ESLint checking
npm run lint

# Prettier formatting check
npm run format:check

# Unit tests with coverage
npm run test:coverage

# Bundle size analysis
npm run build
npm run analyze
```

### 2. Backend Code Quality
```bash
cd backend

# Black formatting
black --check .

# Flake8 linting
flake8 app/ --max-line-length=100

# MyPy type checking
mypy app/

# Pytest with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Security scanning
bandit -r app/
```

### 3. Infrastructure Validation
```bash
cd infrastructure/terraform

# Terraform formatting
terraform fmt -check=true -recursive

# Terraform validation
terraform init
terraform validate

# tflint for best practices
tflint

# Checkov security scanning
checkov -d .
```

### 4. Dependency Security
```bash
# Frontend dependencies
cd frontend
npm audit
npm outdated

# Backend dependencies
cd backend
pip-audit
safety check
pip list --outdated
```

### 5. Documentation Checks
```bash
# Check for broken links
find docs -name "*.md" -exec markdown-link-check {} \;

# Verify API documentation generation
cd backend
python -m app.generate_openapi

# Check README completeness
grep -E "(Installation|Usage|Contributing)" README.md
```

### 6. AWS Cost Analysis
```bash
# Estimate infrastructure costs
cd infrastructure/terraform
terraform plan -var-file=environments/pilot/terraform.tfvars | grep "cost"

# Check for unused resources
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "7 days ago" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE
```

## Quality Report Summary:

### 🟢 Passing Checks:
- List all checks that passed

### 🟡 Warnings:
- List non-critical issues

### 🔴 Failures:
- List critical issues that must be fixed

### 📊 Metrics:
- Frontend coverage: X%
- Backend coverage: Y%
- Bundle size: Z KB
- Technical debt ratio: A%

## Recommended Actions:
1. Fix all critical security vulnerabilities
2. Address type errors
3. Improve test coverage to >80%
4. Update outdated dependencies
5. Optimize bundle size if >250KB

Report any issues found with suggested fixes and priority levels.