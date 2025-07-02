"""
Commercial Insights Service
Business intelligence and commercial optimization analysis
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, date, timedelta
import asyncio
from decimal import Decimal
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from app.utils.statistical_analysis import StatisticalAnalyzer
from app.utils.time_series_utils import TimeSeriesAnalyzer
from app.services.s3_data_service import S3DataService
from app.services.pricing_optimizer import PricingOptimizerService
from app.schemas.commercial_insights import (
    ServiceType,
    ProfitabilityLevel,
    VolatilityRisk,
    OpportunityType,
    ServiceTierAnalysisRequest,
    ServiceTierAnalysisResponse,
    ServiceTierPerformance,
    ServiceTierComparison,
    ServiceTier,
    PremiumServiceRequest,
    PremiumServiceSuggestionsResponse,
    ServiceOpportunity,
    ClientServiceProfile,
    VolatilityAnalysisRequest,
    ClientVolatilityAnalysisResponse,
    ClientVolatilityProfile,
    VolatilityMetrics,
    VolatilityBenchmark,
    PricingOptimizationRequest,
    PricingOptimizationResponse,
    RevenueOpportunityRequest,
    RevenueOpportunitiesResponse,
    RevenueOpportunity,
    RevenueImpactAnalysis,
    FinancialMetrics,
    PerformanceMetrics
)

class CommercialInsightsService:
    """Service for commercial insights and business intelligence analysis"""
    
    def __init__(self):
        self.statistical_analyzer = StatisticalAnalyzer()
        self.time_series_analyzer = TimeSeriesAnalyzer()
        self.s3_service = S3DataService()
        self.pricing_service = PricingOptimizerService()
        self.scaler = StandardScaler()
        
        # Synthetic business data for demonstration
        self.synthetic_clients = [
            f"CLIENT_{i:03d}" for i in range(1, 51)  # 50 clients
        ]
        
        self.service_tier_mapping = {
            ServiceTier.PREMIUM: {'cost_multiplier': 1.2, 'margin_target': 0.35},
            ServiceTier.STANDARD: {'cost_multiplier': 1.0, 'margin_target': 0.25},
            ServiceTier.BASIC: {'cost_multiplier': 0.85, 'margin_target': 0.15},
            ServiceTier.EXPRESS: {'cost_multiplier': 1.5, 'margin_target': 0.40},
            ServiceTier.ECONOMY: {'cost_multiplier': 0.7, 'margin_target': 0.10}
        }
    
    async def analyze_service_tier_profitability(self, request: ServiceTierAnalysisRequest) -> ServiceTierAnalysisResponse:
        """
        Analyze profitability across different service tiers
        
        Args:
            request: Service tier analysis request parameters
            
        Returns:
            Comprehensive service tier analysis response
        """
        try:
            analysis_date = request.analysis_date or date.today()
            
            # Get volume and demand data
            volume_data = await self.s3_service.get_volume_forecast_data()
            demand_data = await self.s3_service.get_demand_forecast_data(limit=None)
            
            if not volume_data and not demand_data:
                return self._create_empty_tier_response(analysis_date, "No data available")
            
            # Generate service tier performance analysis
            tier_performances = await self._analyze_tier_performances(
                volume_data, demand_data, request
            )
            
            # Calculate total revenue and margin
            total_revenue = sum(
                perf.financial_metrics.revenue for perf in tier_performances
            )
            
            if tier_performances:
                overall_margin = sum(
                    float(perf.financial_metrics.margin) for perf in tier_performances
                ) / len(tier_performances)
            else:
                overall_margin = 0.0
            
            # Generate tier comparisons
            tier_comparisons = self._generate_tier_comparisons(tier_performances)
            
            # Identify unprofitable tiers
            unprofitable_tiers = [
                perf.tier for perf in tier_performances
                if perf.profitability_level in [ProfitabilityLevel.UNPROFITABLE, ProfitabilityLevel.LOSS_MAKING]
            ]
            
            # Generate optimization opportunities
            optimization_opportunities = self._generate_optimization_opportunities(
                tier_performances, request.profitability_threshold
            )
            
            # Generate recommendations
            recommendations = self._generate_tier_recommendations(
                tier_performances, unprofitable_tiers
            )
            
            return ServiceTierAnalysisResponse(
                analysis_date=analysis_date,
                total_revenue=total_revenue,
                overall_margin=overall_margin,
                tier_performances=tier_performances,
                tier_comparisons=tier_comparisons,
                unprofitable_tiers=unprofitable_tiers,
                optimization_opportunities=optimization_opportunities,
                recommendations=recommendations
            )
            
        except Exception as e:
            return self._create_empty_tier_response(
                request.analysis_date or date.today(),
                f"Error in service tier analysis: {str(e)}"
            )
    
    async def suggest_premium_services(self, request: PremiumServiceRequest) -> PremiumServiceSuggestionsResponse:
        """
        Suggest premium service opportunities
        
        Args:
            request: Premium service request parameters
            
        Returns:
            Premium service suggestions response
        """
        try:
            analysis_date = request.analysis_date or date.today()
            
            # Get client data (synthetic for demonstration)
            client_profiles = await self._analyze_client_service_profiles(request)
            
            # Identify service opportunities
            all_opportunities = []
            for profile in client_profiles:
                all_opportunities.extend(profile.upgrade_opportunities)
            
            # Filter by opportunity threshold
            filtered_opportunities = [
                opp for opp in all_opportunities
                if opp.estimated_revenue >= request.opportunity_threshold
                and opp.payback_period_months <= request.payback_period_limit
            ]
            
            # Calculate total estimated revenue
            total_estimated_revenue = sum(
                opp.estimated_revenue for opp in filtered_opportunities
            )
            
            # Select top opportunities
            top_opportunities = sorted(
                filtered_opportunities,
                key=lambda x: x.confidence_score * float(x.estimated_revenue),
                reverse=True
            )[:10]
            
            # Generate market trends
            market_trends = self._generate_market_trends()
            
            # Create implementation roadmap
            implementation_roadmap = self._create_premium_service_roadmap(top_opportunities)
            
            # Define success metrics
            success_metrics = self._define_premium_service_metrics(filtered_opportunities)
            
            return PremiumServiceSuggestionsResponse(
                analysis_date=analysis_date,
                total_opportunities=len(filtered_opportunities),
                total_estimated_revenue=total_estimated_revenue,
                client_profiles=client_profiles,
                top_opportunities=top_opportunities,
                market_trends=market_trends,
                implementation_roadmap=implementation_roadmap,
                success_metrics=success_metrics
            )
            
        except Exception as e:
            return self._create_empty_premium_response(
                request.analysis_date or date.today(),
                f"Error in premium service analysis: {str(e)}"
            )
    
    async def analyze_client_volatility(self, request: VolatilityAnalysisRequest) -> ClientVolatilityAnalysisResponse:
        """
        Analyze client and SKU volatility patterns
        
        Args:
            request: Volatility analysis request parameters
            
        Returns:
            Client volatility analysis response
        """
        try:
            # Set analysis period
            analysis_date = request.analysis_date or date.today()
            start_date = analysis_date - timedelta(days=request.volatility_window_days)
            
            # Get demand data
            demand_data = await self.s3_service.get_demand_forecast_data(limit=None)
            
            if not demand_data:
                return self._create_empty_volatility_response(
                    analysis_date, "No demand data available"
                )
            
            # Convert to DataFrame and filter
            df = pd.DataFrame(demand_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            # Apply date filter
            df = df[df['timestamp'].dt.date >= start_date.date()]
            
            if df.empty:
                return self._create_empty_volatility_response(
                    analysis_date, "No data in analysis window"
                )
            
            # Analyze client volatility profiles
            client_profiles = await self._analyze_client_volatility_profiles(
                df, request
            )
            
            # Create volatility distribution
            volatility_distribution = self._create_volatility_distribution(client_profiles)
            
            # Generate volatility benchmarks
            volatility_benchmarks = self._generate_volatility_benchmarks(client_profiles)
            
            # Generate high-risk alerts
            high_risk_alerts = self._generate_high_risk_alerts(
                client_profiles, request.risk_threshold
            )
            
            # Generate portfolio recommendations
            portfolio_recommendations = self._generate_portfolio_recommendations(
                client_profiles, volatility_distribution
            )
            
            analysis_period = {
                'start_date': start_date,
                'end_date': analysis_date
            }
            
            return ClientVolatilityAnalysisResponse(
                analysis_period=analysis_period,
                total_clients_analyzed=len(client_profiles),
                volatility_distribution=volatility_distribution,
                client_profiles=client_profiles,
                volatility_benchmarks=volatility_benchmarks,
                high_risk_alerts=high_risk_alerts,
                portfolio_recommendations=portfolio_recommendations
            )
            
        except Exception as e:
            return self._create_empty_volatility_response(
                request.analysis_date or date.today(),
                f"Error in volatility analysis: {str(e)}"
            )
    
    async def optimize_pricing(self, request: PricingOptimizationRequest) -> PricingOptimizationResponse:
        """
        Optimize pricing using the dedicated pricing service
        
        Args:
            request: Pricing optimization request parameters
            
        Returns:
            Pricing optimization response
        """
        return await self.pricing_service.optimize_pricing(
            service_filter=request.service_filter,
            client_filter=request.client_filter,
            analysis_date=request.analysis_date,
            elasticity_confidence_threshold=request.elasticity_confidence_threshold,
            max_price_change=request.max_price_change
        )
    
    async def identify_revenue_opportunities(self, request: RevenueOpportunityRequest) -> RevenueOpportunitiesResponse:
        """
        Identify revenue optimization opportunities
        
        Args:
            request: Revenue opportunity request parameters
            
        Returns:
            Revenue opportunities response
        """
        try:
            analysis_date = request.analysis_date or date.today()
            
            # Generate revenue opportunities across different types
            opportunities = []
            
            for opportunity_type in request.opportunity_types:
                type_opportunities = await self._generate_opportunities_by_type(
                    opportunity_type, request
                )
                opportunities.extend(type_opportunities)
            
            # Filter by size and implementation time
            filtered_opportunities = [
                opp for opp in opportunities
                if opp.estimated_revenue >= request.min_opportunity_size
                and opp.time_to_realize <= request.max_implementation_months
            ]
            
            # Calculate total revenue potential
            total_revenue_potential = sum(
                opp.estimated_revenue for opp in filtered_opportunities
            )
            
            # Perform revenue impact analysis
            impact_analysis = self._perform_revenue_impact_analysis(filtered_opportunities)
            
            # Create prioritization matrix
            prioritization_matrix = self._create_prioritization_matrix(filtered_opportunities)
            
            # Identify quick wins and strategic initiatives
            quick_wins = [
                opp for opp in filtered_opportunities
                if opp.time_to_realize <= 6 and opp.implementation_effort == "Low"
            ]
            
            strategic_initiatives = [
                opp for opp in filtered_opportunities
                if opp.estimated_revenue >= Decimal('50000') and opp.time_to_realize > 6
            ]
            
            # Create execution roadmap
            execution_roadmap = self._create_execution_roadmap(filtered_opportunities)
            
            return RevenueOpportunitiesResponse(
                analysis_date=analysis_date,
                total_opportunities=len(filtered_opportunities),
                total_revenue_potential=total_revenue_potential,
                opportunities=filtered_opportunities,
                impact_analysis=impact_analysis,
                prioritization_matrix=prioritization_matrix,
                quick_wins=quick_wins,
                strategic_initiatives=strategic_initiatives,
                execution_roadmap=execution_roadmap
            )
            
        except Exception as e:
            return self._create_empty_revenue_response(
                request.analysis_date or date.today(),
                f"Error in revenue opportunity analysis: {str(e)}"
            )
    
    # Helper methods for service tier analysis
    async def _analyze_tier_performances(self, 
                                       volume_data: List[Dict], 
                                       demand_data: List[Dict],
                                       request: ServiceTierAnalysisRequest) -> List[ServiceTierPerformance]:
        """Analyze performance for each service tier"""
        performances = []
        
        try:
            # Calculate base volume from data
            if volume_data:
                base_volume = sum(item.get('target_value', 0) for item in volume_data) / len(volume_data)
            else:
                base_volume = 1000.0  # Default
            
            for tier in ServiceTier:
                # Generate synthetic performance data
                tier_config = self.service_tier_mapping[tier]
                
                # Financial metrics
                volume_handled = base_volume * tier_config['cost_multiplier']
                base_revenue = volume_handled * 25.0  # $25 per unit
                revenue = Decimal(str(base_revenue))
                
                cost_ratio = 1.0 - tier_config['margin_target']
                cost = revenue * Decimal(str(cost_ratio))
                margin = revenue - cost
                margin_percentage = float(margin / revenue * 100)
                
                financial_metrics = FinancialMetrics(
                    revenue=revenue,
                    cost=cost,
                    margin=margin,
                    margin_percentage=margin_percentage,
                    roi=margin_percentage / 100.0 * 2.0  # Simplified ROI
                )
                
                # Performance metrics
                service_level = 85.0 + (list(ServiceTier).index(tier) * 3.0)  # Vary by tier
                efficiency_score = 0.6 + (tier_config['margin_target'] * 0.8)
                quality_score = 0.7 + (tier_config['margin_target'] * 0.6)
                
                performance_metrics = PerformanceMetrics(
                    volume_handled=volume_handled,
                    service_level=min(99.0, service_level),
                    efficiency_score=min(1.0, efficiency_score),
                    quality_score=min(1.0, quality_score)
                )
                
                # Client count (synthetic)
                client_count = max(1, int(50 * tier_config['cost_multiplier'] / 2))
                
                # Volume share
                total_volume = base_volume * sum(config['cost_multiplier'] for config in self.service_tier_mapping.values())
                volume_share = (volume_handled / total_volume) * 100
                
                # Profitability level
                if margin_percentage >= 30:
                    profitability_level = ProfitabilityLevel.HIGHLY_PROFITABLE
                elif margin_percentage >= 20:
                    profitability_level = ProfitabilityLevel.PROFITABLE
                elif margin_percentage >= 10:
                    profitability_level = ProfitabilityLevel.BREAK_EVEN
                elif margin_percentage >= 0:
                    profitability_level = ProfitabilityLevel.UNPROFITABLE
                else:
                    profitability_level = ProfitabilityLevel.LOSS_MAKING
                
                # Improvement potential
                target_margin = tier_config['margin_target'] * 100
                improvement_potential = max(0.0, (target_margin - margin_percentage) / target_margin)
                
                performances.append(ServiceTierPerformance(
                    tier=tier,
                    financial_metrics=financial_metrics,
                    performance_metrics=performance_metrics,
                    client_count=client_count,
                    volume_share=volume_share,
                    profitability_level=profitability_level,
                    improvement_potential=improvement_potential
                ))
                
        except Exception as e:
            print(f"Error analyzing tier performances: {str(e)}")
        
        return performances
    
    def _generate_tier_comparisons(self, performances: List[ServiceTierPerformance]) -> List[ServiceTierComparison]:
        """Generate comparisons between service tiers"""
        comparisons = []
        
        try:
            for i, perf_a in enumerate(performances):
                for perf_b in performances[i+1:]:
                    revenue_diff = perf_a.financial_metrics.revenue - perf_b.financial_metrics.revenue
                    margin_diff = perf_a.financial_metrics.margin_percentage - perf_b.financial_metrics.margin_percentage
                    volume_diff = perf_a.performance_metrics.volume_handled - perf_b.performance_metrics.volume_handled
                    
                    # Generate recommendation
                    if revenue_diff > 0 and margin_diff > 0:
                        recommendation = f"{perf_a.tier.value} outperforms {perf_b.tier.value} in both revenue and margin"
                    elif revenue_diff > 0:
                        recommendation = f"{perf_a.tier.value} generates higher revenue than {perf_b.tier.value}"
                    elif margin_diff > 0:
                        recommendation = f"{perf_a.tier.value} has better margins than {perf_b.tier.value}"
                    else:
                        recommendation = f"Consider optimizing {perf_a.tier.value} relative to {perf_b.tier.value}"
                    
                    comparisons.append(ServiceTierComparison(
                        tier_a=perf_a.tier,
                        tier_b=perf_b.tier,
                        revenue_difference=revenue_diff,
                        margin_difference=margin_diff,
                        volume_difference=volume_diff,
                        recommendation=recommendation
                    ))
                    
        except Exception as e:
            print(f"Error generating tier comparisons: {str(e)}")
        
        return comparisons
    
    def _generate_optimization_opportunities(self, 
                                           performances: List[ServiceTierPerformance],
                                           profitability_threshold: float) -> List[Dict[str, Any]]:
        """Generate optimization opportunities"""
        opportunities = []
        
        try:
            for perf in performances:
                if perf.financial_metrics.margin_percentage < profitability_threshold * 100:
                    opportunity = {
                        'tier': perf.tier.value,
                        'current_margin': perf.financial_metrics.margin_percentage,
                        'target_margin': profitability_threshold * 100,
                        'improvement_needed': (profitability_threshold * 100) - perf.financial_metrics.margin_percentage,
                        'revenue_at_risk': float(perf.financial_metrics.revenue),
                        'recommended_actions': self._get_tier_improvement_actions(perf)
                    }
                    opportunities.append(opportunity)
                    
        except Exception as e:
            opportunities.append({'error': str(e)})
        
        return opportunities
    
    def _get_tier_improvement_actions(self, performance: ServiceTierPerformance) -> List[str]:
        """Get improvement actions for a service tier"""
        actions = []
        
        try:
            if performance.financial_metrics.margin_percentage < 10:
                actions.extend([
                    "Review cost structure and pricing",
                    "Implement cost reduction initiatives",
                    "Consider service tier restructuring"
                ])
            
            if performance.performance_metrics.efficiency_score < 0.7:
                actions.append("Improve operational efficiency")
            
            if performance.performance_metrics.service_level < 90:
                actions.append("Enhance service level delivery")
            
            if performance.improvement_potential > 0.3:
                actions.append("High improvement potential - prioritize optimization")
                
        except:
            actions.append("Review tier performance metrics")
        
        return actions
    
    def _generate_tier_recommendations(self, 
                                     performances: List[ServiceTierPerformance],
                                     unprofitable_tiers: List[ServiceTier]) -> List[str]:
        """Generate tier-level recommendations"""
        recommendations = []
        
        try:
            # Overall portfolio recommendations
            total_margin = sum(p.financial_metrics.margin_percentage for p in performances) / len(performances)
            recommendations.append(f"Overall portfolio margin: {total_margin:.1f}%")
            
            # Unprofitable tier recommendations
            if unprofitable_tiers:
                recommendations.append(f"Immediate attention needed for {len(unprofitable_tiers)} unprofitable tiers")
            
            # Best performing tier
            best_tier = max(performances, key=lambda p: p.financial_metrics.margin_percentage)
            recommendations.append(f"Best performing tier: {best_tier.tier.value} with {best_tier.financial_metrics.margin_percentage:.1f}% margin")
            
            # Growth opportunities
            high_potential_tiers = [p for p in performances if p.improvement_potential > 0.2]
            if high_potential_tiers:
                recommendations.append(f"High improvement potential in {len(high_potential_tiers)} tiers")
            
            # Strategic recommendations
            recommendations.extend([
                "Implement tier-specific pricing strategies",
                "Consider service tier consolidation for low-performing tiers",
                "Develop tier migration strategies for clients",
                "Establish tier performance monitoring and alerts"
            ])
            
        except Exception as e:
            recommendations.append(f"Error generating recommendations: {str(e)}")
        
        return recommendations
    
    # Helper methods for premium service analysis
    async def _analyze_client_service_profiles(self, request: PremiumServiceRequest) -> List[ClientServiceProfile]:
        """Analyze client service profiles for premium opportunities"""
        profiles = []
        
        try:
            # Use subset of synthetic clients
            clients_to_analyze = self.synthetic_clients[:20]  # Analyze 20 clients
            
            for client_id in clients_to_analyze:
                # Generate synthetic client data
                client_name = f"Client {client_id.split('_')[1]}"
                
                # Current services (random selection)
                current_services = [
                    ServiceType.WAREHOUSING,
                    ServiceType.TRANSPORTATION
                ]
                
                # Service spend (synthetic)
                base_spend = Decimal(str(50000 + (int(client_id.split('_')[1]) * 1000)))
                service_spend = base_spend * Decimal(str(0.8 + np.random.random() * 0.4))
                
                # Service utilization
                service_utilization = 0.6 + np.random.random() * 0.3
                
                # Generate upgrade opportunities
                upgrade_opportunities = self._generate_upgrade_opportunities(
                    client_id, current_services, service_spend, request
                )
                
                # Cross-sell potential
                cross_sell_potential = min(1.0, len(upgrade_opportunities) / 5.0)
                
                profiles.append(ClientServiceProfile(
                    client_id=client_id,
                    client_name=client_name,
                    current_services=current_services,
                    service_spend=service_spend,
                    service_utilization=service_utilization,
                    upgrade_opportunities=upgrade_opportunities,
                    cross_sell_potential=cross_sell_potential
                ))
                
        except Exception as e:
            print(f"Error analyzing client profiles: {str(e)}")
        
        return profiles
    
    def _generate_upgrade_opportunities(self, 
                                      client_id: str,
                                      current_services: List[ServiceType],
                                      current_spend: Decimal,
                                      request: PremiumServiceRequest) -> List[ServiceOpportunity]:
        """Generate upgrade opportunities for a client"""
        opportunities = []
        
        try:
            # Potential new services
            potential_services = [
                (ServiceType.VALUE_ADDED, "Premium Value-Added Services"),
                (ServiceType.CONSULTING, "Supply Chain Consulting"),
                (ServiceType.TECHNOLOGY, "Advanced Analytics Platform")
            ]
            
            for service_type, service_name in potential_services:
                if service_type not in current_services:
                    # Estimate revenue potential
                    base_revenue = current_spend * Decimal(str(0.1 + np.random.random() * 0.2))
                    estimated_revenue = max(request.opportunity_threshold, base_revenue)
                    
                    # Implementation cost
                    implementation_cost = estimated_revenue * Decimal(str(0.3 + np.random.random() * 0.2))
                    
                    # Payback period
                    annual_revenue = estimated_revenue
                    payback_period = max(6, int(float(implementation_cost / annual_revenue) * 12))
                    
                    if payback_period <= request.payback_period_limit:
                        # Confidence score
                        confidence = 0.6 + np.random.random() * 0.3
                        
                        # Risk factors
                        risk_factors = self._identify_opportunity_risks(service_type, client_id)
                        
                        opportunities.append(ServiceOpportunity(
                            service_name=service_name,
                            service_type=service_type,
                            target_clients=[client_id],
                            estimated_revenue=estimated_revenue,
                            implementation_cost=implementation_cost,
                            payback_period_months=payback_period,
                            confidence_score=confidence,
                            risk_factors=risk_factors
                        ))
                        
        except Exception as e:
            print(f"Error generating opportunities for {client_id}: {str(e)}")
        
        return opportunities
    
    def _identify_opportunity_risks(self, service_type: ServiceType, client_id: str) -> List[str]:
        """Identify risks for service opportunities"""
        risks = []
        
        try:
            # Service-specific risks
            if service_type == ServiceType.CONSULTING:
                risks.extend([
                    "Requires specialized expertise",
                    "Client readiness for advisory services",
                    "Long sales cycle"
                ])
            elif service_type == ServiceType.TECHNOLOGY:
                risks.extend([
                    "Technology adoption challenges",
                    "Integration complexity",
                    "Training requirements"
                ])
            elif service_type == ServiceType.VALUE_ADDED:
                risks.extend([
                    "Operational complexity",
                    "Quality control requirements",
                    "Capacity constraints"
                ])
            
            # Client-specific risks (simplified)
            client_num = int(client_id.split('_')[1])
            if client_num < 20:
                risks.append("Smaller client - budget constraints possible")
            
        except:
            risks.append("Standard implementation risks")
        
        return risks
    
    # Helper methods for volatility analysis
    async def _analyze_client_volatility_profiles(self, 
                                                df: pd.DataFrame,
                                                request: VolatilityAnalysisRequest) -> List[ClientVolatilityProfile]:
        """Analyze volatility profiles for clients"""
        profiles = []
        
        try:
            # Group data by synthetic clients
            clients_to_analyze = self.synthetic_clients[:15]  # Analyze 15 clients
            
            for i, client_id in enumerate(clients_to_analyze):
                client_name = f"Client {client_id.split('_')[1]}"
                
                # Get client's portion of data
                start_idx = i * len(df) // len(clients_to_analyze)
                end_idx = (i + 1) * len(df) // len(clients_to_analyze)
                client_data = df.iloc[start_idx:end_idx]
                
                if len(client_data) < 10:
                    continue
                
                # Calculate volatility metrics
                demand_values = client_data['target_value'].values
                volatility_metrics = self._calculate_client_volatility_metrics(demand_values)
                
                # Determine volatility risk level
                volatility_risk = self._classify_volatility_risk(volatility_metrics.volatility_score)
                
                # SKU volatility breakdown
                sku_breakdown = self._calculate_sku_volatility_breakdown(client_data)
                
                # Historical volatility trend (simplified)
                historical_trend = self._calculate_historical_volatility_trend(demand_values)
                
                # Risk mitigation strategies
                risk_strategies = self._generate_risk_mitigation_strategies(volatility_risk, volatility_metrics)
                
                # Contract recommendations
                contract_recommendations = self._generate_contract_recommendations(volatility_risk)
                
                profiles.append(ClientVolatilityProfile(
                    client_id=client_id,
                    client_name=client_name,
                    volatility_risk=volatility_risk,
                    volatility_metrics=volatility_metrics,
                    sku_volatility_breakdown=sku_breakdown,
                    historical_volatility_trend=historical_trend,
                    risk_mitigation_strategies=risk_strategies,
                    contract_recommendations=contract_recommendations
                ))
                
        except Exception as e:
            print(f"Error analyzing volatility profiles: {str(e)}")
        
        return profiles
    
    def _calculate_client_volatility_metrics(self, demand_values: np.ndarray) -> VolatilityMetrics:
        """Calculate volatility metrics for a client"""
        try:
            # Use statistical analyzer for base metrics
            volatility_result = self.statistical_analyzer.calculate_volatility_metrics(demand_values)
            
            # Additional volatility-specific metrics
            trend_result = self.statistical_analyzer.analyze_trend(demand_values)
            trend_stability = trend_result.get('r_squared', 0.0)
            
            # Seasonal impact (simplified)
            seasonality_result = self.statistical_analyzer.detect_seasonality_fft(demand_values)
            seasonal_impact = seasonality_result.get('dominant_strength', 0.0)
            
            return VolatilityMetrics(
                coefficient_of_variation=volatility_result['coefficient_of_variation'],
                standard_deviation=volatility_result['standard_deviation'],
                volatility_score=volatility_result['volatility_score'],
                trend_stability=trend_stability,
                seasonal_impact=seasonal_impact
            )
            
        except Exception as e:
            return VolatilityMetrics(
                coefficient_of_variation=0.0,
                standard_deviation=0.0,
                volatility_score=0.0,
                trend_stability=0.0,
                seasonal_impact=0.0
            )
    
    def _classify_volatility_risk(self, volatility_score: float) -> VolatilityRisk:
        """Classify volatility score into risk levels"""
        if volatility_score >= 0.8:
            return VolatilityRisk.EXTREME
        elif volatility_score >= 0.6:
            return VolatilityRisk.VERY_HIGH
        elif volatility_score >= 0.4:
            return VolatilityRisk.HIGH
        elif volatility_score >= 0.2:
            return VolatilityRisk.MODERATE
        else:
            return VolatilityRisk.LOW
    
    def _calculate_sku_volatility_breakdown(self, client_data: pd.DataFrame) -> Dict[str, VolatilityMetrics]:
        """Calculate volatility breakdown by SKU"""
        breakdown = {}
        
        try:
            # Group by SKU
            for sku_id in client_data['item_id'].unique():
                sku_data = client_data[client_data['item_id'] == sku_id]
                
                if len(sku_data) >= 5:  # Minimum data points
                    sku_values = sku_data['target_value'].values
                    breakdown[sku_id] = self._calculate_client_volatility_metrics(sku_values)
                    
        except Exception as e:
            breakdown['error'] = str(e)
        
        return breakdown
    
    def _calculate_historical_volatility_trend(self, demand_values: np.ndarray) -> List[Dict[str, Any]]:
        """Calculate historical volatility trend"""
        trend = []
        
        try:
            # Calculate rolling volatility
            window_size = max(10, len(demand_values) // 6)
            
            for i in range(window_size, len(demand_values), window_size // 2):
                window_data = demand_values[i-window_size:i]
                volatility_result = self.statistical_analyzer.calculate_volatility_metrics(window_data)
                
                trend.append({
                    'period': i // (window_size // 2),
                    'volatility_score': volatility_result['volatility_score'],
                    'coefficient_of_variation': volatility_result['coefficient_of_variation']
                })
                
        except Exception as e:
            trend.append({'error': str(e)})
        
        return trend
    
    def _generate_risk_mitigation_strategies(self, 
                                           risk_level: VolatilityRisk,
                                           metrics: VolatilityMetrics) -> List[str]:
        """Generate risk mitigation strategies"""
        strategies = []
        
        try:
            if risk_level in [VolatilityRisk.HIGH, VolatilityRisk.VERY_HIGH, VolatilityRisk.EXTREME]:
                strategies.extend([
                    "Implement demand smoothing mechanisms",
                    "Develop flexible capacity planning",
                    "Consider risk-sharing contract terms",
                    "Establish safety stock buffers"
                ])
            
            if metrics.seasonal_impact > 0.4:
                strategies.append("Develop seasonal demand management strategies")
            
            if metrics.trend_stability < 0.3:
                strategies.append("Implement trend monitoring and early warning systems")
            
            # General strategies
            strategies.extend([
                "Regular demand pattern review and adjustment",
                "Diversification across multiple SKUs/clients",
                "Collaborative forecasting with client"
            ])
            
        except Exception as e:
            strategies.append(f"Error generating strategies: {str(e)}")
        
        return strategies
    
    def _generate_contract_recommendations(self, risk_level: VolatilityRisk) -> List[str]:
        """Generate contract recommendations based on volatility"""
        recommendations = []
        
        try:
            if risk_level == VolatilityRisk.EXTREME:
                recommendations.extend([
                    "Consider minimum volume guarantees",
                    "Implement volatility penalties/incentives",
                    "Shorter contract terms with frequent reviews"
                ])
            elif risk_level == VolatilityRisk.VERY_HIGH:
                recommendations.extend([
                    "Flexible pricing based on volume tiers",
                    "Quarterly volume reconciliation",
                    "Risk-sharing mechanisms"
                ])
            elif risk_level == VolatilityRisk.HIGH:
                recommendations.extend([
                    "Volume commitment with flexibility bands",
                    "Semi-annual contract reviews"
                ])
            else:
                recommendations.extend([
                    "Standard contract terms acceptable",
                    "Annual volume commitments"
                ])
                
        except Exception as e:
            recommendations.append(f"Error generating recommendations: {str(e)}")
        
        return recommendations
    
    # Additional helper methods for creating empty responses and generating revenue opportunities
    def _create_empty_tier_response(self, analysis_date: date, reason: str) -> ServiceTierAnalysisResponse:
        """Create empty service tier response"""
        return ServiceTierAnalysisResponse(
            analysis_date=analysis_date,
            total_revenue=Decimal('0'),
            overall_margin=0.0,
            tier_performances=[],
            tier_comparisons=[],
            unprofitable_tiers=[],
            optimization_opportunities=[],
            recommendations=[reason, "Ensure sufficient data is available for service tier analysis"]
        )
    
    def _create_empty_premium_response(self, analysis_date: date, reason: str) -> PremiumServiceSuggestionsResponse:
        """Create empty premium service response"""
        return PremiumServiceSuggestionsResponse(
            analysis_date=analysis_date,
            total_opportunities=0,
            total_estimated_revenue=Decimal('0'),
            client_profiles=[],
            top_opportunities=[],
            market_trends=[reason],
            implementation_roadmap=[],
            success_metrics={}
        )
    
    def _create_empty_volatility_response(self, analysis_date: date, reason: str) -> ClientVolatilityAnalysisResponse:
        """Create empty volatility response"""
        return ClientVolatilityAnalysisResponse(
            analysis_period={'start_date': analysis_date, 'end_date': analysis_date},
            total_clients_analyzed=0,
            volatility_distribution={risk: 0 for risk in VolatilityRisk},
            client_profiles=[],
            volatility_benchmarks=VolatilityBenchmark(
                industry_average=0.0,
                peer_group_average=0.0,
                top_quartile_threshold=0.0,
                bottom_quartile_threshold=0.0
            ),
            high_risk_alerts=[],
            portfolio_recommendations=[reason, "Ensure sufficient data is available for volatility analysis"]
        )
    
    def _create_empty_revenue_response(self, analysis_date: date, reason: str) -> RevenueOpportunitiesResponse:
        """Create empty revenue opportunities response"""
        return RevenueOpportunitiesResponse(
            analysis_date=analysis_date,
            total_opportunities=0,
            total_revenue_potential=Decimal('0'),
            opportunities=[],
            impact_analysis=RevenueImpactAnalysis(
                short_term_impact=Decimal('0'),
                medium_term_impact=Decimal('0'),
                long_term_impact=Decimal('0'),
                cumulative_impact=Decimal('0'),
                roi_percentage=0.0
            ),
            prioritization_matrix=[],
            quick_wins=[],
            strategic_initiatives=[],
            execution_roadmap=[{'error': reason}]
        )
    
    # Additional helper methods for revenue opportunity analysis
    async def _generate_opportunities_by_type(self, 
                                            opportunity_type: OpportunityType,
                                            request: RevenueOpportunityRequest) -> List[RevenueOpportunity]:
        """Generate opportunities by type"""
        opportunities = []
        
        try:
            if opportunity_type == OpportunityType.PRICING_OPTIMIZATION:
                opportunities.extend(self._generate_pricing_opportunities(request))
            elif opportunity_type == OpportunityType.SERVICE_UPGRADE:
                opportunities.extend(self._generate_service_upgrade_opportunities(request))
            elif opportunity_type == OpportunityType.COST_REDUCTION:
                opportunities.extend(self._generate_cost_reduction_opportunities(request))
            elif opportunity_type == OpportunityType.VOLUME_EXPANSION:
                opportunities.extend(self._generate_volume_expansion_opportunities(request))
            elif opportunity_type == OpportunityType.NEW_SERVICE:
                opportunities.extend(self._generate_new_service_opportunities(request))
                
        except Exception as e:
            print(f"Error generating {opportunity_type} opportunities: {str(e)}")
        
        return opportunities
    
    def _generate_pricing_opportunities(self, request: RevenueOpportunityRequest) -> List[RevenueOpportunity]:
        """Generate pricing optimization opportunities"""
        opportunities = []
        
        try:
            # Sample pricing opportunities
            pricing_opps = [
                {
                    'description': 'Optimize warehousing service pricing based on demand elasticity',
                    'estimated_revenue': Decimal('75000'),
                    'implementation_effort': 'Medium',
                    'time_to_realize': 4,
                    'confidence': 0.8
                },
                {
                    'description': 'Implement dynamic pricing for transportation services',
                    'estimated_revenue': Decimal('120000'),
                    'implementation_effort': 'High',
                    'time_to_realize': 8,
                    'confidence': 0.7
                },
                {
                    'description': 'Premium pricing for express delivery services',
                    'estimated_revenue': Decimal('45000'),
                    'implementation_effort': 'Low',
                    'time_to_realize': 2,
                    'confidence': 0.9
                }
            ]
            
            for i, opp_data in enumerate(pricing_opps):
                opportunity = RevenueOpportunity(
                    opportunity_id=f"PRICING_{i+1:03d}",
                    opportunity_type=OpportunityType.PRICING_OPTIMIZATION,
                    description=opp_data['description'],
                    target_clients=self.synthetic_clients[:5],  # Target top 5 clients
                    estimated_revenue=opp_data['estimated_revenue'],
                    implementation_effort=opp_data['implementation_effort'],
                    time_to_realize=opp_data['time_to_realize'],
                    confidence_level=opp_data['confidence'],
                    dependencies=['Market analysis', 'Competitive benchmarking']
                )
                opportunities.append(opportunity)
                
        except Exception as e:
            print(f"Error generating pricing opportunities: {str(e)}")
        
        return opportunities
    
    def _generate_service_upgrade_opportunities(self, request: RevenueOpportunityRequest) -> List[RevenueOpportunity]:
        """Generate service upgrade opportunities"""
        opportunities = []
        
        try:
            upgrade_opps = [
                {
                    'description': 'Upgrade basic clients to standard service tier',
                    'estimated_revenue': Decimal('95000'),
                    'implementation_effort': 'Medium',
                    'time_to_realize': 6,
                    'confidence': 0.75
                },
                {
                    'description': 'Introduce premium consulting services for top clients',
                    'estimated_revenue': Decimal('150000'),
                    'implementation_effort': 'High',
                    'time_to_realize': 10,
                    'confidence': 0.65
                }
            ]
            
            for i, opp_data in enumerate(upgrade_opps):
                opportunity = RevenueOpportunity(
                    opportunity_id=f"UPGRADE_{i+1:03d}",
                    opportunity_type=OpportunityType.SERVICE_UPGRADE,
                    description=opp_data['description'],
                    target_clients=self.synthetic_clients[5:15],  # Target middle tier clients
                    estimated_revenue=opp_data['estimated_revenue'],
                    implementation_effort=opp_data['implementation_effort'],
                    time_to_realize=opp_data['time_to_realize'],
                    confidence_level=opp_data['confidence'],
                    dependencies=['Client readiness assessment', 'Service capability development']
                )
                opportunities.append(opportunity)
                
        except Exception as e:
            print(f"Error generating upgrade opportunities: {str(e)}")
        
        return opportunities
    
    def _generate_cost_reduction_opportunities(self, request: RevenueOpportunityRequest) -> List[RevenueOpportunity]:
        """Generate cost reduction opportunities"""
        opportunities = []
        
        try:
            cost_opps = [
                {
                    'description': 'Implement automation in warehouse operations',
                    'estimated_revenue': Decimal('200000'),  # Savings as revenue
                    'implementation_effort': 'High',
                    'time_to_realize': 12,
                    'confidence': 0.8
                },
                {
                    'description': 'Optimize transportation routes and scheduling',
                    'estimated_revenue': Decimal('85000'),
                    'implementation_effort': 'Medium',
                    'time_to_realize': 5,
                    'confidence': 0.85
                }
            ]
            
            for i, opp_data in enumerate(cost_opps):
                opportunity = RevenueOpportunity(
                    opportunity_id=f"COST_{i+1:03d}",
                    opportunity_type=OpportunityType.COST_REDUCTION,
                    description=opp_data['description'],
                    target_clients=[],  # Internal opportunity
                    estimated_revenue=opp_data['estimated_revenue'],
                    implementation_effort=opp_data['implementation_effort'],
                    time_to_realize=opp_data['time_to_realize'],
                    confidence_level=opp_data['confidence'],
                    dependencies=['Technology investment', 'Process redesign']
                )
                opportunities.append(opportunity)
                
        except Exception as e:
            print(f"Error generating cost reduction opportunities: {str(e)}")
        
        return opportunities
    
    def _generate_portfolio_recommendations(self, 
                                          profiles: List[ClientVolatilityProfile],
                                          distribution: Dict[VolatilityRisk, int]) -> List[str]:
        """Generate portfolio-level recommendations"""
        recommendations = []
        
        try:
            total_clients = len(profiles)
            if total_clients == 0:
                return ["No client data available for analysis"]
            
            # High-risk client percentage
            high_risk_count = distribution.get(VolatilityRisk.HIGH, 0) + distribution.get(VolatilityRisk.VERY_HIGH, 0) + distribution.get(VolatilityRisk.EXTREME, 0)
            high_risk_percentage = (high_risk_count / total_clients) * 100
            
            if high_risk_percentage > 30:
                recommendations.append(f"High portfolio risk: {high_risk_percentage:.1f}% of clients are high volatility")
                recommendations.append("Consider portfolio diversification strategies")
            
            # Specific recommendations
            if distribution.get(VolatilityRisk.EXTREME, 0) > 0:
                recommendations.append("Immediate action required for extreme volatility clients")
            
            recommendations.extend([
                "Implement tiered risk management strategies",
                "Develop client-specific volatility monitoring",
                "Consider risk-adjusted pricing models",
                "Establish volatility thresholds and automated alerts"
            ])
            
        except Exception as e:
            recommendations.append(f"Error generating recommendations: {str(e)}")
        
        return recommendations