#!/usr/bin/env node

import 'dotenv/config';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import inquirer from 'inquirer';
import YahooFantasyAPI from './src/services/yahooFantasyAPI.js';
import PlayerResearch from './src/services/playerResearch.js';
import RosterAnalyzer from './src/services/rosterAnalyzer.js';
import RecommendationEngine from './src/services/recommendationEngine.js';
import { displayRecommendations, displayRoster } from './src/utils/display.js';

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('week', {
      alias: 'w',
      type: 'number',
      description: 'Week number for recommendations',
      default: getCurrentWeek()
    })
    .option('league', {
      alias: 'l',
      type: 'string',
      description: 'League ID',
      default: process.env.LEAGUE_ID
    })
    .option('team', {
      alias: 't',
      type: 'string',
      description: 'Team ID',
      default: process.env.TEAM_ID
    })
    .option('interactive', {
      alias: 'i',
      type: 'boolean',
      description: 'Run in interactive mode',
      default: false
    })
    .option('research', {
      alias: 'r',
      type: 'boolean',
      description: 'Perform detailed player research',
      default: true
    })
    .help()
    .argv;

  try {
    console.log('🏈 Yahoo Fantasy Football Roster Analyzer\n');

    if (argv.interactive) {
      await runInteractiveMode();
    } else {
      await runAnalysis(argv);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function runInteractiveMode() {
  const questions = [
    {
      type: 'input',
      name: 'leagueId',
      message: 'Enter your Yahoo Fantasy League ID:',
      default: process.env.LEAGUE_ID,
      validate: (input) => input.length > 0 ? true : 'League ID is required'
    },
    {
      type: 'input',
      name: 'teamId',
      message: 'Enter your Team ID:',
      default: process.env.TEAM_ID,
      validate: (input) => input.length > 0 ? true : 'Team ID is required'
    },
    {
      type: 'number',
      name: 'week',
      message: 'Enter the week number for recommendations:',
      default: getCurrentWeek(),
      validate: (input) => input >= 1 && input <= 18 ? true : 'Week must be between 1 and 18'
    },
    {
      type: 'confirm',
      name: 'research',
      message: 'Perform detailed player research?',
      default: true
    }
  ];

  const answers = await inquirer.prompt(questions);
  await runAnalysis(answers);
}

async function runAnalysis(options) {
  console.log(`📊 Analyzing roster for Week ${options.week}...\n`);

  // Initialize services
  const yahooAPI = new YahooFantasyAPI();
  const playerResearch = new PlayerResearch();
  const rosterAnalyzer = new RosterAnalyzer();
  const recommendationEngine = new RecommendationEngine();

  // Get roster and league rules
  console.log('🔍 Fetching roster and league information...');
  const roster = await yahooAPI.getRoster(options.league, options.team);
  const leagueRules = await yahooAPI.getLeagueRules(options.league);
  
  console.log('✅ Roster and rules retrieved successfully\n');

  // Display current roster
  displayRoster(roster, leagueRules);

  // Research player information if requested
  let playerData = {};
  if (options.research) {
    console.log('🔬 Researching player statistics and matchups...');
    playerData = await playerResearch.researchPlayers(roster.players, options.week);
    console.log('✅ Player research completed\n');
  }

  // Analyze roster
  console.log('📈 Analyzing roster performance...');
  const analysis = rosterAnalyzer.analyzeRoster(roster, leagueRules, playerData, options.week);
  console.log('✅ Roster analysis completed\n');

  // Generate recommendations
  console.log('🎯 Generating starter recommendations...');
  const recommendations = recommendationEngine.generateRecommendations(analysis, options.week);
  console.log('✅ Recommendations generated\n');

  // Display recommendations
  displayRecommendations(recommendations, options.week);

  console.log('\n🎉 Analysis complete! Good luck this week! 🏆');
}

function getCurrentWeek() {
  // Simple logic to determine current NFL week
  // This could be enhanced with actual NFL schedule data
  const now = new Date();
  const seasonStart = new Date('2024-09-05'); // Approximate NFL season start
  const weekDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(18, weekDiff + 1));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, runAnalysis };
