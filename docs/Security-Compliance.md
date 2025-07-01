# GXO Signify Forecasting Solution

## Security & Compliance Guide

**Version:** 1.0  
**Date:** June 26, 2025  
**Document Type:** Security & Compliance Specification  
**Target Audience:** Security engineers, compliance officers, risk management teams  

---

## Security Overview

The GXO Signify solution implements **pilot-appropriate security** with AWS managed service protection and data encryption. Security is designed for pilot phase validation while maintaining data protection and AWS service isolation.

### Security Principles

1. **AWS Service Isolation:** AWS managed services provide secure backend processing
2. **Data Protection:** Encryption at rest and in transit for all data
3. **Network Security:** Private VPC subnets for all backend processing
4. **Public Dashboard Access:** No authentication required for pilot dashboard
5. **Monitoring & Logging:** Track usage patterns and system health

---

## Network Security Architecture

### VPC Security Model

```
Internet Gateway (Public Traffic)
        ↓
Public Subnets (NAT Gateway, ALB Only)
        ↓
Private Subnets (All Application Components)
        ↓
VPC Endpoints (Private AWS Service Access)
        ↓
Security Groups (Application Firewall)
```

### Network Isolation Strategy

```yaml
# Network Security Configuration
VPC_CIDR: "10.0.1.0/24"  # Isolated network range

Public_Subnets:
  - "10.0.1.0/26"   # Internet-facing resources only
  - "10.0.1.64/26"  # Load balancers, NAT Gateway

Private_Subnets:
  - "10.0.1.128/26" # Application workloads (Lambda, SageMaker)
  - "10.0.1.192/26" # Database and storage access

# No Direct Internet Access for Application Components
Internet_Access: "Via NAT Gateway Only"
AWS_Service_Access: "Via VPC Endpoints (Private)"
```

### Security Groups - Application Firewall

**Lambda Function Security Group:**

```yaml
LambdaSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: "Restrictive Lambda function access"
    SecurityGroupEgress:
      # HTTPS to AWS services only
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
        Description: "HTTPS outbound for AWS API calls"
      # No HTTP outbound (force HTTPS)
      # No SSH/RDP access
      # No database direct access
    SecurityGroupIngress: []  # No inbound access required
```

**SageMaker Security Group:**

```yaml
SageMakerSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: "SageMaker ML workload isolation"
    SecurityGroupEgress:
      # Only HTTPS to AWS ML services
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        DestinationSecurityGroupId: !Ref VPCEndpointSecurityGroup
        Description: "HTTPS to VPC endpoints only"
    SecurityGroupIngress: []  # No inbound access
```

**VPC Endpoint Security Group:**

```yaml
VPCEndpointSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: "Private AWS service access"
    SecurityGroupIngress:
      # Only from application security groups
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        SourceSecurityGroupId: !Ref LambdaSecurityGroup
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        SourceSecurityGroupId: !Ref SageMakerSecurityGroup
    SecurityGroupEgress: []  # No outbound rules needed
```

---

## Pilot Phase Access Management

### No Authentication Requirement

**Dashboard Access Policy:**

```yaml
# Pilot Phase Access - No User Authentication Required
Dashboard_Access:
  Authentication: "None required for pilot"
  Authorization: "Public access to dashboard"
  Justification: "Pilot validation with known user group"
  Duration: "Pilot phase only (8-12 weeks)"
  
Security_Monitoring:
  Access_Logging: "CloudFront and API Gateway logs"
  Usage_Monitoring: "CloudWatch metrics for usage patterns"
  Anomaly_Detection: "Monitor for unusual access patterns"
```

**API Gateway Public Access:**

```yaml
API_Security_Model:
  Authentication: "None (public endpoints)"
  Rate_Limiting: "Standard AWS API Gateway rate limits"
  CORS_Policy: "Allow pilot domain origins"
  TLS_Termination: "HTTPS enforced"
  
Endpoint_Access:
  GET_Endpoints: "Public read access for dashboard"
  POST_Endpoints: "Not exposed (internal AWS services only)"
  Admin_Endpoints: "AWS service-to-service only"
```

### AWS Service-to-Service Security

**Backend Service IAM Roles:**

```yaml
# AWS services maintain strict IAM controls
Service_Isolation:
  Lambda_Functions:
    Permissions: "Minimal S3 and AWS service access"
    Network: "Private VPC subnets only"
    
  Amazon_Forecast:
    Permissions: "S3 data access for forecasting only"
    Network: "AWS managed service isolation"
    
  Lookout_Metrics:
    Permissions: "S3 metrics data access only"
    Network: "AWS managed service isolation"
```

**Lambda Execution Role - Backend Services Only:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3DataAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::gxo-signify-pilot-*/processed/*",
        "arn:aws:s3:::gxo-signify-pilot-*/forecasts/*"
      ]
    },
    {
      "Sid": "ForecastServiceAccess",
      "Effect": "Allow",
      "Action": [
        "forecast:DescribeForecast",
        "forecast:GetAccuracyMetrics"
      ],
      "Resource": "arn:aws:forecast:*:*:forecast/gxo-signify-*"
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/gxo-signify-*"
    }
  ]
}
```

### Data Access Controls

**S3 Bucket Security - Internal Data Protection:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyDirectDataAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::gxo-signify-pilot-*/raw-data/*",
        "arn:aws:s3:::gxo-signify-pilot-*/processed/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "AllowServiceRolesOnly",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::ACCOUNT:role/gxo-signify-pilot-lambda-role",
          "arn:aws:iam::ACCOUNT:role/gxo-signify-pilot-glue-role"
        ]
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::gxo-signify-pilot-*/*"
    }
  ]
}
```

---

## Data Protection & Encryption

### Encryption Strategy

**Data at Rest:**

```yaml
S3_Bucket_Encryption:
  Type: "AES-256"  # AWS managed encryption
  Purpose: "Protect stored data files"
  Key_Management: "AWS managed keys"
  
Database_Encryption:
  Type: "AES-256"
  Purpose: "Protect structured data"
  Key_Management: "AWS RDS encryption"

Lambda_Environment_Variables:
  Type: "AWS KMS"
  Purpose: "Protect configuration secrets"
  Key_Management: "Customer managed KMS keys"
```

**Data in Transit:**

```yaml
API_Gateway:
  Protocol: "HTTPS only"
  TLS_Version: "1.2 minimum"
  Certificate: "AWS Certificate Manager"

VPC_Endpoints:
  Protocol: "HTTPS"
  DNS_Resolution: "Private DNS enabled"
  Traffic_Route: "AWS backbone network"

S3_Access:
  Protocol: "HTTPS only"
  Transfer_Acceleration: "Enabled for large files"
  Bucket_Policy: "Deny non-SSL requests"
```

### Data Classification & Handling

```yaml
Data_Classification:
  Signify_Logistics_Data:
    Classification: "Confidential"
    Retention: "7 years"
    Access: "Need-to-know basis"
    Encryption: "Required"
    
  Forecast_Results:
    Classification: "Internal Use"
    Retention: "3 years"
    Access: "Business stakeholders"
    Encryption: "Required"
    
  KPI_Metrics:
    Classification: "Internal Use"
    Retention: "1 year"
    Access: "Operations teams"
    Encryption: "Required"
    
  Application_Logs:
    Classification: "Internal Use"
    Retention: "90 days"
    Access: "Technical teams"
    Encryption: "Standard"
```

---

## Compliance Framework

### Pilot Phase Compliance Approach

**Data Handling for Pilot:**

```yaml
Pilot_Data_Protection:
  Purpose: "Forecasting validation and business case development"
  Scope: "Signify logistics data only"
  Duration: "8-12 weeks pilot period"
  Access: "Known pilot user group (GXO + Signify teams)"
  
Data_Minimization:
  Source_Data: "Only necessary logistics metrics"
  Processed_Results: "Aggregated forecasts and KPIs only"
  Personal_Data: "None (logistics data only)"
  Retention: "Pilot period + 30 days for validation"
```

**Security Measures:**

```yaml
Technical_Controls:
  Encryption: "AWS managed encryption at rest and in transit"
  Network_Security: "Private VPC for backend processing"
  Access_Logging: "CloudTrail and API Gateway logs"
  Data_Processing: "AWS managed services (Forecast, Glue)"
  
Administrative_Controls:
  Data_Governance: "GXO data stewardship"
  Pilot_Agreement: "Signify-GXO data sharing terms"
  Usage_Monitoring: "CloudWatch metrics and logging"
  Post_Pilot_Cleanup: "Automated data retention policies"
```

### Audit and Compliance Monitoring

**AWS CloudTrail Configuration:**

```yaml
CloudTrail_Setup:
  Data_Events: "Enabled for S3 buckets"
  Management_Events: "All read/write events"
  Insight_Events: "Enabled for unusual activity patterns"
  Log_File_Validation: "Enabled"
  Multi_Region_Trail: "Enabled"
  KMS_Encryption: "Enabled"
  
CloudWatch_Logs_Integration:
  Real_Time_Monitoring: "Enabled"
  Log_Retention: "10 years for compliance"
  Log_Encryption: "Enabled"
```

**Compliance Automation:**

```bash
#!/bin/bash
# scripts/compliance-check.sh

echo "🔒 GXO Signify Security Compliance Check"
echo "========================================"

# Check S3 bucket encryption
echo "📦 Checking S3 bucket encryption..."
aws s3api get-bucket-encryption --bucket gxo-signify-pilot-$ACCOUNT_ID

# Check VPC Flow Logs
echo "🌐 Checking VPC Flow Logs..."
aws ec2 describe-flow-logs --filter "Name=resource-type,Values=VPC"

# Check IAM role policies
echo "👥 Checking IAM role compliance..."
aws iam list-attached-role-policies --role-name gxo-signify-pilot-lambda-role

# Check CloudTrail status
echo "📊 Checking CloudTrail logging..."
aws cloudtrail describe-trails --trail-name-list gxo-signify-audit-trail

# Check security group rules
echo "🛡️  Checking security group configurations..."
aws ec2 describe-security-groups --group-names gxo-signify-*

echo "✅ Compliance check complete"
```

---

## Pilot Monitoring & Usage Tracking

### Dashboard Usage Monitoring

**CloudWatch Monitoring for Pilot:**

```yaml
Usage_Monitoring:
  API_Gateway_Metrics:
    Metric: "RequestCount, Latency, ErrorRate"
    Purpose: "Track dashboard usage patterns"
    Alerting: "Basic health monitoring"
    
  CloudFront_Access:
    Metric: "ViewerRequests, ErrorRate"
    Purpose: "Monitor dashboard access patterns" 
    Logging: "Access logs for usage analysis"
    
  Lambda_Performance:
    Metric: "Duration, ErrorCount, Invocations"
    Purpose: "Backend processing health"
    Alerting: "Functional alerts for system issues"
    
  S3_Data_Access:
    Metric: "NumberOfObjects, BucketRequests"
    Purpose: "Monitor data processing volume"
    Alerting: "Unusual access pattern detection"
```

**Basic Security Monitoring:**

```yaml
Security_Monitoring:
  CloudTrail_Logging:
    Status: "Enabled for AWS API calls"
    Purpose: "Audit AWS service usage"
    Retention: "90 days for pilot validation"
    
  VPC_Flow_Logs:
    Status: "Enabled"
    Purpose: "Network traffic monitoring"
    Analysis: "Unusual traffic pattern detection"
    
  AWS_Config_Basic:
    Rules: "S3 encryption, VPC security groups"
    Purpose: "Configuration compliance"
    Scope: "Basic security configuration only"
```

### Pilot Issue Response Procedures

**Issue Classification for Pilot:**

```yaml
Issue_Levels:
  System_Down:
    Description: "Dashboard or API unavailable"
    Response_Time: "< 2 hours"
    Escalation: "Development team"
    
  Data_Processing_Error:
    Description: "Forecast generation or KPI calculation failure"
    Response_Time: "< 4 hours"
    Escalation: "Technical lead"
    
  Performance_Issue:
    Description: "Slow dashboard loading or API response"
    Response_Time: "< 24 hours"
    Escalation: "Operations team"
    
  Usage_Anomaly:
    Description: "Unusual access patterns or high traffic"
    Response_Time: "< 24 hours"
    Escalation: "Monitoring review"
```

**Pilot Support Procedures:**

```bash
# Pilot System Health Check
#!/bin/bash
# scripts/pilot-health-check.sh

echo "🔍 GXO Signify Pilot System Health Check"
echo "========================================"

# Check API Gateway health
echo "📡 Checking API endpoints..."
curl -f "https://${API_GATEWAY_URL}/health" || echo "❌ API Gateway issue"

# Check Lambda function status
echo "⚡ Checking Lambda functions..."
aws lambda get-function --function-name gxo-signify-pilot-kpi || echo "❌ Lambda issue"

# Check S3 data availability
echo "📦 Checking data availability..."
aws s3 ls s3://gxo-signify-pilot-${ACCOUNT_ID}/processed/ || echo "❌ Data processing issue"

# Check CloudWatch logs for errors
echo "📊 Checking recent errors..."
aws logs filter-log-events --log-group-name /aws/lambda/gxo-signify-pilot --start-time $(date -d '1 hour ago' +%s)000

echo "✅ Health check complete"
```

---

## Pilot Security Validation

### Basic Security Checks

**AWS Configuration Validation:**

```yaml
AWS_Security_Baseline:
  S3_Bucket_Encryption:
    Check: "Verify encryption enabled"
    Frequency: "Deployment verification"
    
  VPC_Security_Groups:
    Check: "No unnecessary open ports"
    Frequency: "Weekly review"
    
  IAM_Role_Permissions:
    Check: "Minimal required permissions"
    Frequency: "Monthly review"
    
  CloudTrail_Logging:
    Check: "Enabled and functioning"
    Frequency: "Daily automated check"
```

**Pilot Security Review Process:**

```yaml
Security_Reviews:
  Weekly_Health_Check:
    Focus: "System functionality and basic security"
    Team: "Development team"
    Duration: "30 minutes"
    
  Monthly_Configuration_Review:
    Focus: "AWS security configuration validation"
    Team: "Technical lead + operations"
    Duration: "1 hour"
    
  End_of_Pilot_Assessment:
    Focus: "Complete security posture review"
    Team: "All stakeholders"
    Duration: "Half day"
```

---

## Risk Management for Pilot

### Pilot Risk Assessment

```yaml
Pilot_Risks:
  Public_Dashboard_Access:
    Risk: "Uncontrolled access to dashboard"
    Mitigation: "Known user group, usage monitoring, time-limited"
    Impact: "Low - aggregated data only"
    
  Data_Processing_Errors:
    Risk: "Incorrect forecast calculations"
    Mitigation: "Data validation, testing, monitoring"
    Impact: "Medium - pilot validation affected"
    
  System_Availability:
    Risk: "Dashboard or API downtime"
    Mitigation: "AWS managed services, monitoring, quick response"
    Impact: "Low - pilot environment only"
    
  Usage_Beyond_Pilot_Group:
    Risk: "Wider access than intended"
    Mitigation: "Usage monitoring, access pattern analysis"
    Impact: "Low - no sensitive data exposed"
```

### Risk Mitigation for Pilot

**Technical Controls:**

- AWS managed service security (Forecast, Glue, Lambda)
- Data encryption at rest and in transit
- Private VPC for backend processing
- Basic system monitoring and health checks

**Administrative Controls:**

- Pilot agreement between GXO and Signify
- Usage monitoring and pattern analysis
- Regular system health reviews
- Post-pilot data cleanup procedures

---

## Conclusion

This security framework provides **pilot-appropriate protection** while maintaining the simplicity needed for rapid validation and user adoption. The approach balances data protection with accessibility for known pilot users.

**Key Security Features:**
✅ **AWS Managed Service Security**  
✅ **Data Encryption at Rest and Transit**  
✅ **Private VPC Backend Processing**  
✅ **Public Dashboard Access (No Authentication)**  
✅ **Usage Monitoring and Logging**  
✅ **Basic System Health Monitoring**  

**Pilot Security Approach:**

- **Frontend Access:** Public dashboard for pilot users (GXO + Signify teams)
- **Backend Security:** Full AWS service isolation and encryption
- **Data Protection:** Comprehensive data handling and retention controls
- **Monitoring:** Usage tracking and system health monitoring
- **Compliance:** Basic audit trails and configuration compliance

**Next Steps:**

1. Deploy AWS infrastructure with basic monitoring
2. Configure CloudTrail and usage logging
3. Establish pilot support procedures
4. Monitor usage patterns during pilot phase

**Post-Pilot Considerations:**

If the pilot proceeds to production, authentication and authorization can be added:
- AWS Cognito for user authentication
- Role-based access control (RBAC)
- Enhanced security monitoring
- Comprehensive compliance frameworks
