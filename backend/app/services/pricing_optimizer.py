"""
Pricing Optimizer Service
Advanced pricing optimization using demand elasticity analysis and revenue modeling
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, date, timedelta
import asyncio
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score
from scipy import optimize
from decimal import Decimal
import warnings

from app.utils.statistical_analysis import StatisticalAnalyzer
from app.utils.time_series_utils import TimeSeriesAnalyzer
from app.services.s3_data_service import S3DataService
from app.schemas.commercial_insights import (
    ServiceType,
    PricingStrategy,
    DemandElasticity,
    PricingScenario,
    ServicePricingOptimization,
    PricingOptimizationResponse
)

class PricingOptimizerService:
    """Service for pricing optimization using advanced analytics and demand modeling"""
    
    def __init__(self):
        self.statistical_analyzer = StatisticalAnalyzer()
        self.time_series_analyzer = TimeSeriesAnalyzer()
        self.s3_service = S3DataService()
        self.scaler = StandardScaler()
        
        # Default pricing data (in practice, would come from pricing database)
        self.default_pricing = {
            ServiceType.WAREHOUSING: Decimal('15.50'),
            ServiceType.TRANSPORTATION: Decimal('2.85'),
            ServiceType.VALUE_ADDED: Decimal('8.75'),
            ServiceType.CONSULTING: Decimal('125.00'),
            ServiceType.TECHNOLOGY: Decimal('45.00')
        }
        
        # Default cost structure (simplified)
        self.cost_ratios = {
            ServiceType.WAREHOUSING: 0.65,  # 65% cost ratio
            ServiceType.TRANSPORTATION: 0.75,
            ServiceType.VALUE_ADDED: 0.55,
            ServiceType.CONSULTING: 0.40,
            ServiceType.TECHNOLOGY: 0.30
        }
        
    async def optimize_pricing(self,
                             service_filter: Optional[List[ServiceType]] = None,
                             client_filter: Optional[List[str]] = None,
                             analysis_date: Optional[date] = None,
                             elasticity_confidence_threshold: float = 0.7,
                             max_price_change: float = 0.2) -> PricingOptimizationResponse:
        """
        Perform comprehensive pricing optimization analysis
        
        Args:
            service_filter: Filter by specific service types
            client_filter: Filter by specific clients
            analysis_date: Date for analysis
            elasticity_confidence_threshold: Minimum confidence for elasticity estimates
            max_price_change: Maximum allowed price change percentage
            
        Returns:
            Comprehensive pricing optimization response
        """
        try:
            if not analysis_date:
                analysis_date = date.today()
            
            # Get demand and volume data for elasticity analysis
            demand_data = await self.s3_service.get_demand_forecast_data(limit=None)
            volume_data = await self.s3_service.get_volume_forecast_data()
            
            if not demand_data and not volume_data:
                return self._create_empty_response(analysis_date, "No data available for pricing analysis")
            
            # Determine services to analyze
            services_to_analyze = service_filter or list(ServiceType)
            
            # Perform optimization for each service
            service_optimizations = []
            total_revenue_opportunity = Decimal('0')
            
            for service_type in services_to_analyze:
                optimization = await self._optimize_service_pricing(
                    service_type, demand_data, volume_data, client_filter,
                    elasticity_confidence_threshold, max_price_change
                )
                
                if optimization:
                    service_optimizations.append(optimization)
                    # Calculate revenue opportunity
                    current_revenue = optimization.current_pricing * Decimal('1000')  # Simplified
                    optimal_revenue = optimization.optimal_price * Decimal('1000')
                    revenue_lift = optimal_revenue - current_revenue
                    if revenue_lift > 0:
                        total_revenue_opportunity += revenue_lift
            
            # Generate market positioning analysis
            market_positioning = self._analyze_market_positioning(service_optimizations)
            
            # Generate competitive analysis
            competitive_analysis = self._generate_competitive_analysis(service_optimizations)
            
            # Create implementation timeline
            implementation_timeline = self._create_implementation_timeline(service_optimizations)
            
            # Define success KPIs
            success_kpis = self._define_success_kpis(service_optimizations)
            
            return PricingOptimizationResponse(
                analysis_date=analysis_date,
                services_analyzed=len(service_optimizations),
                total_revenue_opportunity=total_revenue_opportunity,
                service_optimizations=service_optimizations,
                market_positioning=market_positioning,
                competitive_analysis=competitive_analysis,
                implementation_timeline=implementation_timeline,
                success_kpis=success_kpis
            )
            
        except Exception as e:
            return self._create_empty_response(
                analysis_date or date.today(),
                f"Error in pricing optimization: {str(e)}"
            )
    
    async def _optimize_service_pricing(self,
                                      service_type: ServiceType,
                                      demand_data: List[Dict[str, Any]],
                                      volume_data: List[Dict[str, Any]],
                                      client_filter: Optional[List[str]],
                                      elasticity_threshold: float,
                                      max_price_change: float) -> Optional[ServicePricingOptimization]:
        """Optimize pricing for a specific service type"""
        try:
            # Generate synthetic demand-price relationship for demonstration
            # In practice, this would come from historical pricing and demand data
            price_points, demand_volumes = self._generate_demand_price_data(service_type)
            
            # Calculate demand elasticity
            elasticity = self._calculate_demand_elasticity(price_points, demand_volumes)
            
            if elasticity.elasticity_confidence < elasticity_threshold:
                print(f"Elasticity confidence too low for {service_type}: {elasticity.elasticity_confidence}")
                return None
            
            # Current pricing
            current_price = self.default_pricing[service_type]
            
            # Generate pricing scenarios
            scenarios = self._generate_pricing_scenarios(
                current_price, elasticity, max_price_change
            )
            
            # Find optimal pricing
            optimal_price, recommended_strategy = self._find_optimal_price(
                current_price, elasticity, scenarios
            )
            
            # Calculate expected revenue lift
            expected_revenue_lift = self._calculate_revenue_lift(
                current_price, optimal_price, elasticity
            )
            
            return ServicePricingOptimization(
                service_type=service_type,
                current_pricing=current_price,
                demand_elasticity=elasticity,
                pricing_scenarios=scenarios,
                recommended_strategy=recommended_strategy,
                optimal_price=optimal_price,
                expected_revenue_lift=expected_revenue_lift
            )
            
        except Exception as e:
            print(f"Error optimizing pricing for {service_type}: {str(e)}")
            return None
    
    def _generate_demand_price_data(self, service_type: ServiceType) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic demand-price data for elasticity analysis"""
        try:
            base_price = float(self.default_pricing[service_type])
            
            # Generate price points around the base price
            price_variation = 0.3  # 30% variation
            min_price = base_price * (1 - price_variation)
            max_price = base_price * (1 + price_variation)
            
            price_points = np.linspace(min_price, max_price, 20)
            
            # Generate demand using a realistic elasticity curve
            # Different service types have different elasticity characteristics
            elasticity_params = {
                ServiceType.WAREHOUSING: {'base_demand': 1000, 'elasticity': -0.8},
                ServiceType.TRANSPORTATION: {'base_demand': 2500, 'elasticity': -1.2},
                ServiceType.VALUE_ADDED: {'base_demand': 500, 'elasticity': -1.5},
                ServiceType.CONSULTING: {'base_demand': 50, 'elasticity': -2.0},
                ServiceType.TECHNOLOGY: {'base_demand': 200, 'elasticity': -1.8}
            }
            
            params = elasticity_params.get(service_type, {'base_demand': 1000, 'elasticity': -1.0})
            base_demand = params['base_demand']
            elasticity_coef = params['elasticity']
            
            # Demand = base_demand * (price / base_price)^elasticity
            demand_volumes = base_demand * np.power(price_points / base_price, elasticity_coef)
            
            # Add some realistic noise
            noise = np.random.normal(0, base_demand * 0.05, len(demand_volumes))
            demand_volumes = np.maximum(demand_volumes + noise, base_demand * 0.1)
            
            return price_points, demand_volumes
            
        except Exception as e:
            # Fallback to simple linear relationship
            base_price = float(self.default_pricing.get(service_type, Decimal('10.00')))
            price_points = np.linspace(base_price * 0.8, base_price * 1.2, 10)
            demand_volumes = 1000 - (price_points - base_price) * 50
            return price_points, np.maximum(demand_volumes, 100)
    
    def _calculate_demand_elasticity(self,
                                   price_points: np.ndarray,
                                   demand_volumes: np.ndarray) -> DemandElasticity:
        """Calculate demand elasticity from price-demand data"""
        try:
            # Use log-log regression to estimate elasticity
            log_prices = np.log(price_points)
            log_demands = np.log(demand_volumes)
            
            # Remove any infinite or NaN values
            valid_mask = np.isfinite(log_prices) & np.isfinite(log_demands)
            log_prices = log_prices[valid_mask]
            log_demands = log_demands[valid_mask]
            
            if len(log_prices) < 3:
                return DemandElasticity(
                    price_elasticity=-1.0,
                    elasticity_confidence=0.0,
                    demand_sensitivity="unknown",
                    optimal_price_range={}
                )
            
            # Fit linear regression
            X = log_prices.reshape(-1, 1)
            model = LinearRegression()
            model.fit(X, log_demands)
            
            # Elasticity is the slope coefficient
            elasticity = model.coef_[0]
            
            # Calculate R-squared as confidence measure
            predictions = model.predict(X)
            r_squared = r2_score(log_demands, predictions)
            confidence = max(0.0, min(1.0, r_squared))
            
            # Classify demand sensitivity
            if abs(elasticity) > 2.0:
                sensitivity = "highly_elastic"
            elif abs(elasticity) > 1.0:
                sensitivity = "elastic"
            elif abs(elasticity) > 0.5:
                sensitivity = "moderately_elastic"
            else:
                sensitivity = "inelastic"
            
            # Calculate optimal price range using elasticity
            base_price = np.exp(np.mean(log_prices))
            
            # Optimal price range considering elasticity
            if elasticity < -1:  # Elastic demand
                # Lower prices may increase total revenue
                optimal_min = base_price * 0.85
                optimal_max = base_price * 1.05
            else:  # Inelastic demand
                # Higher prices may increase total revenue
                optimal_min = base_price * 0.95
                optimal_max = base_price * 1.15
            
            optimal_price_range = {
                'min_price': Decimal(str(round(optimal_min, 2))),
                'max_price': Decimal(str(round(optimal_max, 2)))
            }
            
            return DemandElasticity(
                price_elasticity=float(elasticity),
                elasticity_confidence=confidence,
                demand_sensitivity=sensitivity,
                optimal_price_range=optimal_price_range
            )
            
        except Exception as e:
            return DemandElasticity(
                price_elasticity=-1.0,
                elasticity_confidence=0.0,
                demand_sensitivity="error",
                optimal_price_range={}
            )
    
    def _generate_pricing_scenarios(self,
                                  current_price: Decimal,
                                  elasticity: DemandElasticity,
                                  max_change: float) -> List[PricingScenario]:
        """Generate pricing scenarios for analysis"""
        scenarios = []
        
        try:
            base_price = float(current_price)
            elasticity_coef = elasticity.price_elasticity
            
            # Define scenario changes
            scenario_changes = [-max_change, -max_change/2, 0, max_change/2, max_change]
            scenario_names = [
                f"Decrease {max_change*100:.0f}%",
                f"Decrease {max_change*50:.0f}%",
                "Current Price",
                f"Increase {max_change*50:.0f}%",
                f"Increase {max_change*100:.0f}%"
            ]
            
            for change, name in zip(scenario_changes, scenario_names):
                new_price = base_price * (1 + change)
                
                # Calculate expected volume change using elasticity
                if change != 0:
                    volume_change = elasticity_coef * change * 100  # Convert to percentage
                else:
                    volume_change = 0.0
                
                # Calculate revenue impact
                price_factor = 1 + change
                volume_factor = 1 + (volume_change / 100)
                revenue_impact_factor = price_factor * volume_factor
                revenue_impact = Decimal(str(round((revenue_impact_factor - 1) * base_price * 1000, 2)))
                
                # Calculate margin impact (simplified)
                cost_ratio = self.cost_ratios.get(list(ServiceType)[0], 0.6)  # Default cost ratio
                current_margin = (1 - cost_ratio) * 100
                new_margin = ((new_price - base_price * cost_ratio) / new_price) * 100
                margin_impact = new_margin - current_margin
                
                # Risk assessment
                if abs(change) <= 0.05:
                    risk = "Low"
                elif abs(change) <= 0.15:
                    risk = "Medium"
                else:
                    risk = "High"
                
                scenarios.append(PricingScenario(
                    scenario_name=name,
                    price_change_percentage=change * 100,
                    expected_volume_change=volume_change,
                    revenue_impact=revenue_impact,
                    margin_impact=margin_impact,
                    risk_assessment=risk
                ))
                
        except Exception as e:
            # Create a basic current price scenario
            scenarios.append(PricingScenario(
                scenario_name="Current Price (Error)",
                price_change_percentage=0.0,
                expected_volume_change=0.0,
                revenue_impact=Decimal('0'),
                margin_impact=0.0,
                risk_assessment="Unknown"
            ))
        
        return scenarios
    
    def _find_optimal_price(self,
                          current_price: Decimal,
                          elasticity: DemandElasticity,
                          scenarios: List[PricingScenario]) -> Tuple[Decimal, PricingStrategy]:
        """Find optimal price and strategy from scenarios"""
        try:
            if not scenarios:
                return current_price, PricingStrategy.MAINTAIN
            
            # Find scenario with highest revenue impact and acceptable risk
            best_scenario = None
            best_revenue = float('-inf')
            
            for scenario in scenarios:
                if scenario.risk_assessment in ['Low', 'Medium'] and scenario.revenue_impact > best_revenue:
                    best_revenue = float(scenario.revenue_impact)
                    best_scenario = scenario
            
            if not best_scenario:
                # If no low/medium risk scenario found, use current price
                return current_price, PricingStrategy.MAINTAIN
            
            # Calculate optimal price
            price_change = best_scenario.price_change_percentage / 100
            optimal_price = current_price * Decimal(str(1 + price_change))
            
            # Determine strategy
            if price_change > 0.02:  # > 2% increase
                strategy = PricingStrategy.INCREASE
            elif price_change < -0.02:  # > 2% decrease
                strategy = PricingStrategy.DECREASE
            elif elasticity.demand_sensitivity == "highly_elastic":
                strategy = PricingStrategy.DYNAMIC
            elif best_scenario.revenue_impact > 0:
                strategy = PricingStrategy.PREMIUM
            else:
                strategy = PricingStrategy.MAINTAIN
            
            return optimal_price, strategy
            
        except Exception as e:
            return current_price, PricingStrategy.MAINTAIN
    
    def _calculate_revenue_lift(self,
                              current_price: Decimal,
                              optimal_price: Decimal,
                              elasticity: DemandElasticity) -> float:
        """Calculate expected revenue lift percentage"""
        try:
            if current_price == optimal_price:
                return 0.0
            
            price_change = (float(optimal_price) - float(current_price)) / float(current_price)
            volume_change = elasticity.price_elasticity * price_change
            
            # Revenue lift = (1 + price_change) * (1 + volume_change) - 1
            revenue_lift = (1 + price_change) * (1 + volume_change) - 1
            
            return float(revenue_lift * 100)  # Convert to percentage
            
        except:
            return 0.0
    
    def _analyze_market_positioning(self,
                                  optimizations: List[ServicePricingOptimization]) -> Dict[str, Any]:
        """Analyze market positioning based on pricing optimization"""
        try:
            positioning = {
                'pricing_strategy_mix': {},
                'elasticity_profile': {},
                'revenue_opportunities': {},
                'risk_assessment': 'Medium'
            }
            
            if not optimizations:
                return positioning
            
            # Analyze strategy mix
            strategies = [opt.recommended_strategy for opt in optimizations]
            strategy_counts = {}
            for strategy in strategies:
                strategy_counts[strategy.value] = strategy_counts.get(strategy.value, 0) + 1
            
            positioning['pricing_strategy_mix'] = strategy_counts
            
            # Analyze elasticity profile
            elasticities = [opt.demand_elasticity.demand_sensitivity for opt in optimizations]
            elasticity_counts = {}
            for elasticity in elasticities:
                elasticity_counts[elasticity] = elasticity_counts.get(elasticity, 0) + 1
            
            positioning['elasticity_profile'] = elasticity_counts
            
            # Revenue opportunities
            total_lift = sum(opt.expected_revenue_lift for opt in optimizations)
            positioning['revenue_opportunities'] = {
                'total_revenue_lift_percentage': round(total_lift / len(optimizations), 2),
                'high_opportunity_services': [
                    opt.service_type.value for opt in optimizations 
                    if opt.expected_revenue_lift > 5.0
                ]
            }
            
            # Overall risk assessment
            high_elasticity_count = sum(1 for opt in optimizations 
                                      if abs(opt.demand_elasticity.price_elasticity) > 1.5)
            
            if high_elasticity_count > len(optimizations) * 0.6:
                positioning['risk_assessment'] = 'High'
            elif high_elasticity_count > len(optimizations) * 0.3:
                positioning['risk_assessment'] = 'Medium'
            else:
                positioning['risk_assessment'] = 'Low'
            
            return positioning
            
        except Exception as e:
            return {'error': str(e)}
    
    def _generate_competitive_analysis(self,
                                     optimizations: List[ServicePricingOptimization]) -> List[Dict[str, Any]]:
        """Generate competitive analysis insights"""
        analysis = []
        
        try:
            # Simplified competitive analysis based on elasticity and pricing
            for optimization in optimizations:
                service = optimization.service_type.value
                elasticity = optimization.demand_elasticity.price_elasticity
                
                competitive_insight = {
                    'service_type': service,
                    'market_position': 'neutral',
                    'competitive_pressure': 'medium',
                    'differentiation_opportunity': 'moderate',
                    'recommendations': []
                }
                
                # Analyze based on elasticity
                if abs(elasticity) > 1.5:  # Highly elastic
                    competitive_insight['competitive_pressure'] = 'high'
                    competitive_insight['market_position'] = 'price_sensitive'
                    competitive_insight['recommendations'].append('Focus on cost leadership and efficiency')
                    competitive_insight['recommendations'].append('Consider value-added service bundles')
                
                elif abs(elasticity) < 0.8:  # Inelastic
                    competitive_insight['competitive_pressure'] = 'low'
                    competitive_insight['market_position'] = 'differentiated'
                    competitive_insight['differentiation_opportunity'] = 'high'
                    competitive_insight['recommendations'].append('Opportunity for premium pricing')
                    competitive_insight['recommendations'].append('Invest in service quality and differentiation')
                
                # Strategy-specific insights
                if optimization.recommended_strategy == PricingStrategy.INCREASE:
                    competitive_insight['recommendations'].append('Monitor competitor reactions to price increases')
                elif optimization.recommended_strategy == PricingStrategy.DECREASE:
                    competitive_insight['recommendations'].append('Ensure cost structure supports lower pricing')
                
                analysis.append(competitive_insight)
                
        except Exception as e:
            analysis.append({'error': f'Error in competitive analysis: {str(e)}'})
        
        return analysis
    
    def _create_implementation_timeline(self,
                                      optimizations: List[ServicePricingOptimization]) -> List[Dict[str, Any]]:
        """Create implementation timeline for pricing changes"""
        timeline = []
        
        try:
            base_date = date.today()
            
            # Phase 1: Analysis and Planning (Weeks 1-2)
            timeline.append({
                'phase': 'Analysis and Planning',
                'start_date': base_date.isoformat(),
                'end_date': (base_date + timedelta(weeks=2)).isoformat(),
                'activities': [
                    'Validate pricing elasticity models',
                    'Conduct competitive benchmarking',
                    'Develop communication strategy',
                    'Prepare pricing change documentation'
                ],
                'deliverables': ['Pricing strategy document', 'Implementation plan']
            })
            
            # Phase 2: Low-Risk Implementation (Weeks 3-4)
            low_risk_services = [
                opt.service_type.value for opt in optimizations
                if opt.expected_revenue_lift > 0 and 
                abs(opt.demand_elasticity.price_elasticity) < 1.2
            ]
            
            if low_risk_services:
                timeline.append({
                    'phase': 'Low-Risk Service Implementation',
                    'start_date': (base_date + timedelta(weeks=2)).isoformat(),
                    'end_date': (base_date + timedelta(weeks=4)).isoformat(),
                    'activities': [
                        f'Implement pricing changes for {", ".join(low_risk_services)}',
                        'Monitor initial customer response',
                        'Track volume and revenue impacts'
                    ],
                    'deliverables': ['Initial performance metrics', 'Customer feedback summary']
                })
            
            # Phase 3: Full Implementation (Weeks 5-8)
            timeline.append({
                'phase': 'Full Implementation',
                'start_date': (base_date + timedelta(weeks=4)).isoformat(),
                'end_date': (base_date + timedelta(weeks=8)).isoformat(),
                'activities': [
                    'Roll out remaining pricing changes',
                    'Implement dynamic pricing where applicable',
                    'Launch customer communication campaign',
                    'Monitor competitive responses'
                ],
                'deliverables': ['Full implementation completion', 'Comprehensive performance report']
            })
            
            # Phase 4: Monitoring and Optimization (Weeks 9-12)
            timeline.append({
                'phase': 'Monitoring and Optimization',
                'start_date': (base_date + timedelta(weeks=8)).isoformat(),
                'end_date': (base_date + timedelta(weeks=12)).isoformat(),
                'activities': [
                    'Continuous performance monitoring',
                    'Fine-tune pricing based on results',
                    'Analyze customer retention impacts',
                    'Plan next pricing optimization cycle'
                ],
                'deliverables': ['Optimization report', 'Next cycle recommendations']
            })
            
        except Exception as e:
            timeline.append({'error': f'Error creating timeline: {str(e)}'})
        
        return timeline
    
    def _define_success_kpis(self,
                           optimizations: List[ServicePricingOptimization]) -> List[str]:
        """Define success KPIs for pricing optimization"""
        kpis = []
        
        try:
            # Revenue KPIs
            expected_lift = sum(opt.expected_revenue_lift for opt in optimizations) / len(optimizations) if optimizations else 0
            kpis.append(f"Target revenue lift: {expected_lift:.1f}%")
            kpis.append("Monthly revenue growth rate vs. baseline")
            
            # Volume KPIs
            kpis.append("Service volume retention rate >90%")
            kpis.append("New customer acquisition rate")
            
            # Margin KPIs
            kpis.append("Gross margin improvement per service")
            kpis.append("Overall portfolio margin enhancement")
            
            # Customer KPIs
            kpis.append("Customer satisfaction scores")
            kpis.append("Customer retention rate >95%")
            kpis.append("Price objection rate <10%")
            
            # Competitive KPIs
            kpis.append("Market share maintenance or growth")
            kpis.append("Competitive price positioning")
            
            # Operational KPIs
            kpis.append("Pricing implementation accuracy >99%")
            kpis.append("Time to market for pricing changes")
            
        except Exception as e:
            kpis.append(f"Error defining KPIs: {str(e)}")
        
        return kpis
    
    def _create_empty_response(self, analysis_date: date, reason: str) -> PricingOptimizationResponse:
        """Create empty response for error cases"""
        return PricingOptimizationResponse(
            analysis_date=analysis_date,
            services_analyzed=0,
            total_revenue_opportunity=Decimal('0'),
            service_optimizations=[],
            market_positioning={'error': reason},
            competitive_analysis=[{'error': reason}],
            implementation_timeline=[{'error': reason}],
            success_kpis=[reason, "Ensure sufficient data is available for pricing optimization"]
        )