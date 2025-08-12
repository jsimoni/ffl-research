class RecommendationEngine {
  constructor() {
    this.confidenceThresholds = {
      high: 0.8,
      medium: 0.6,
      low: 0.4
    };
  }

  generateRecommendations(analysis, week) {
    const recommendations = {
      week: week,
      team: analysis.team,
      summary: this.generateSummary(analysis),
      starterRecommendations: this.generateStarterRecommendations(analysis),
      benchRecommendations: this.generateBenchRecommendations(analysis),
      waiverRecommendations: this.generateWaiverRecommendations(analysis),
      tradeRecommendations: this.generateTradeRecommendations(analysis),
      riskAlerts: this.generateRiskAlerts(analysis),
      confidence: this.calculateOverallConfidence(analysis),
      projectedScore: analysis.rosterOptimization.projectedPoints,
      lastUpdated: new Date().toISOString()
    };

    return recommendations;
  }

  generateSummary(analysis) {
    const summary = {
      overallGrade: this.calculateOverallGrade(analysis),
      keyInsights: [],
      projectedPoints: analysis.rosterOptimization.projectedPoints,
      strengths: analysis.teamStrengths.length,
      weaknesses: analysis.teamWeaknesses.length,
      risks: analysis.riskAssessment.length
    };

    // Add key insights
    if (analysis.teamStrengths.length > 0) {
      const topStrength = analysis.teamStrengths[0];
      summary.keyInsights.push(`Strong ${topStrength.position || 'performance'} with ${topStrength.players?.length || 0} players`);
    }

    if (analysis.teamWeaknesses.length > 0) {
      const topWeakness = analysis.teamWeaknesses[0];
      summary.keyInsights.push(`Weak ${topWeakness.position || 'performance'} needs attention`);
    }

    if (analysis.riskAssessment.length > 0) {
      const highRisks = analysis.riskAssessment.filter(r => r.overallRisk === 'high');
      if (highRisks.length > 0) {
        summary.keyInsights.push(`${highRisks.length} high-risk players need monitoring`);
      }
    }

    return summary;
  }

  generateStarterRecommendations(analysis) {
    const recommendations = [];
    const optimization = analysis.rosterOptimization;

    optimization.suggestedStarters.forEach(starter => {
      const player = starter.player;
      const data = analysis.playerScores[player.id];
      
      const recommendation = {
        player: player,
        position: starter.position,
        confidence: this.calculatePlayerConfidence(starter, analysis),
        reasoning: this.generateStarterReasoning(starter, analysis),
        projectedPoints: starter.score,
        riskLevel: this.assessPlayerRisk(player, analysis),
        alternatives: this.findAlternatives(player, analysis)
      };

      recommendations.push(recommendation);
    });

    // Sort by confidence (highest first)
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  generateBenchRecommendations(analysis) {
    const recommendations = [];
    const optimization = analysis.rosterOptimization;

    optimization.suggestedBench.forEach(bench => {
      const player = bench.player;
      const data = analysis.playerScores[player.id];
      
      const recommendation = {
        player: player,
        position: bench.position,
        reasoning: this.generateBenchReasoning(bench, analysis),
        projectedPoints: bench.score,
        riskLevel: this.assessPlayerRisk(player, analysis),
        watchList: this.shouldBeOnWatchList(player, analysis)
      };

      recommendations.push(recommendation);
    });

    return recommendations;
  }

  generateWaiverRecommendations(analysis) {
    const recommendations = [];
    const weaknesses = analysis.teamWeaknesses;

    weaknesses.forEach(weakness => {
      if (weakness.type === 'depth' || weakness.type === 'performance') {
        const recommendation = {
          position: weakness.position,
          priority: this.calculateWaiverPriority(weakness),
          reasoning: `Address ${weakness.reason}`,
          suggestedPlayers: this.suggestWaiverTargets(weakness.position, analysis),
          dropCandidates: this.suggestDropCandidates(weakness.position, analysis)
        };

        recommendations.push(recommendation);
      }
    });

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  generateTradeRecommendations(analysis) {
    const recommendations = [];
    const strengths = analysis.teamStrengths;
    const weaknesses = analysis.teamWeaknesses;

    // Look for trade opportunities
    strengths.forEach(strength => {
      if (strength.position && strength.players && strength.players.length > 2) {
        const correspondingWeakness = weaknesses.find(w => w.position === strength.position);
        
        if (!correspondingWeakness) {
          // This position is strong, could trade for needs
          const recommendation = {
            type: 'trade_out',
            position: strength.position,
            priority: 'medium',
            reasoning: `Strong ${strength.position} depth - consider trading for needs`,
            tradeCandidates: strength.players.slice(2), // Keep top 2
            targetPositions: this.identifyTradeTargets(weaknesses)
          };

          recommendations.push(recommendation);
        }
      }
    });

    return recommendations;
  }

  generateRiskAlerts(analysis) {
    const alerts = [];

    analysis.riskAssessment.forEach(risk => {
      if (risk.overallRisk === 'high') {
        alerts.push({
          player: risk.player,
          riskLevel: 'high',
          risks: risk.risks,
          recommendation: this.generateRiskRecommendation(risk),
          urgency: 'immediate'
        });
      } else if (risk.overallRisk === 'medium') {
        alerts.push({
          player: risk.player,
          riskLevel: 'medium',
          risks: risk.risks,
          recommendation: this.generateRiskRecommendation(risk),
          urgency: 'monitor'
        });
      }
    });

    return alerts;
  }

  calculateOverallGrade(analysis) {
    const projectedPoints = analysis.rosterOptimization.projectedPoints;
    const risks = analysis.riskAssessment.length;
    const weaknesses = analysis.teamWeaknesses.length;

    let grade = 'A';

    if (projectedPoints < 100) grade = 'C';
    else if (projectedPoints < 120) grade = 'B';
    else if (projectedPoints < 140) grade = 'A-';
    else grade = 'A';

    // Adjust for risks
    if (risks > 3) {
      if (grade === 'A') grade = 'A-';
      else if (grade === 'A-') grade = 'B+';
      else if (grade === 'B+') grade = 'B';
      else if (grade === 'B') grade = 'B-';
      else if (grade === 'B-') grade = 'C+';
      else if (grade === 'C+') grade = 'C';
    }

    // Adjust for weaknesses
    if (weaknesses > 2) {
      if (grade === 'A') grade = 'A-';
      else if (grade === 'A-') grade = 'B+';
      else if (grade === 'B+') grade = 'B';
      else if (grade === 'B') grade = 'B-';
      else if (grade === 'B-') grade = 'C+';
      else if (grade === 'C+') grade = 'C';
    }

    return grade;
  }

  calculatePlayerConfidence(starter, analysis) {
    const player = starter.player;
    const data = analysis.playerScores[player.id];
    let confidence = 0.5; // Base confidence

    // Factor in recent performance trend
    const playerData = this.getPlayerData(player, analysis);
    if (playerData?.recentPerformance?.trend === 'improving') {
      confidence += 0.2;
    } else if (playerData?.recentPerformance?.trend === 'declining') {
      confidence -= 0.2;
    }

    // Factor in projection confidence
    if (playerData?.projections?.confidence === 'high') {
      confidence += 0.15;
    } else if (playerData?.projections?.confidence === 'low') {
      confidence -= 0.15;
    }

    // Factor in matchup
    if (playerData?.matchup?.opponentRank === 'Easy' || playerData?.matchup?.opponentRank === 'Very Easy') {
      confidence += 0.1;
    } else if (playerData?.matchup?.opponentRank === 'Tough' || playerData?.matchup?.opponentRank === 'Very Tough') {
      confidence -= 0.1;
    }

    // Factor in injury status
    if (playerData?.injuryStatus?.status === 'Questionable') {
      confidence -= 0.2;
    } else if (playerData?.injuryStatus?.status === 'Doubtful') {
      confidence -= 0.4;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  generateStarterReasoning(starter, analysis) {
    const player = starter.player;
    const data = analysis.playerScores[player.id];
    const playerData = this.getPlayerData(player, analysis);
    const reasons = [];

    // Add projection-based reasoning
    if (data.score > 20) {
      reasons.push('High projected points');
    } else if (data.score > 15) {
      reasons.push('Good projected points');
    }

    // Add trend-based reasoning
    if (playerData?.recentPerformance?.trend === 'improving') {
      reasons.push('Improving performance trend');
    }

    // Add matchup-based reasoning
    if (playerData?.matchup?.opponentRank === 'Easy') {
      reasons.push('Favorable matchup');
    }

    // Add consistency reasoning
    if (playerData?.recentPerformance?.averagePoints > 15) {
      reasons.push('Consistent high performance');
    }

    return reasons.join(', ');
  }

  generateBenchReasoning(bench, analysis) {
    const player = bench.player;
    const data = analysis.playerScores[player.id];
    const playerData = this.getPlayerData(player, analysis);
    const reasons = [];

    // Add low projection reasoning
    if (data.score < 10) {
      reasons.push('Low projected points');
    }

    // Add injury reasoning
    if (playerData?.injuryStatus?.status === 'Questionable') {
      reasons.push('Injury concerns');
    }

    // Add poor matchup reasoning
    if (playerData?.matchup?.opponentRank === 'Tough') {
      reasons.push('Difficult matchup');
    }

    // Add declining performance reasoning
    if (playerData?.recentPerformance?.trend === 'declining') {
      reasons.push('Declining performance');
    }

    return reasons.join(', ');
  }

  assessPlayerRisk(player, analysis) {
    const playerRisks = analysis.riskAssessment.find(r => r.player.id === player.id);
    
    if (!playerRisks) return 'low';
    
    return playerRisks.overallRisk;
  }

  findAlternatives(player, analysis) {
    const alternatives = [];
    const position = player.position;
    const benchPlayers = analysis.rosterOptimization.suggestedBench;
    
    benchPlayers.forEach(bench => {
      if (bench.position === position && bench.score > player.score * 0.8) {
        alternatives.push({
          player: bench.player,
          score: bench.score,
          reasoning: `Similar position with ${bench.score.toFixed(1)} projected points`
        });
      }
    });

    return alternatives.slice(0, 2); // Return top 2 alternatives
  }

  calculateWaiverPriority(weakness) {
    let priority = 5; // Base priority (1-10 scale)

    if (weakness.type === 'depth') {
      priority += 2;
    }

    if (weakness.type === 'performance') {
      priority += 1;
    }

    if (weakness.position === 'RB' || weakness.position === 'WR') {
      priority += 1;
    }

    return Math.min(10, priority);
  }

  suggestWaiverTargets(position, analysis) {
    // This would typically query available free agents
    // For now, return mock suggestions
    const mockTargets = {
      'QB': ['Backup QB 1', 'Backup QB 2'],
      'RB': ['Handcuff RB 1', 'Handcuff RB 2'],
      'WR': ['WR3 Option 1', 'WR3 Option 2'],
      'TE': ['TE2 Option 1', 'TE2 Option 2'],
      'K': ['Kicker Option 1', 'Kicker Option 2'],
      'DEF': ['Defense Option 1', 'Defense Option 2']
    };

    return mockTargets[position] || [];
  }

  suggestDropCandidates(position, analysis) {
    const benchPlayers = analysis.rosterOptimization.suggestedBench;
    const positionPlayers = benchPlayers.filter(p => p.position === position);
    
    return positionPlayers
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map(p => p.player.name);
  }

  identifyTradeTargets(weaknesses) {
    return weaknesses
      .filter(w => w.position)
      .map(w => w.position)
      .slice(0, 2);
  }

  generateRiskRecommendation(risk) {
    const recommendations = [];

    risk.risks.forEach(r => {
      switch (r.type) {
        case 'injury':
          recommendations.push('Monitor injury status closely');
          break;
        case 'weather':
          recommendations.push('Check weather conditions before game time');
          break;
        case 'performance':
          recommendations.push('Consider benching if trend continues');
          break;
        case 'matchup':
          recommendations.push('Difficult matchup - consider alternatives');
          break;
      }
    });

    return recommendations.join('; ');
  }

  shouldBeOnWatchList(player, analysis) {
    const playerData = this.getPlayerData(player, analysis);
    
    return playerData?.recentPerformance?.trend === 'improving' ||
           playerData?.projections?.confidence === 'high' ||
           playerData?.matchup?.opponentRank === 'Easy';
  }

  calculateOverallConfidence(analysis) {
    const starterConfidences = analysis.rosterOptimization.suggestedStarters.map(starter => 
      this.calculatePlayerConfidence(starter, analysis)
    );

    if (starterConfidences.length === 0) return 0;

    const averageConfidence = starterConfidences.reduce((sum, conf) => sum + conf, 0) / starterConfidences.length;
    
    // Adjust for risks
    const riskPenalty = analysis.riskAssessment.length * 0.05;
    
    return Math.max(0, Math.min(1, averageConfidence - riskPenalty));
  }

  getPlayerData(player, analysis) {
    // This would typically come from the player research data
    // For now, return mock data
    return {
      recentPerformance: { trend: 'stable', averagePoints: 12 },
      projections: { confidence: 'medium', points: 15 },
      matchup: { opponentRank: 'Average' },
      injuryStatus: { status: 'Active' }
    };
  }
}

export default RecommendationEngine;
