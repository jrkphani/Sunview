"""
Risk Scoring Algorithms
Multi-dimensional risk assessment and scoring utilities
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Union
from dataclasses import dataclass
from enum import Enum
import math


class RiskDimension(Enum):
    """Risk assessment dimensions"""
    SUPPLY = "supply"
    DEMAND = "demand"
    INVENTORY = "inventory"
    FINANCIAL = "financial"
    OPERATIONAL = "operational"
    QUALITY = "quality"
    COMPLIANCE = "compliance"


@dataclass
class RiskFactor:
    """Individual risk factor definition"""
    name: str
    dimension: RiskDimension
    weight: float
    threshold_low: float
    threshold_medium: float
    threshold_high: float
    threshold_critical: float


class RiskScoringEngine:
    """
    Multi-dimensional risk scoring engine
    """
    
    def __init__(self):
        self.risk_factors = self._initialize_risk_factors()
        
    def _initialize_risk_factors(self) -> List[RiskFactor]:
        """Initialize standard risk factors with weights and thresholds"""
        return [
            # Supply Risk Factors
            RiskFactor("supplier_concentration", RiskDimension.SUPPLY, 0.15, 0.2, 0.4, 0.6, 0.8),
            RiskFactor("lead_time_variability", RiskDimension.SUPPLY, 0.10, 0.1, 0.2, 0.3, 0.5),
            RiskFactor("supplier_reliability", RiskDimension.SUPPLY, 0.12, 0.95, 0.90, 0.85, 0.80),
            
            # Demand Risk Factors
            RiskFactor("demand_volatility", RiskDimension.DEMAND, 0.10, 0.15, 0.25, 0.35, 0.50),
            RiskFactor("forecast_accuracy", RiskDimension.DEMAND, 0.08, 0.90, 0.80, 0.70, 0.60),
            
            # Inventory Risk Factors
            RiskFactor("stockout_probability", RiskDimension.INVENTORY, 0.12, 0.02, 0.05, 0.10, 0.20),
            RiskFactor("excess_inventory_ratio", RiskDimension.INVENTORY, 0.08, 0.10, 0.20, 0.30, 0.40),
            RiskFactor("inventory_turnover", RiskDimension.INVENTORY, 0.07, 12, 8, 4, 2),
            
            # Financial Risk Factors
            RiskFactor("cost_volatility", RiskDimension.FINANCIAL, 0.06, 0.05, 0.10, 0.20, 0.30),
            RiskFactor("margin_pressure", RiskDimension.FINANCIAL, 0.08, 0.10, 0.20, 0.30, 0.40),
            
            # Operational Risk Factors
            RiskFactor("capacity_utilization", RiskDimension.OPERATIONAL, 0.04, 0.70, 0.85, 0.95, 0.99),
        ]
    
    def calculate_risk_score(self, metrics: Dict[str, float]) -> Dict[str, Union[float, str, Dict]]:
        """
        Calculate comprehensive risk score based on multiple metrics
        
        Args:
            metrics: Dictionary of metric values
            
        Returns:
            Dictionary with overall score, level, and breakdown
        """
        dimension_scores = {}
        factor_scores = []
        
        for factor in self.risk_factors:
            if factor.name in metrics:
                score = self._score_risk_factor(factor, metrics[factor.name])
                factor_scores.append({
                    'factor': factor.name,
                    'dimension': factor.dimension.value,
                    'score': score,
                    'weighted_score': score * factor.weight
                })
                
                if factor.dimension not in dimension_scores:
                    dimension_scores[factor.dimension] = []
                dimension_scores[factor.dimension].append(score * factor.weight)
        
        # Calculate dimension averages
        dimension_averages = {}
        for dimension, scores in dimension_scores.items():
            dimension_averages[dimension.value] = np.mean(scores) if scores else 0
        
        # Calculate overall risk score
        overall_score = sum(f['weighted_score'] for f in factor_scores)
        
        # Normalize to 0-100 scale
        overall_score = min(100, overall_score * 100)
        
        return {
            'overall_score': overall_score,
            'risk_level': self._get_risk_level(overall_score),
            'dimension_scores': dimension_averages,
            'factor_scores': factor_scores,
            'top_risks': self._identify_top_risks(factor_scores),
            'mitigation_priority': self._prioritize_mitigation(factor_scores)
        }
    
    def _score_risk_factor(self, factor: RiskFactor, value: float) -> float:
        """Score individual risk factor based on thresholds"""
        if factor.name == "supplier_reliability" or factor.name == "forecast_accuracy":
            # Higher values are better for these metrics
            if value >= factor.threshold_low:
                return 0.0
            elif value >= factor.threshold_medium:
                return 0.25
            elif value >= factor.threshold_high:
                return 0.50
            elif value >= factor.threshold_critical:
                return 0.75
            else:
                return 1.0
        else:
            # Lower values are better for most metrics
            if value <= factor.threshold_low:
                return 0.0
            elif value <= factor.threshold_medium:
                return 0.25
            elif value <= factor.threshold_high:
                return 0.50
            elif value <= factor.threshold_critical:
                return 0.75
            else:
                return 1.0
    
    def _get_risk_level(self, score: float) -> str:
        """Convert risk score to risk level"""
        if score < 20:
            return "minimal"
        elif score < 40:
            return "low"
        elif score < 60:
            return "medium"
        elif score < 80:
            return "high"
        else:
            return "critical"
    
    def _identify_top_risks(self, factor_scores: List[Dict], top_n: int = 5) -> List[Dict]:
        """Identify top risk factors"""
        sorted_factors = sorted(factor_scores, key=lambda x: x['weighted_score'], reverse=True)
        return sorted_factors[:top_n]
    
    def _prioritize_mitigation(self, factor_scores: List[Dict]) -> List[str]:
        """Prioritize risk mitigation strategies"""
        priorities = []
        
        # Group by dimension
        dimension_risks = {}
        for factor in factor_scores:
            dim = factor['dimension']
            if dim not in dimension_risks:
                dimension_risks[dim] = []
            dimension_risks[dim].append(factor)
        
        # Generate priorities based on highest risks
        for dim, factors in dimension_risks.items():
            avg_score = np.mean([f['weighted_score'] for f in factors])
            if avg_score > 0.5:
                priorities.append(f"Focus on {dim} risk mitigation - average score: {avg_score:.2f}")
        
        return priorities[:5]  # Top 5 priorities


def calculate_supplier_risk_score(
    single_source_ratio: float,
    supplier_reliability: float,
    lead_time_variability: float,
    geographic_concentration: float,
    financial_stability: float = 1.0
) -> Dict[str, float]:
    """
    Calculate supplier-specific risk score
    
    Args:
        single_source_ratio: Ratio of single-sourced SKUs
        supplier_reliability: On-time delivery rate (0-1)
        lead_time_variability: Coefficient of variation for lead times
        geographic_concentration: Geographic risk factor (0-1)
        financial_stability: Supplier financial health score (0-1)
        
    Returns:
        Dictionary with risk scores and components
    """
    # Component weights
    weights = {
        'single_source': 0.30,
        'reliability': 0.25,
        'lead_time': 0.20,
        'geographic': 0.15,
        'financial': 0.10
    }
    
    # Calculate component scores (0-100 scale)
    scores = {
        'single_source': single_source_ratio * 100,
        'reliability': (1 - supplier_reliability) * 100,
        'lead_time': min(lead_time_variability * 200, 100),  # Cap at 100
        'geographic': geographic_concentration * 100,
        'financial': (1 - financial_stability) * 100
    }
    
    # Calculate weighted overall score
    overall_score = sum(scores[k] * weights[k] for k in weights)
    
    return {
        'overall_score': overall_score,
        'component_scores': scores,
        'risk_level': _categorize_risk_level(overall_score),
        'primary_risk': max(scores.items(), key=lambda x: x[1])[0]
    }


def calculate_inventory_risk_score(
    stockout_probability: float,
    excess_inventory_ratio: float,
    obsolescence_risk: float,
    carrying_cost_ratio: float,
    demand_variability: float
) -> Dict[str, float]:
    """
    Calculate inventory-specific risk score
    
    Args:
        stockout_probability: Probability of stockout (0-1)
        excess_inventory_ratio: Ratio of excess to optimal inventory
        obsolescence_risk: Risk of inventory obsolescence (0-1)
        carrying_cost_ratio: Carrying cost as ratio of inventory value
        demand_variability: Coefficient of variation for demand
        
    Returns:
        Dictionary with risk scores and components
    """
    # Normalize inputs to 0-100 scale
    scores = {
        'stockout': stockout_probability * 100,
        'excess': min(excess_inventory_ratio * 50, 100),
        'obsolescence': obsolescence_risk * 100,
        'carrying_cost': min(carrying_cost_ratio * 500, 100),
        'variability': min(demand_variability * 100, 100)
    }
    
    # Dynamic weights based on current state
    if stockout_probability > 0.1:
        # High stockout risk - prioritize availability
        weights = {
            'stockout': 0.40,
            'excess': 0.15,
            'obsolescence': 0.15,
            'carrying_cost': 0.10,
            'variability': 0.20
        }
    elif excess_inventory_ratio > 0.3:
        # High excess inventory - prioritize efficiency
        weights = {
            'stockout': 0.15,
            'excess': 0.35,
            'obsolescence': 0.25,
            'carrying_cost': 0.15,
            'variability': 0.10
        }
    else:
        # Balanced weights
        weights = {
            'stockout': 0.25,
            'excess': 0.25,
            'obsolescence': 0.20,
            'carrying_cost': 0.15,
            'variability': 0.15
        }
    
    overall_score = sum(scores[k] * weights[k] for k in weights)
    
    return {
        'overall_score': overall_score,
        'component_scores': scores,
        'risk_level': _categorize_risk_level(overall_score),
        'optimization_focus': _determine_inventory_focus(scores)
    }


def calculate_buffer_coverage_risk(
    current_inventory: float,
    average_demand: float,
    demand_std: float,
    lead_time: float,
    service_level_target: float = 0.95
) -> Dict[str, float]:
    """
    Calculate risk based on buffer coverage analysis
    
    Args:
        current_inventory: Current inventory level
        average_demand: Average daily demand
        demand_std: Standard deviation of daily demand
        lead_time: Lead time in days
        service_level_target: Target service level (0-1)
        
    Returns:
        Dictionary with buffer coverage metrics and risk
    """
    # Calculate safety stock requirement
    z_score = norm.ppf(service_level_target)
    safety_stock = z_score * demand_std * np.sqrt(lead_time)
    
    # Calculate cycle stock
    cycle_stock = average_demand * lead_time
    
    # Total required inventory
    required_inventory = cycle_stock + safety_stock
    
    # Coverage metrics
    coverage_ratio = current_inventory / required_inventory if required_inventory > 0 else 0
    coverage_days = current_inventory / average_demand if average_demand > 0 else 0
    
    # Risk scoring
    if coverage_ratio >= 1.0:
        risk_score = max(0, (coverage_ratio - 2.0) * 25)  # Excess inventory risk
    else:
        risk_score = (1.0 - coverage_ratio) * 100  # Stockout risk
    
    return {
        'coverage_ratio': coverage_ratio,
        'coverage_days': coverage_days,
        'safety_stock_required': safety_stock,
        'total_required': required_inventory,
        'risk_score': risk_score,
        'risk_level': _categorize_risk_level(risk_score),
        'stockout_probability': 1 - norm.cdf(coverage_ratio) if coverage_ratio < 1 else 0
    }


def calculate_scenario_risk_score(
    baseline_metrics: Dict[str, float],
    scenario_impacts: Dict[str, float],
    probability: float
) -> Dict[str, float]:
    """
    Calculate risk score for a specific scenario
    
    Args:
        baseline_metrics: Baseline performance metrics
        scenario_impacts: Expected impacts under scenario
        probability: Probability of scenario occurring
        
    Returns:
        Dictionary with scenario risk assessment
    """
    # Calculate severity scores for each impact
    severity_scores = {}
    for metric, impact in scenario_impacts.items():
        if metric in baseline_metrics:
            baseline = baseline_metrics[metric]
            if baseline != 0:
                relative_impact = abs(impact / baseline)
                severity_scores[metric] = min(relative_impact * 100, 100)
    
    # Overall severity
    overall_severity = np.mean(list(severity_scores.values())) if severity_scores else 0
    
    # Risk = Probability × Severity
    risk_score = probability * overall_severity
    
    return {
        'risk_score': risk_score,
        'severity_score': overall_severity,
        'probability': probability,
        'expected_impact': probability * overall_severity,
        'impact_breakdown': severity_scores,
        'risk_level': _categorize_risk_level(risk_score)
    }


def _categorize_risk_level(score: float) -> str:
    """Categorize risk score into levels"""
    if score < 20:
        return "minimal"
    elif score < 40:
        return "low"
    elif score < 60:
        return "medium"
    elif score < 80:
        return "high"
    else:
        return "critical"


def _determine_inventory_focus(scores: Dict[str, float]) -> str:
    """Determine primary focus area for inventory optimization"""
    max_risk = max(scores.items(), key=lambda x: x[1])
    
    focus_map = {
        'stockout': "Increase safety stock levels",
        'excess': "Reduce order quantities",
        'obsolescence': "Improve demand planning",
        'carrying_cost': "Optimize inventory turnover",
        'variability': "Enhance forecast accuracy"
    }
    
    return focus_map.get(max_risk[0], "Balance inventory levels")


def calculate_composite_risk_score(
    risk_scores: List[Dict[str, float]],
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, float]:
    """
    Calculate composite risk score from multiple risk dimensions
    
    Args:
        risk_scores: List of risk score dictionaries
        weights: Optional weights for each risk type
        
    Returns:
        Composite risk assessment
    """
    if not risk_scores:
        return {'overall_score': 0, 'risk_level': 'minimal'}
    
    # Extract scores
    scores = [r.get('overall_score', r.get('risk_score', 0)) for r in risk_scores]
    
    if weights:
        # Weighted average
        weighted_scores = []
        for i, score in enumerate(scores):
            weight = weights.get(f'risk_{i}', 1.0 / len(scores))
            weighted_scores.append(score * weight)
        composite_score = sum(weighted_scores)
    else:
        # Simple average
        composite_score = np.mean(scores)
    
    # Calculate variance for risk concentration
    risk_variance = np.var(scores)
    concentration_factor = 1 + (risk_variance / 1000)  # Penalize concentrated risks
    
    adjusted_score = min(composite_score * concentration_factor, 100)
    
    return {
        'overall_score': adjusted_score,
        'risk_level': _categorize_risk_level(adjusted_score),
        'component_scores': scores,
        'risk_concentration': risk_variance,
        'highest_risk_area': np.argmax(scores)
    }