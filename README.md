# GXO Signify Forecasting Solution


> **Transforming logistics through predictive analytics and explainable AI**

A pilot project to establish GXO's **Forecasting-as-a-Service** capability, transforming the GXO-Signify partnership from reactive logistics execution to proactive, data-driven collaboration.

## 🎯 Project Overview

This pilot project develops a comprehensive forecasting platform that provides SKU-level predictions with 1-4 week visibility, generating actionable insights across four strategic categories:

- **🔧 Operational Efficiency**: Peak volume prediction, consolidation opportunities, capacity planning
- **🤝 Strategic Partnership**: Demand intelligence, product mix evolution, market timing
- **💼 Commercial Opportunity**: Service gap analysis, value-added services, pricing optimization  
- **⚠️ Risk & Resilience**: Vulnerability assessment, scenario planning, contingency strategies

## 🏗️ Technical Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui
- **Backend**: Python + FastAPI + AWS managed services integration
- **Cloud Platform**: AWS-native architecture (S3, Glue, Forecast, Lookout for Metrics)
- **Database**: PostgreSQL on AWS Aurora
- **Deployment**: AWS Amplify Gen 2 + Lambda + Step Functions
- **Development**: Local environment with AWS service integration

### Key Features

- **Explainable AI**: Complete traceability from insights to source data
- **Multi-horizon Forecasting**: 1, 7, 14, and 28-day predictions using Amazon Forecast
- **Interactive Dashboard**: Executive summary with drill-down capabilities (no authentication required)
- **Real-time Processing**: Daily forecast updates with same-day insights
- **Mobile Responsive**: Tablet and mobile access for field operations
- **AWS-Native Pipeline**: Leverages managed services for scalability and reliability

## 📚 Documentation

### 📋 [Business Requirements Document (BRD)](./docs/BRD.md)

Complete business specification including strategic objectives, success criteria, and ROI projections.

**Key Sections:**

- Executive summary and business context
- Four strategic insight categories  
- Pilot success criteria and timeline
- Business benefits and ROI analysis

### 🔧 [Software Requirements Specification (SRS)](./docs/SRS.md)

Comprehensive technical specification for development and deployment.

**Key Sections:**

- Technical architecture and technology stack
- Frontend/backend design patterns
- Database schema and API endpoints
- Development workflow and deployment strategy

### 🏗️ [Application Architecture](./docs/Application-Architecture.md)

Detailed AWS-native application architecture with KPI engines and Lambda functions.

**Key Sections:**

- AWS Data Processing Pipeline (S3, Glue, Forecast, Lookout)
- Tier 1 KPI Engines with business logic
- Lambda Function Architecture
- Frontend Dashboard Components

### 📖 [Documentation Guide](./docs/README.md)

Navigation guide for all project documentation with role-specific recommendations.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ for frontend development
- **Python** 3.11+ for backend development  
- **AWS CLI** configured for deployment
- **Git** for version control

### Repository Setup

```bash
# Clone repository
git clone https://github.com/jrkphani/Sunview.git
cd Sunview

# Verify project structure
ls -la
# Should show: docs/, raw_data/, frontend/, backend/, .gitignore, README.md
```

### Development Setup

```bash
# Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup frontend
cd ../frontend
npm install
npm run dev

# Start development servers
# Terminal 1: Backend
uvicorn main:app --reload

# Terminal 2: Frontend
npm run dev
```

### AWS Infrastructure Deployment

```bash
# Deploy AWS infrastructure (requires AWS CLI configuration)
cd infrastructure
terraform init
terraform plan
terraform apply

# Or use the provided deployment scripts
./scripts/deploy-complete.sh pilot us-east-1
```

## 📊 Pilot Timeline

| Phase | Duration | Focus | Success Metrics |
|-------|----------|-------|-----------------|
| **Phase 1: Infrastructure & Data** | Weeks 1-2 | AWS setup, data integration | Infrastructure deployed, data processing |
| **Phase 2: Forecasting & KPIs** | Weeks 3-6 | Amazon Forecast, KPI engines | >85% forecast accuracy |
| **Phase 3: Dashboard & Integration** | Weeks 7-10 | React dashboard, end-to-end testing | User adoption, insights generation |
| **Phase 4: Pilot Validation** | Weeks 11-12 | Performance optimization, business validation | 15% truck utilization improvement |

## 🎯 Success Criteria

### Technical Objectives

- [x] Repository setup and version control established
- [x] Comprehensive documentation completed
- [x] AWS-native architecture designed
- [ ] Process 17+ months of Signify historical data
- [ ] Generate all four insight categories with full explainability
- [ ] Achieve >85% forecast accuracy for top 80% SKUs by volume
- [ ] Enable drill-down from insights to source data

### Business Objectives  

- [ ] Demonstrate 15% improvement in truck utilization
- [ ] Achieve 10-20% reduction in emergency staffing costs
- [ ] Document 3+ strategic recommendations implemented
- [ ] Establish foundation for multi-client platform expansion

## 🏢 Stakeholders

- **Executive Sponsor**: GXO Regional VP
- **Project Owner**: 1CloudHub (Solution Architecture & Development)
- **Business Users**: GXO Site Managers, Signify Planning Team
- **Technical Lead**: 1CloudHub Development Team

## 📈 Business Impact

### Immediate Benefits (3-6 months)

- 10-15% reduction in labor cost variance
- 15-20% improvement in truck utilization  
- Enhanced service levels through proactive planning
- Reduced emergency costs via better capacity planning

### Strategic Benefits (6-12 months)

- Stronger client relationships through data-driven partnership
- New revenue opportunities from premium forecasting services
- Competitive differentiation in 3PL market
- Foundation for multi-client platform expansion

## 🔒 Security & Compliance

### Pilot Security Approach

- **Dashboard Access**: No authentication required for pilot validation
- **Backend Security**: Full AWS service isolation and encryption
- **Data Protection**: AWS managed encryption at rest and in transit
- **Usage Monitoring**: CloudTrail and API Gateway access logs
- **Network Security**: Private VPC subnets for all backend processing

### Post-Pilot Security Roadmap

- AWS Cognito authentication for production deployment
- Role-based access control (RBAC)
- Enhanced security monitoring and compliance frameworks
- Enterprise-grade audit trails and governance

## 📊 Current Project Status

### ✅ Completed

- **Repository Setup**: GitHub repository with comprehensive documentation
- **Security Framework**: Pilot-appropriate security with AWS service isolation  
- **Architecture Design**: Complete AWS-native architecture specification
- **Data Assets**: 17+ months of Signify historical data ready for processing
- **Documentation Suite**: BRD, SRS, Application Architecture, and operational guides

### 🚧 In Progress

- **Infrastructure Deployment**: AWS infrastructure setup and configuration
- **Development Environment**: Frontend and backend application setup
- **Data Pipeline**: AWS Glue ETL jobs and Amazon Forecast integration

### 🎯 Next Steps

1. **Week 1-2**: Deploy AWS infrastructure and data processing pipeline
2. **Week 3-4**: Implement KPI engines and Amazon Forecast integration
3. **Week 5-6**: Develop React dashboard and API endpoints
4. **Week 7-8**: End-to-end testing and pilot user onboarding

## 📞 Contact

For questions about:

- **Business Requirements**: Contact project sponsors or business stakeholders
- **Technical Implementation**: Contact 1CloudHub development team  
- **Project Status**: Contact project managers or technical leads
- **Repository Access**: [GitHub Issues](https://github.com/jrkphani/Sunview/issues)

## 📁 Project Structure

```
Sunview/
├── docs/                   # Complete project documentation
│   ├── BRD.md             # Business Requirements Document
│   ├── SRS.md             # Software Requirements Specification
│   ├── Application-Architecture.md
│   ├── Security-Compliance.md
│   └── README.md          # Documentation guide
├── raw_data/              # Signify historical data (2024-2025)
│   ├── Signify inbound report 2024 Jan to Dec.csv
│   ├── Signify inbound report 2025 Jan to May.csv
│   ├── Signify outbound report 2024 Jan to Dec.csv
│   ├── Signify outbound report 2025 Jan to May.csv
│   ├── Signify MVT 2024.csv
│   └── Signify MVT 2025.csv
├── frontend/              # React TypeScript application
├── backend/               # Python FastAPI services  
├── .gitignore            # Excludes Claude files and common artifacts
└── README.md             # This file
```

---

**Last Updated**: July 1, 2025  
**Project Status**: Foundation Complete - Infrastructure Deployment Phase  
**Repository**: [https://github.com/jrkphani/Sunview](https://github.com/jrkphani/Sunview)  
**Next Milestone**: AWS infrastructure deployment and data pipeline setup
