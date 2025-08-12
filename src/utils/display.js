import chalk from 'chalk';

function displayRoster(roster, leagueRules) {
  console.log(chalk.blue(`\n📋 ${roster.teamName} Roster`));
  console.log(chalk.gray('─'.repeat(80)));

  // Group players by position
  const positionGroups = groupByPosition(roster.players);
  
  Object.keys(positionGroups).forEach(position => {
    const players = positionGroups[position];
    const starters = players.filter(p => p.isStarting);
    const bench = players.filter(p => !p.isStarting);
    
    console.log(chalk.yellow(`\n${position} (${players.length} total)`));
    
    // Display starters
    if (starters.length > 0) {
      console.log(chalk.green('  Starters:'));
      starters.forEach(player => {
        console.log(`    ✅ ${player.name} (${player.team})`);
      });
    }
    
    // Display bench
    if (bench.length > 0) {
      console.log(chalk.gray('  Bench:'));
      bench.forEach(player => {
        console.log(`    ⏸️  ${player.name} (${player.team})`);
      });
    }
  });

  // Display league rules summary
  console.log(chalk.blue('\n📏 League Rules Summary'));
  console.log(chalk.gray('─'.repeat(80)));
  
  if (leagueRules.rosterPositions) {
    leagueRules.rosterPositions.forEach(pos => {
      if (pos.position !== 'BN') {
        console.log(`  ${pos.position}: ${pos.count} required`);
      }
    });
  }
  
  console.log(`  Max Teams: ${leagueRules.maxTeams}`);
  console.log(`  Max Adds: ${leagueRules.maxAdds === 0 ? 'Unlimited' : leagueRules.maxAdds}`);
}

function displayRecommendations(recommendations, week) {
  console.log(chalk.blue(`\n🎯 Week ${week} Recommendations`));
  console.log(chalk.gray('─'.repeat(80)));

  // Display summary
  displaySummary(recommendations.summary);

  // Display starter recommendations
  displayStarterRecommendations(recommendations.starterRecommendations);

  // Display bench recommendations
  displayBenchRecommendations(recommendations.benchRecommendations);

  // Display waiver recommendations
  displayWaiverRecommendations(recommendations.waiverRecommendations);

  // Display trade recommendations
  displayTradeRecommendations(recommendations.tradeRecommendations);

  // Display risk alerts
  displayRiskAlerts(recommendations.riskAlerts);

  // Display confidence and projected score
  displayConfidence(recommendations.confidence, recommendations.projectedScore);
}

function displaySummary(summary) {
  console.log(chalk.cyan('\n📊 Team Summary'));
  console.log(chalk.gray('─'.repeat(40)));
  
  const gradeColor = getGradeColor(summary.overallGrade);
  console.log(`  Overall Grade: ${gradeColor(summary.overallGrade)}`);
  console.log(`  Projected Points: ${chalk.yellow(summary.projectedPoints.toFixed(1))}`);
  console.log(`  Strengths: ${chalk.green(summary.strengths)}`);
  console.log(`  Weaknesses: ${chalk.red(summary.weaknesses)}`);
  console.log(`  Risks: ${chalk.blue(summary.risks)}`);
  
  if (summary.keyInsights.length > 0) {
    console.log(chalk.cyan('\n  Key Insights:'));
    summary.keyInsights.forEach(insight => {
      console.log(`    • ${insight}`);
    });
  }
}

function displayStarterRecommendations(recommendations) {
  if (recommendations.length === 0) return;

  console.log(chalk.green('\n🚀 Starter Recommendations'));
  console.log(chalk.gray('─'.repeat(60)));

  recommendations.forEach((rec, index) => {
    const confidenceColor = getConfidenceColor(rec.confidence);
    const riskColor = getRiskColor(rec.riskLevel);
    
    console.log(chalk.white(`\n${index + 1}. ${rec.player.name} (${rec.position})`));
    console.log(`   Team: ${rec.player.team}`);
    console.log(`   Projected Points: ${chalk.yellow(rec.projectedPoints.toFixed(1))}`);
    console.log(`   Confidence: ${confidenceColor((rec.confidence * 100).toFixed(0) + '%')}`);
    console.log(`   Risk Level: ${riskColor(rec.riskLevel.toUpperCase())}`);
    console.log(`   Reasoning: ${chalk.gray(rec.reasoning)}`);
    
    if (rec.alternatives.length > 0) {
      console.log(chalk.cyan('   Alternatives:'));
      rec.alternatives.forEach(alt => {
        console.log(`     • ${alt.player.name} (${alt.score.toFixed(1)} pts) - ${alt.reasoning}`);
      });
    }
  });
}

function displayBenchRecommendations(recommendations) {
  if (recommendations.length === 0) return;

  console.log(chalk.blue('\n⏸️  Bench Recommendations'));
  console.log(chalk.gray('─'.repeat(60)));

  recommendations.forEach((rec, index) => {
    const riskColor = getRiskColor(rec.riskLevel);
    
    console.log(chalk.white(`\n${index + 1}. ${rec.player.name} (${rec.position})`));
    console.log(`   Team: ${rec.player.team}`);
    console.log(`   Projected Points: ${chalk.yellow(rec.projectedPoints.toFixed(1))}`);
    console.log(`   Risk Level: ${riskColor(rec.riskLevel.toUpperCase())}`);
    console.log(`   Reasoning: ${chalk.gray(rec.reasoning)}`);
    
    if (rec.watchList) {
      console.log(chalk.cyan('   ⭐ On Watch List'));
    }
  });
}

function displayWaiverRecommendations(recommendations) {
  if (recommendations.length === 0) return;

  console.log(chalk.magenta('\n📝 Waiver Wire Recommendations'));
  console.log(chalk.gray('─'.repeat(60)));

  recommendations.forEach((rec, index) => {
    const priorityColor = getPriorityColor(rec.priority);
    
    console.log(chalk.white(`\n${index + 1}. ${rec.position} Position`));
    console.log(`   Priority: ${priorityColor(`Priority ${rec.priority}/10`)}`);
    console.log(`   Reasoning: ${chalk.gray(rec.reasoning)}`);
    
    if (rec.suggestedPlayers.length > 0) {
      console.log(chalk.green('   Suggested Pickups:'));
      rec.suggestedPlayers.forEach(player => {
        console.log(`     • ${player}`);
      });
    }
    
    if (rec.dropCandidates.length > 0) {
      console.log(chalk.red('   Drop Candidates:'));
      rec.dropCandidates.forEach(player => {
        console.log(`     • ${player}`);
      });
    }
  });
}

function displayTradeRecommendations(recommendations) {
  if (recommendations.length === 0) return;

  console.log(chalk.magenta('\n🔄 Trade Recommendations'));
  console.log(chalk.gray('─'.repeat(60)));

  recommendations.forEach((rec, index) => {
    console.log(chalk.white(`\n${index + 1}. ${rec.type.toUpperCase()} - ${rec.position}`));
    console.log(`   Priority: ${getPriorityColor(rec.priority)(rec.priority)}`);
    console.log(`   Reasoning: ${chalk.gray(rec.reasoning)}`);
    
    if (rec.tradeCandidates.length > 0) {
      console.log(chalk.blue('   Trade Candidates:'));
      rec.tradeCandidates.forEach(player => {
        console.log(`     • ${player}`);
      });
    }
    
    if (rec.targetPositions.length > 0) {
      console.log(chalk.green('   Target Positions:'));
      rec.targetPositions.forEach(position => {
        console.log(`     • ${position}`);
      });
    }
  });
}

function displayRiskAlerts(alerts) {
  if (alerts.length === 0) return;

  console.log(chalk.red('\n⚠️  Risk Alerts'));
  console.log(chalk.gray('─'.repeat(60)));

  alerts.forEach((alert, index) => {
    const urgencyColor = alert.urgency === 'immediate' ? chalk.red : chalk.blue;
    
    console.log(chalk.white(`\n${index + 1}. ${alert.player.name} (${alert.player.position})`));
    console.log(`   Risk Level: ${getRiskColor(alert.riskLevel)(alert.riskLevel.toUpperCase())}`);
    console.log(`   Urgency: ${urgencyColor(alert.urgency.toUpperCase())}`);
    
    alert.risks.forEach(risk => {
      const severityColor = getSeverityColor(risk.severity);
      console.log(`   • ${severityColor(risk.severity.toUpperCase())}: ${risk.description}`);
    });
    
    console.log(`   Recommendation: ${chalk.gray(alert.recommendation)}`);
  });
}

function displayConfidence(confidence, projectedScore) {
  console.log(chalk.blue('\n📈 Confidence & Projections'));
  console.log(chalk.gray('─'.repeat(40)));
  
  const confidenceColor = getConfidenceColor(confidence);
  console.log(`  Overall Confidence: ${confidenceColor((confidence * 100).toFixed(0) + '%')}`);
  console.log(`  Projected Score: ${chalk.yellow(projectedScore.toFixed(1))} points`);
  
  if (confidence > 0.8) {
    console.log(chalk.green('  🎉 High confidence in recommendations!'));
  } else if (confidence > 0.6) {
    console.log(chalk.yellow('  ⚠️  Moderate confidence - monitor closely'));
  } else {
    console.log(chalk.red('  🚨 Low confidence - consider manual review'));
  }
}

// Helper functions
function groupByPosition(players) {
  const groups = {};
  players.forEach(player => {
    if (!groups[player.position]) {
      groups[player.position] = [];
    }
    groups[player.position].push(player);
  });
  return groups;
}

function getGradeColor(grade) {
  switch (grade) {
    case 'A':
    case 'A+':
      return chalk.green;
    case 'A-':
    case 'B+':
      return chalk.green;
    case 'B':
      return chalk.yellow;
    case 'B-':
    case 'C+':
      return chalk.blue;
    case 'C':
    case 'C-':
    case 'D':
    case 'F':
      return chalk.red;
    default:
      return chalk.white;
  }
}

function getConfidenceColor(confidence) {
  if (confidence >= 0.8) return chalk.green;
  if (confidence >= 0.6) return chalk.yellow;
  if (confidence >= 0.4) return chalk.blue;
  return chalk.red;
}

function getRiskColor(risk) {
  switch (risk) {
    case 'low':
      return chalk.green;
    case 'medium':
      return chalk.yellow;
    case 'high':
      return chalk.red;
    default:
      return chalk.white;
  }
}

function getPriorityColor(priority) {
  if (priority >= 8) return chalk.red;
  if (priority >= 6) return chalk.yellow;
  if (priority >= 4) return chalk.blue;
  return chalk.green;
}

function getSeverityColor(severity) {
  switch (severity) {
    case 'low':
      return chalk.yellow;
    case 'medium':
      return chalk.blue;
    case 'high':
      return chalk.red;
    default:
      return chalk.white;
  }
}

export {
  displayRoster,
  displayRecommendations
};
