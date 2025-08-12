class RosterAnalyzer {
  constructor() {
    this.positionWeights = {
      QB: 1.0,
      RB: 1.2,
      WR: 1.1,
      TE: 0.9,
      K: 0.7,
      DEF: 0.8
    };
  }

  analyzeRoster(roster, leagueRules, playerData, week) {
    const analysis = {
      team: {
        id: roster.teamId,
        name: roster.teamName
      },
      week: week,
      leagueRules: leagueRules,
      currentStarters: this.getCurrentStarters(roster),
      benchPlayers: this.getBenchPlayers(roster),
      positionAnalysis: this.analyzePositions(roster, playerData),
      teamStrengths: this.identifyStrengths(roster, playerData),
      teamWeaknesses: this.identifyWeaknesses(roster, playerData),
      playerScores: this.scorePlayers(roster.players, playerData, week),
      rosterOptimization: this.optimizeRoster(roster, playerData, leagueRules, week),
      riskAssessment: this.assessRisks(roster, playerData, week),
      lastUpdated: new Date().toISOString()
    };

    return analysis;
  }

  getCurrentStarters(roster) {
    return roster.players.filter(player => player.isStarting);
  }

  getBenchPlayers(roster) {
    return roster.players.filter(player => !player.isStarting);
  }

  analyzePositions(roster, playerData) {
    const positionGroups = this.groupByPosition(roster.players);
    const analysis = {};

    Object.keys(positionGroups).forEach(position => {
      const players = positionGroups[position];
      analysis[position] = {
        count: players.length,
        starters: players.filter(p => p.isStarting).length,
        depth: this.assessDepth(players, playerData),
        strength: this.calculatePositionStrength(players, playerData),
        recommendations: this.getPositionRecommendations(players, playerData)
      };
    });

    return analysis;
  }

  groupByPosition(players) {
    const groups = {};
    players.forEach(player => {
      if (!groups[player.position]) {
        groups[player.position] = [];
      }
      groups[player.position].push(player);
    });
    return groups;
  }

  assessDepth(players, playerData) {
    if (players.length === 0) return 'none';
    if (players.length === 1) return 'shallow';
    if (players.length === 2) return 'adequate';
    if (players.length === 3) return 'good';
    return 'excellent';
  }

  calculatePositionStrength(players, playerData) {
    if (players.length === 0) return 0;

    const scores = players.map(player => {
      const data = playerData[player.id] || {};
      const seasonScore = data.seasonStats?.fantasyPoints || 0;
      const recentScore = data.recentPerformance?.averagePoints || 0;
      const projectionScore = data.projections?.points || 0;
      
      // Weight recent performance more heavily
      return (seasonScore * 0.3) + (recentScore * 0.5) + (projectionScore * 0.2);
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  getPositionRecommendations(players, playerData) {
    const recommendations = [];

    // Check for injury risks
    const injuredPlayers = players.filter(player => {
      const data = playerData[player.id];
      return data?.injuryStatus?.status === 'Questionable' || 
             data?.injuryStatus?.status === 'Doubtful' ||
             data?.injuryStatus?.status === 'Out';
    });

    if (injuredPlayers.length > 0) {
      recommendations.push({
        type: 'injury',
        severity: 'high',
        message: `${injuredPlayers.length} player(s) have injury concerns`,
        players: injuredPlayers.map(p => p.name)
      });
    }

    // Check for bye weeks
    const byeWeekPlayers = players.filter(player => {
      const data = playerData[player.id];
      return data?.matchup?.opponent === 'BYE';
    });

    if (byeWeekPlayers.length > 0) {
      recommendations.push({
        type: 'bye',
        severity: 'medium',
        message: `${byeWeekPlayers.length} player(s) on bye week`,
        players: byeWeekPlayers.map(p => p.name)
      });
    }

    // Check for poor matchups
    const poorMatchups = players.filter(player => {
      const data = playerData[player.id];
      return data?.matchup?.opponentRank === 'Tough' || 
             data?.matchup?.opponentRank === 'Very Tough';
    });

    if (poorMatchups.length > 0) {
      recommendations.push({
        type: 'matchup',
        severity: 'low',
        message: `${poorMatchups.length} player(s) have difficult matchups`,
        players: poorMatchups.map(p => p.name)
      });
    }

    return recommendations;
  }

  identifyStrengths(roster, playerData) {
    const strengths = [];
    const positionGroups = this.groupByPosition(roster.players);

    // Identify strong positions
    Object.keys(positionGroups).forEach(position => {
      const players = positionGroups[position];
      const strength = this.calculatePositionStrength(players, playerData);
      
      if (strength > 15) { // Threshold for "strong" position
        strengths.push({
          position: position,
          strength: strength,
          players: players.map(p => p.name),
          reason: `High average fantasy points (${strength.toFixed(1)})`
        });
      }
    });

    // Identify consistent performers
    const consistentPlayers = roster.players.filter(player => {
      const data = playerData[player.id];
      return data?.recentPerformance?.trend === 'improving' || 
             data?.recentPerformance?.trend === 'stable';
    });

    if (consistentPlayers.length > 0) {
      strengths.push({
        type: 'consistency',
        players: consistentPlayers.map(p => p.name),
        reason: 'Multiple players showing consistent or improving performance'
      });
    }

    return strengths;
  }

  identifyWeaknesses(roster, playerData) {
    const weaknesses = [];
    const positionGroups = this.groupByPosition(roster.players);

    // Identify weak positions
    Object.keys(positionGroups).forEach(position => {
      const players = positionGroups[position];
      const strength = this.calculatePositionStrength(players, playerData);
      
      if (strength < 8) { // Threshold for "weak" position
        weaknesses.push({
          position: position,
          strength: strength,
          players: players.map(p => p.name),
          reason: `Low average fantasy points (${strength.toFixed(1)})`
        });
      }
    });

    // Identify declining performers
    const decliningPlayers = roster.players.filter(player => {
      const data = playerData[player.id];
      return data?.recentPerformance?.trend === 'declining';
    });

    if (decliningPlayers.length > 0) {
      weaknesses.push({
        type: 'performance',
        players: decliningPlayers.map(p => p.name),
        reason: 'Players showing declining performance trends'
      });
    }

    // Check for lack of depth
    Object.keys(positionGroups).forEach(position => {
      const players = positionGroups[position];
      if (players.length < 2 && position !== 'K' && position !== 'DEF') {
        weaknesses.push({
          type: 'depth',
          position: position,
          reason: `Limited depth at ${position} position`
        });
      }
    });

    return weaknesses;
  }

  scorePlayers(players, playerData, week) {
    const scores = {};

    players.forEach(player => {
      const data = playerData[player.id] || {};
      const score = this.calculatePlayerScore(player, data, week);
      
      scores[player.id] = {
        player: player,
        score: score,
        factors: this.getScoreFactors(player, data, week),
        recommendation: this.getPlayerRecommendation(player, data, score)
      };
    });

    return scores;
  }

  calculatePlayerScore(player, data, week) {
    let score = 0;

    // Base score from season performance
    const seasonPoints = data.seasonStats?.fantasyPoints || 0;
    score += (seasonPoints / 17) * 0.3; // Normalize to per-game average

    // Recent performance weight
    const recentPoints = data.recentPerformance?.averagePoints || 0;
    score += recentPoints * 0.4;

    // Projection weight
    const projectedPoints = data.projections?.points || 0;
    score += projectedPoints * 0.2;

    // Matchup adjustment
    const matchupBonus = this.getMatchupBonus(data.matchup);
    score += matchupBonus * 0.1;

    // Injury penalty
    const injuryPenalty = this.getInjuryPenalty(data.injuryStatus);
    score *= (1 - injuryPenalty);

    // Position weight
    score *= this.positionWeights[player.position] || 1.0;

    return Math.max(0, score);
  }

  getMatchupBonus(matchup) {
    if (!matchup) return 0;
    
    switch (matchup.opponentRank) {
      case 'Very Easy': return 3;
      case 'Easy': return 1.5;
      case 'Average': return 0;
      case 'Tough': return -1.5;
      case 'Very Tough': return -3;
      default: return 0;
    }
  }

  getInjuryPenalty(injuryStatus) {
    if (!injuryStatus) return 0;
    
    switch (injuryStatus.status) {
      case 'Out': return 1.0;
      case 'Doubtful': return 0.7;
      case 'Questionable': return 0.3;
      case 'Probable': return 0.1;
      default: return 0;
    }
  }

  getScoreFactors(player, data, week) {
    const factors = [];

    if (data.seasonStats?.fantasyPoints) {
      factors.push({
        type: 'season',
        value: data.seasonStats.fantasyPoints,
        weight: 0.3
      });
    }

    if (data.recentPerformance?.averagePoints) {
      factors.push({
        type: 'recent',
        value: data.recentPerformance.averagePoints,
        weight: 0.4
      });
    }

    if (data.projections?.points) {
      factors.push({
        type: 'projection',
        value: data.projections.points,
        weight: 0.2
      });
    }

    if (data.matchup?.opponentRank) {
      factors.push({
        type: 'matchup',
        value: data.matchup.opponentRank,
        weight: 0.1
      });
    }

    return factors;
  }

  getPlayerRecommendation(player, data, score) {
    if (data.injuryStatus?.status === 'Out') {
      return 'SIT - Player is out';
    }

    if (data.injuryStatus?.status === 'Doubtful') {
      return 'SIT - High injury risk';
    }

    if (score > 20) {
      return 'START - High scoring potential';
    }

    if (score > 15) {
      return 'START - Good scoring potential';
    }

    if (score > 10) {
      return 'FLEX - Moderate scoring potential';
    }

    return 'SIT - Low scoring potential';
  }

  optimizeRoster(roster, playerData, leagueRules, week) {
    const optimization = {
      suggestedStarters: [],
      suggestedBench: [],
      reasoning: [],
      projectedPoints: 0
    };

    // Get required positions from league rules
    const requiredPositions = this.getRequiredPositions(leagueRules);
    
    // Score all players
    const playerScores = this.scorePlayers(roster.players, playerData, week);
    
    // Sort players by score within each position
    const positionGroups = this.groupByPosition(roster.players);
    
    // Select starters for each required position
    Object.keys(requiredPositions).forEach(position => {
      const required = requiredPositions[position];
      const players = positionGroups[position] || [];
      
      // Sort by score (highest first)
      const sortedPlayers = players.sort((a, b) => 
        playerScores[b.id].score - playerScores[a.id].score
      );
      
      // Select required number of starters
      for (let i = 0; i < Math.min(required, sortedPlayers.length); i++) {
        const player = sortedPlayers[i];
        optimization.suggestedStarters.push({
          player: player,
          position: position,
          score: playerScores[player.id].score,
          reasoning: playerScores[player.id].factors
        });
      }
      
      // Add remaining players to bench
      for (let i = required; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        optimization.suggestedBench.push({
          player: player,
          position: position,
          score: playerScores[player.id].score,
          reasoning: playerScores[player.id].factors
        });
      }
    });

    // Calculate projected points
    optimization.projectedPoints = optimization.suggestedStarters.reduce(
      (sum, starter) => sum + starter.score, 0
    );

    // Add reasoning
    optimization.reasoning = this.generateOptimizationReasoning(optimization, playerData);

    return optimization;
  }

  getRequiredPositions(leagueRules) {
    const required = {};
    
    if (leagueRules.rosterPositions) {
      leagueRules.rosterPositions.forEach(pos => {
        if (pos.position !== 'BN') {
          required[pos.position] = pos.count;
        }
      });
    } else {
      // Default positions
      required.QB = 1;
      required.RB = 2;
      required.WR = 2;
      required.TE = 1;
      required.K = 1;
      required.DEF = 1;
    }
    
    return required;
  }

  generateOptimizationReasoning(optimization, playerData) {
    const reasoning = [];

    // Explain starter selections
    optimization.suggestedStarters.forEach(starter => {
      const data = playerData[starter.player.id];
      let reason = `Starting ${starter.player.name} at ${starter.position}`;
      
      if (data?.recentPerformance?.trend === 'improving') {
        reason += ' (improving trend)';
      } else if (data?.matchup?.opponentRank === 'Easy') {
        reason += ' (favorable matchup)';
      } else if (data?.projections?.confidence === 'high') {
        reason += ' (high confidence projection)';
      }
      
      reasoning.push(reason);
    });

    // Explain bench decisions
    optimization.suggestedBench.forEach(bench => {
      const data = playerData[bench.player.id];
      let reason = `Benching ${bench.player.name}`;
      
      if (data?.injuryStatus?.status === 'Questionable') {
        reason += ' (injury concern)';
      } else if (data?.recentPerformance?.trend === 'declining') {
        reason += ' (declining performance)';
      } else if (data?.matchup?.opponentRank === 'Tough') {
        reason += ' (difficult matchup)';
      }
      
      reasoning.push(reason);
    });

    return reasoning;
  }

  assessRisks(roster, playerData, week) {
    const risks = [];

    roster.players.forEach(player => {
      const data = playerData[player.id];
      const playerRisks = [];

      // Injury risks
      if (data?.injuryStatus?.status === 'Questionable' || 
          data?.injuryStatus?.status === 'Doubtful') {
        playerRisks.push({
          type: 'injury',
          severity: data.injuryStatus.status === 'Doubtful' ? 'high' : 'medium',
          description: `Injury status: ${data.injuryStatus.status}`
        });
      }

      // Weather risks
      if (data?.weather) {
        const weather = data.weather;
        if (weather.windSpeed > 20) {
          playerRisks.push({
            type: 'weather',
            severity: 'medium',
            description: `High winds (${weather.windSpeed} mph) - affects passing/kicking`
          });
        }
        if (weather.conditions === 'Rain' || weather.conditions === 'Snow') {
          playerRisks.push({
            type: 'weather',
            severity: 'low',
            description: `${weather.conditions} conditions - may affect gameplay`
          });
        }
      }

      // Performance risks
      if (data?.recentPerformance?.trend === 'declining') {
        playerRisks.push({
          type: 'performance',
          severity: 'medium',
          description: 'Declining performance trend'
        });
      }

      // Matchup risks
      if (data?.matchup?.opponentRank === 'Very Tough') {
        playerRisks.push({
          type: 'matchup',
          severity: 'medium',
          description: 'Very difficult matchup'
        });
      }

      if (playerRisks.length > 0) {
        risks.push({
          player: player,
          risks: playerRisks,
          overallRisk: this.calculateOverallRisk(playerRisks)
        });
      }
    });

    return risks;
  }

  calculateOverallRisk(playerRisks) {
    const riskScores = {
      low: 1,
      medium: 2,
      high: 3
    };

    const totalScore = playerRisks.reduce((sum, risk) => 
      sum + riskScores[risk.severity], 0
    );

    if (totalScore >= 6) return 'high';
    if (totalScore >= 3) return 'medium';
    return 'low';
  }
}

export default RosterAnalyzer;
