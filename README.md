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
- **Backend**: Python + FastAPI + Pandas + scikit-learn
- **Database**: PostgreSQL on AWS Aurora
- **Deployment**: AWS Amplify Gen 2 + Lambda/ECS
- **Development**: MacBook local environment with hot reload

### Key Features

- **Explainable AI**: Complete traceability from insights to source data
- **Multi-horizon Forecasting**: 1, 7, 14, and 28-day predictions
- **Interactive Dashboard**: Executive summary with drill-down capabilities
- **Real-time Processing**: Daily forecast updates with same-day insights
- **Mobile Responsive**: Tablet and mobile access for field operations

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

### 📖 [Documentation Guide](./docs/README.md)

Navigation guide for all project documentation with role-specific recommendations.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ for frontend development
- **Python** 3.11+ for backend development  
- **PostgreSQL** for local database
- **Git** for version control

### Development Setup

```bash
# Clone repository
git clone https://github.com/1cloudhub/gxo-forecasting.git
cd gxo-forecasting

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate
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

## 📊 Pilot Timeline

| Phase | Duration | Focus | Success Metrics |
|-------|----------|-------|-----------------|
| **Phase 1: Historical Validation** | Weeks 1-2 | Data integration, model accuracy | >85% forecast accuracy |
| **Phase 2: Shadow Forecasting** | Weeks 3-6 | Real-time processing, user adoption | Daily insights generation |
| **Phase 3: Operational Integration** | Weeks 7-12 | Efficiency gains, strategic value | 15% truck utilization improvement |

## 🎯 Success Criteria

### Technical Objectives

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

- **Pilot Access**: Open access during pilot phase with basic logging
- **Data Protection**: Standard AWS encryption at rest and in transit
- **Audit Trails**: Comprehensive logging for pilot validation
- **Version Control**: Secure GitHub repository with proper access controls

## 📞 Contact

For questions about:

- **Business Requirements**: Contact project sponsors or business stakeholders
- **Technical Implementation**: Contact 1CloudHub development team  
- **Project Status**: Contact project managers or technical leads

---

**Last Updated**: June 26, 2025  
**Project Status**: Documentation Complete - Ready for Development  
**Next Milestone**: GitHub repository setup and development environment initialization
