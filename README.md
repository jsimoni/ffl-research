# Yahoo Fantasy Football Roster Analyzer

A comprehensive Node.js application that analyzes your Yahoo Fantasy Football roster, researches player information from multiple sources, and provides intelligent starter recommendations for any given week.

## 🏈 Features

- **Roster Analysis**: Automatically fetches and analyzes your Yahoo Fantasy Football roster
- **Player Research**: Gathers player statistics, injury status, matchups, and projections from multiple sources
- **Smart Recommendations**: AI-powered starter recommendations based on multiple factors
- **Risk Assessment**: Identifies and alerts you to potential risks (injuries, weather, poor matchups)
- **Waiver Wire Suggestions**: Recommends potential pickups and drop candidates
- **Trade Analysis**: Suggests trade opportunities based on roster strengths and weaknesses
- **Beautiful CLI Output**: Color-coded, easy-to-read recommendations in the terminal

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Yahoo Fantasy Football account
- League ID and Team ID (see setup instructions below)

### Installation

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

3. Copy the environment template:
```bash
cp env.example .env
```

4. Configure your environment variables (see Configuration section below)

### Configuration

Edit your `.env` file with the following information:

```env
# Yahoo Fantasy Football API Configuration
YAHOO_CLIENT_ID=your_yahoo_client_id
YAHOO_CLIENT_SECRET=your_yahoo_client_secret
YAHOO_REDIRECT_URI=http://localhost:3000/callback

# League Configuration
LEAGUE_ID=your_league_id
TEAM_ID=your_team_id

# Optional: External APIs for enhanced research
ESPN_API_KEY=your_espn_api_key
PRO_FOOTBALL_REFERENCE_API_KEY=your_pfr_api_key
OPENWEATHER_API_KEY=your_openweather_api_key

# Application Settings
PORT=3000
NODE_ENV=development
```

### Getting Your League and Team IDs

1. **League ID**: 
   - Go to your Yahoo Fantasy Football league
   - The League ID is in the URL: `https://football.fantasysports.yahoo.com/f1/LEAGUE_ID`
   - Or check the league settings page

2. **Team ID**:
   - Go to your team page
   - The Team ID is in the URL: `https://football.fantasysports.yahoo.com/f1/LEAGUE_ID/TEAM_ID`
   - Or check the team settings

### Yahoo API Setup (Optional)

For full functionality, you'll need to set up Yahoo OAuth2:

1. Go to [Yahoo Developer Console](https://developer.yahoo.com/apps/)
2. Create a new application
3. Get your Client ID and Client Secret
4. Set up OAuth2 redirect URI

## 📖 Usage

### Basic Usage

```bash
# Analyze current week with default settings
npm start

# Analyze specific week
npm start -- --week 5

# Interactive mode
npm start -- --interactive

# Skip detailed research (faster, uses mock data)
npm start -- --no-research
```

### Command Line Options

```bash
npm start -- --help
```

Available options:
- `--week, -w`: Week number for analysis (default: current week)
- `--league, -l`: League ID (default: from .env)
- `--team, -t`: Team ID (default: from .env)
- `--interactive, -i`: Run in interactive mode
- `--research, -r`: Perform detailed player research (default: true)

### Interactive Mode

Run with `--interactive` flag for a guided setup:

```bash
npm start -- --interactive
```

This will prompt you for:
- League ID
- Team ID
- Week number
- Whether to perform detailed research

## 📊 Sample Output

```
🏈 Yahoo Fantasy Football Roster Analyzer

📊 Analyzing roster for Week 5...

🔍 Fetching roster and league information...
✅ Roster and rules retrieved successfully

📋 Mock Team Roster
────────────────────────────────────────────────────────────────────────────────

QB (2 total)

  Starters:
    ✅ Patrick Mahomes (KC)
  Bench:
    ⏸️  Josh Allen (BUF)

RB (2 total)

  Starters:
    ✅ Christian McCaffrey (SF)
  Bench:
    ⏸️  Saquon Barkley (PHI)

WR (1 total)

  Starters:
    ✅ Tyreek Hill (MIA)

TE (1 total)

  Starters:
    ✅ Travis Kelce (KC)

K (1 total)

  Starters:
    ✅ Justin Tucker (BAL)

DEF (1 total)

  Starters:
    ✅ Buffalo Bills (BUF)

📏 League Rules Summary
────────────────────────────────────────────────────────────────────────────────
  QB: 1 required
  RB: 2 required
  WR: 2 required
  TE: 1 required
  K: 1 required
  DEF: 1 required
  Max Teams: 12
  Max Adds: Unlimited

🔬 Researching player statistics and matchups...
✅ Player research completed

📈 Analyzing roster performance...
✅ Roster analysis completed

🎯 Generating starter recommendations...
✅ Recommendations generated

🎯 Week 5 Recommendations
────────────────────────────────────────────────────────────────────────────────

📊 Team Summary
────────────────────────────────────────
  Overall Grade: A-
  Projected Points: 125.3
  Strengths: 2
  Weaknesses: 1
  Risks: 0

  Key Insights:
    • Strong RB performance with 2 players
    • Weak WR performance needs attention

🚀 Starter Recommendations
────────────────────────────────────────────────────────

1. Patrick Mahomes (QB)
   Team: KC
   Projected Points: 24.5
   Confidence: 85%
   Risk Level: LOW
   Reasoning: High projected points, Improving performance trend

2. Christian McCaffrey (RB)
   Team: SF
   Projected Points: 22.1
   Confidence: 82%
   Risk Level: LOW
   Reasoning: High projected points, Consistent high performance

3. Tyreek Hill (WR)
   Team: MIA
   Projected Points: 18.7
   Confidence: 78%
   Risk Level: LOW
   Reasoning: Good projected points, Favorable matchup

4. Travis Kelce (TE)
   Team: KC
   Projected Points: 16.2
   Confidence: 75%
   Risk Level: LOW
   Reasoning: Good projected points, Consistent high performance

5. Justin Tucker (K)
   Team: BAL
   Projected Points: 12.8
   Confidence: 70%
   Risk Level: LOW
   Reasoning: Good projected points

6. Buffalo Bills (DEF)
   Team: BUF
   Projected Points: 10.2
   Confidence: 65%
   Risk Level: LOW
   Reasoning: Moderate scoring potential

⏸️  Bench Recommendations
────────────────────────────────────────────────────────

1. Josh Allen (QB)
   Team: BUF
   Projected Points: 21.3
   Risk Level: LOW
   Reasoning: Low projected points

2. Saquon Barkley (RB)
   Team: PHI
   Projected Points: 15.8
   Risk Level: LOW
   Reasoning: Low projected points

📝 Waiver Wire Recommendations
────────────────────────────────────────────────────────

1. WR Position
   Priority: Priority 7/10
   Reasoning: Address Weak WR performance needs attention
   Suggested Pickups:
     • WR3 Option 1
     • WR3 Option 2
   Drop Candidates:
     • Saquon Barkley

📈 Confidence & Projections
────────────────────────────────────────
  Overall Confidence: 76%
  Projected Score: 125.3 points
  🎉 High confidence in recommendations!

🎉 Analysis complete! Good luck this week! 🏆
```

## 🔧 Architecture

The application is built with a modular architecture:

- **`index.js`**: Main entry point with CLI interface
- **`src/services/`**: Core business logic
  - `yahooFantasyAPI.js`: Yahoo API integration
  - `playerResearch.js`: Player data gathering
  - `rosterAnalyzer.js`: Roster analysis and optimization
  - `recommendationEngine.js`: Recommendation generation
- **`src/utils/`**: Utility functions
  - `display.js`: CLI output formatting

## 🔍 Data Sources

The application researches players from multiple sources:

- **Yahoo Fantasy API**: Roster and league data
- **ESPN API**: Player statistics and projections
- **Pro Football Reference**: Historical data and advanced stats
- **Weather APIs**: Game day weather conditions
- **Injury Reports**: Multiple sources for injury status

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

### Adding New Data Sources

To add new data sources, extend the `PlayerResearch` class:

```javascript
// In src/services/playerResearch.js
async getNewSourceStats(player) {
  // Implement your new data source
  return stats;
}
```

### Customizing Recommendations

Modify the recommendation logic in `RecommendationEngine`:

```javascript
// In src/services/recommendationEngine.js
calculatePlayerScore(player, data, week) {
  // Add your custom scoring logic
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This tool is for educational and entertainment purposes. Fantasy football involves risk and uncertainty. Always make your own informed decisions about your fantasy team. The creators are not responsible for any losses or poor performance based on these recommendations.

## 🆘 Troubleshooting

### Common Issues

1. **"Yahoo access token not found"**
   - Set up Yahoo OAuth2 or use mock data mode
   - Run with `--no-research` flag

2. **"League ID not found"**
   - Check your `.env` file
   - Verify the League ID in your Yahoo Fantasy URL

3. **"Team ID not found"**
   - Check your `.env` file
   - Verify the Team ID in your Yahoo Fantasy URL

4. **Slow performance**
   - Use `--no-research` flag for faster analysis
   - Check your internet connection

### Getting Help

- Check the troubleshooting section above
- Review the configuration section
- Ensure all dependencies are installed
- Try running in interactive mode for guided setup

## 🎯 Future Enhancements

- Web interface
- Mobile app
- Historical performance tracking
- Advanced analytics dashboard
- Integration with more fantasy platforms
- Machine learning improvements
- Real-time updates and notifications
