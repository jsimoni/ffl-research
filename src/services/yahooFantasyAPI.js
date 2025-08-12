// Using built-in fetch API instead of axios

class YahooFantasyAPI {
  constructor() {
    this.baseURL = 'https://fantasysports.yahooapis.com/fantasy/v2';
    this.accessToken = null;
    this.refreshToken = null;
  }

  async authenticate() {
    if (this.accessToken) {
      return this.accessToken;
    }

    // For this implementation, we'll use a simplified approach
    // In production, you'd want to implement proper OAuth2 flow
    console.log('⚠️  Note: This is a simplified authentication implementation.');
    console.log('   For production use, implement proper OAuth2 flow with Yahoo.');
    
    // You can also manually provide tokens via environment variables
    this.accessToken = process.env.YAHOO_ACCESS_TOKEN;
    this.refreshToken = process.env.YAHOO_REFRESH_TOKEN;

    if (!this.accessToken) {
      console.log('ℹ️  No Yahoo access token found. Using mock data for demonstration.');
      this.accessToken = 'mock_token';
    }

    return this.accessToken;
  }

  async getRoster(leagueId, teamId) {
    await this.authenticate();
    
    try {
      const url = `${this.baseURL}/team/nfl.l.${leagueId}.t.${teamId}/roster`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.parseRosterResponse(data);
    } catch (error) {
      console.error('Error fetching roster:', error.message);
      // Fallback to mock data for demonstration
      return this.getMockRoster();
    }
  }

  async getLeagueRules(leagueId) {
    await this.authenticate();
    
    try {
      const url = `${this.baseURL}/league/nfl.l.${leagueId}/settings`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.parseLeagueRulesResponse(data);
    } catch (error) {
      console.error('Error fetching league rules:', error.message);
      // Fallback to default rules
      return this.getDefaultLeagueRules();
    }
  }

  async getPlayerStats(playerIds, week) {
    await this.authenticate();
    
    try {
      const playerIdsString = playerIds.map(id => `nfl.p.${id}`).join(',');
      const url = `${this.baseURL}/players;player_keys=${playerIdsString}/stats;type=week;week=${week}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.parsePlayerStatsResponse(data);
    } catch (error) {
      console.error('Error fetching player stats:', error.message);
      return {};
    }
  }

  parseRosterResponse(data) {
    // Parse Yahoo API response format
    // This is a simplified parser - adjust based on actual API response
    try {
      const roster = {
        teamId: data.fantasy_content?.team?.[0]?.team_id || 'unknown',
        teamName: data.fantasy_content?.team?.[0]?.name || 'Unknown Team',
        players: []
      };

      const players = data.fantasy_content?.team?.[1]?.roster?.[0]?.players || [];
      
      players.forEach(player => {
        if (player.player) {
          const playerData = player.player[0];
          const playerStats = player.player[1];
          
          roster.players.push({
            id: playerData.player_id,
            name: playerData.name?.full || 'Unknown Player',
            position: playerData.display_position || 'Unknown',
            team: playerData.editorial_team_abbr || 'Unknown',
            status: playerData.status || 'Active',
            selectedPosition: playerStats?.selected_position?.[1]?.position || 'BN',
            isStarting: playerStats?.selected_position?.[1]?.position !== 'BN'
          });
        }
      });

      return roster;
    } catch (error) {
      console.error('Error parsing roster response:', error);
      return this.getMockRoster();
    }
  }

  parseLeagueRulesResponse(data) {
    // Parse Yahoo API response format for league settings
    try {
      const settings = data.fantasy_content?.league?.[1]?.settings?.[0] || {};
      
      return {
        rosterPositions: settings.roster_positions || [],
        scoringSettings: settings.scoring_settings || {},
        maxTeams: settings.num_teams || 12,
        maxAdds: settings.max_adds || 0,
        maxTrades: settings.max_trades || 0,
        tradeDeadline: settings.trade_deadline || null
      };
    } catch (error) {
      console.error('Error parsing league rules response:', error);
      return this.getDefaultLeagueRules();
    }
  }

  parsePlayerStatsResponse(data) {
    // Parse player statistics from Yahoo API
    const stats = {};
    
    try {
      const players = data.fantasy_content?.players || [];
      
      players.forEach(player => {
        if (player.player) {
          const playerData = player.player[0];
          const playerStats = player.player[1];
          
          stats[playerData.player_id] = {
            week: playerStats?.stats?.[0]?.stat?.week || 0,
            points: playerStats?.stats?.[0]?.stat?.value || 0,
            stats: playerStats?.stats || []
          };
        }
      });
    } catch (error) {
      console.error('Error parsing player stats response:', error);
    }
    
    return stats;
  }

  getMockRoster() {
    // Mock roster data for demonstration purposes
    return {
      teamId: '1',
      teamName: 'Mock Team',
      players: [
        {
          id: '1',
          name: 'Patrick Mahomes',
          position: 'QB',
          team: 'KC',
          status: 'Active',
          selectedPosition: 'QB',
          isStarting: true
        },
        {
          id: '2',
          name: 'Christian McCaffrey',
          position: 'RB',
          team: 'SF',
          status: 'Active',
          selectedPosition: 'RB',
          isStarting: true
        },
        {
          id: '3',
          name: 'Tyreek Hill',
          position: 'WR',
          team: 'MIA',
          status: 'Active',
          selectedPosition: 'WR',
          isStarting: true
        },
        {
          id: '4',
          name: 'Travis Kelce',
          position: 'TE',
          team: 'KC',
          status: 'Active',
          selectedPosition: 'TE',
          isStarting: true
        },
        {
          id: '5',
          name: 'Justin Tucker',
          position: 'K',
          team: 'BAL',
          status: 'Active',
          selectedPosition: 'K',
          isStarting: true
        },
        {
          id: '6',
          name: 'Buffalo Bills',
          position: 'DEF',
          team: 'BUF',
          status: 'Active',
          selectedPosition: 'DEF',
          isStarting: true
        },
        {
          id: '7',
          name: 'Josh Allen',
          position: 'QB',
          team: 'BUF',
          status: 'Active',
          selectedPosition: 'BN',
          isStarting: false
        },
        {
          id: '8',
          name: 'Saquon Barkley',
          position: 'RB',
          team: 'PHI',
          status: 'Active',
          selectedPosition: 'BN',
          isStarting: false
        }
      ]
    };
  }

  getDefaultLeagueRules() {
    return {
      rosterPositions: [
        { position: 'QB', count: 1 },
        { position: 'RB', count: 2 },
        { position: 'WR', count: 2 },
        { position: 'TE', count: 1 },
        { position: 'K', count: 1 },
        { position: 'DEF', count: 1 },
        { position: 'BN', count: 6 }
      ],
      scoringSettings: {
        'Passing Yards': 0.04,
        'Passing Touchdowns': 4,
        'Interceptions': -2,
        'Rushing Yards': 0.1,
        'Rushing Touchdowns': 6,
        'Receptions': 0.5,
        'Receiving Yards': 0.1,
        'Receiving Touchdowns': 6,
        'Field Goals 0-19': 3,
        'Field Goals 20-29': 3,
        'Field Goals 30-39': 3,
        'Field Goals 40-49': 4,
        'Field Goals 50+': 5,
        'Extra Points': 1,
        'Sacks': 1,
        'Interceptions': 2,
        'Fumbles Recovered': 2,
        'Safeties': 2,
        'Defensive Touchdowns': 6,
        'Points Allowed 0': 10,
        'Points Allowed 1-6': 7,
        'Points Allowed 7-13': 4,
        'Points Allowed 14-20': 1,
        'Points Allowed 21-27': 0,
        'Points Allowed 28-34': -1,
        'Points Allowed 35+': -4
      },
      maxTeams: 12,
      maxAdds: 0,
      maxTrades: 0,
      tradeDeadline: null
    };
  }
}

export default YahooFantasyAPI;
