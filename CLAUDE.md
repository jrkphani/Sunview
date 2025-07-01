# GXO Signify Forecasting Solution - Project Context

## 🔧 DEVELOPMENT PHASE

### Project Overview

- **Mission**: Transform GXO from reactive logistics execution to proactive, data-driven partnership through AI-powered forecasting and actionable insights
- **Architecture**: AWS-native microservices with managed ML services
- **Tech Stack**:
  - Frontend: React/TypeScript with Vite
  - Backend: Python/FastAPI + AWS Lambda
  - ML/AI: Amazon Forecast, AWS Lookout for Metrics
  - Database: Aurora PostgreSQL + S3 Data Lake
  - Infrastructure: AWS (Amplify, Lambda, Step Functions, Glue)

### Development Standards

- **Code Quality**: ESLint/Prettier (Frontend), Black/Flake8/MyPy (Backend)
- **Language**: TypeScript (Frontend), Python 3.11 (Backend)
- **Package Manager**: npm (Frontend), pip/poetry (Backend)
- **Environment Management**: .env files (local), AWS Systems Manager (production)
- **Version Control**: GitHub Flow with PR reviews and CI/CD automation

### Common Commands

- `npm run dev`: Start frontend development server
- `uvicorn main:app --reload`: Start backend API server
- `npm run build`: Build production frontend
- `npm test`: Run frontend test suite
- `pytest`: Run backend test suite
- `npm run lint`: Frontend code quality checks
- `black . && flake8`: Backend code formatting and linting

## 🎯 BUSINESS OBJECTIVES

### Four Strategic Insight Categories

1. **Operational Efficiency**: Peak volume prediction, truck utilization, capacity planning
2. **Strategic Partnership**: Demand patterns, product mix evolution, seasonal shifts
3. **Commercial Opportunity**: Service gaps, value-added services, pricing optimization
4. **Risk & Resilience**: Supply chain vulnerabilities, demand volatility, scenario planning

### Success Metrics

- **Forecast Accuracy**: MAPE < 15% for top 80% SKUs
- **Truck Utilization**: 15% improvement target
- **Cost Reduction**: 10-20% emergency staffing reduction
- **User Adoption**: Active daily usage by pilot teams

## 🏗️ PROJECT STRUCTURE

```
/Users/jrkphani/Projects/Sunview/
├── Sunview/                    # Main project root
├── frontend/                   # React/TypeScript application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Route pages
│   │   ├── stores/           # Zustand state management
│   │   └── services/         # API integration
│   └── CLAUDE.md             # Frontend-specific context
├── backend/                   # FastAPI + Lambda functions
│   ├── app/                  # FastAPI application
│   ├── lambdas/              # AWS Lambda functions
│   ├── kpi_engine/           # Business logic engines
│   └── CLAUDE.md             # Backend-specific context
├── infrastructure/            # AWS IaC and deployment
│   ├── terraform/            # Infrastructure as Code
│   ├── cloudformation/       # AWS templates
│   └── CLAUDE.md             # Infrastructure context
├── glue_jobs/                # AWS Glue ETL scripts
├── scripts/                  # Utility and deployment scripts
└── docs/                     # Comprehensive documentation

```

## 🚀 QUICK START

### Initial Setup

```bash
# Clone repository
git clone https://github.com/1cloudhub/gxo-forecasting.git
cd gxo-forecasting

# Install dependencies
cd frontend && npm install
cd ../backend && pip install -r requirements.txt

# Set up local environment
cp .env.example .env
# Edit .env with your AWS credentials and configuration

# Start development
npm run dev              # Terminal 1: Frontend
uvicorn main:app --reload # Terminal 2: Backend
```

## 🔐 SECURITY & COMPLIANCE

### Security Principles

- **Zero Trust Networking**: VPC isolation with private subnets
- **Least Privilege IAM**: Service-specific roles and policies
- **End-to-End Encryption**: TLS 1.2+ and AES-256 at rest
- **Audit Logging**: CloudTrail and CloudWatch for all operations

### Data Classification

- **Signify Logistics Data**: Confidential, 7-year retention
- **Forecast Results**: Internal Use, 3-year retention
- **KPI Metrics**: Internal Use, 1-year retention

## 🌐 AWS SERVICES INTEGRATION

### Core AWS Services

- **Amazon Forecast**: Time-series forecasting with AutoML
- **AWS Lookout for Metrics**: Anomaly detection
- **AWS Glue**: ETL data processing pipeline
- **Step Functions**: Workflow orchestration
- **Lambda**: Serverless compute for APIs and processing
- **S3**: Data lake for raw and processed data
- **Aurora PostgreSQL**: Metadata and results storage

### Cost Optimization Focus

- Estimated monthly cost: $530-1,180
- NAT Gateway optimization implemented
- VPC Endpoints for private connectivity
- S3 Intelligent Tiering enabled

## 📊 MONITORING & OPERATIONS

### Key Dashboards

- **Business KPIs**: Forecast accuracy, truck utilization, fill rates
- **Technical Metrics**: API latency, Lambda performance, data pipeline status
- **Cost Tracking**: Service-by-service cost breakdown and optimization alerts

### Alerting Strategy

- **Critical**: Data pipeline failures, >5 API errors/min
- **Warning**: Forecast accuracy degradation, high Lambda duration
- **Info**: Daily processing completion, cost threshold alerts

## 🔧 TROUBLESHOOTING

### Common Issues

- **Data Pipeline**: Check Step Functions execution, Glue job logs
- **Forecast Accuracy**: Verify data quality, check for anomalies
- **API Performance**: Review Lambda cold starts, check concurrent executions
- **Frontend Build**: Clear node_modules, check TypeScript errors

### Emergency Contacts

- **Technical Lead**: 1CloudHub Development Team
- **AWS Support**: Premium support ticket system
- **On-Call**: Rotation schedule in PagerDuty

## 📚 DOCUMENTATION

- **Business Requirements**: `/docs/BRD.md`
- **Technical Specification**: `/docs/SRS.md`
- **API Documentation**: Auto-generated Swagger/OpenAPI
- **Architecture Diagrams**: `/docs/Application-Architecture.md`
- **Deployment Guide**: `/docs/Deployment-Operations.md`

## 🎯 CURRENT PRIORITIES

1. **Week 1-2**: Infrastructure setup and security implementation
2. **Week 3-6**: KPI engine development and dashboard creation
3. **Week 7-10**: Integration testing and performance optimization
4. **Week 11-12**: Production deployment and user training

## 🔄 WORKFLOW PATTERNS

### Development Workflow

```bash
# Feature development
git checkout -b feature/kpi-dashboard
# Make changes
npm test && pytest  # Run tests
git commit -m "feat: Add KPI dashboard components"
git push origin feature/kpi-dashboard
# Create PR for review
```

### Deployment Workflow

```bash
# Deploy to pilot environment
./scripts/deploy-aws-native.sh pilot us-east-1
# Run post-deployment validation
./scripts/post-deployment-validation.sh pilot
```

## 🤝 TEAM COLLABORATION

### Code Review Standards

- All changes require PR approval
- Automated quality checks must pass
- Security scanning on all dependencies
- Documentation updates required

### Communication Channels

- **Development**: GitHub Issues and PRs
- **Operations**: AWS CloudWatch alerts
- **Business**: Weekly stakeholder updates

---
*Last Updated: June 26, 2025*
*Version: 1.0*
*Maintainer: 1CloudHub (Co-founder, Innovator)*
