// Removed cheerio dependency - using mock data for now

class PlayerResearch {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  async researchPlayers(players, week) {
    const playerData = {};
    const promises = players.map(player => this.researchPlayer(player, week));
    
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const player = players[index];
        playerData[player.id] = result.value;
      } else {
        console.warn(`Failed to research player ${players[index].name}:`, result.reason);
        playerData[players[index].id] = this.getDefaultPlayerData();
      }
    });

    return playerData;
  }

  async researchPlayer(player, week) {
    const cacheKey = `${player.id}-${week}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const data = {
        name: player.name,
        position: player.position,
        team: player.team,
        seasonStats: await this.getSeasonStats(player),
        recentPerformance: await this.getRecentPerformance(player),
        matchup: await this.getMatchup(player, week),
        injuryStatus: await this.getInjuryStatus(player),
        weather: await this.getWeatherInfo(player, week),
        projections: await this.getProjections(player, week),
        lastUpdated: new Date().toISOString()
      };

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error researching player ${player.name}:`, error.message);
      return this.getDefaultPlayerData();
    }
  }

  async getSeasonStats(player) {
    try {
      // Try ESPN API first
      const espnStats = await this.getESPNStats(player);
      if (espnStats) return espnStats;

      // Fallback to Pro Football Reference
      const pfrStats = await this.getPFRStats(player);
      if (pfrStats) return pfrStats;

      // Final fallback to mock data
      return this.getMockSeasonStats(player);
    } catch (error) {
      console.error(`Error getting season stats for ${player.name}:`, error.message);
      return this.getMockSeasonStats(player);
    }
  }

  async getESPNStats(player) {
    try {
      const playerId = await this.getESPNPlayerId(player);
      if (!playerId) return null;

      const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/${playerId}/stats`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const stats = data?.stats || [];
      return this.parseESPNStats(stats, player.position);
    } catch (error) {
      return null;
    }
  }

  async getPFRStats(player) {
    // Mock implementation - returns null to fall back to mock data
    return null;
  }

  async getRecentPerformance(player) {
    try {
      // Get last 3-4 weeks of performance
      const recentWeeks = [];
      const currentWeek = this.getCurrentWeek();
      
      for (let week = Math.max(1, currentWeek - 4); week < currentWeek; week++) {
        const weekStats = await this.getWeekStats(player, week);
        if (weekStats) {
          recentWeeks.push({ week, ...weekStats });
        }
      }

      return {
        recentWeeks,
        averagePoints: recentWeeks.length > 0 
          ? recentWeeks.reduce((sum, w) => sum + w.points, 0) / recentWeeks.length 
          : 0,
        trend: this.calculateTrend(recentWeeks)
      };
    } catch (error) {
      console.error(`Error getting recent performance for ${player.name}:`, error.message);
      return { recentWeeks: [], averagePoints: 0, trend: 'stable' };
    }
  }

  async getMatchup(player, week) {
    try {
      const schedule = await this.getNFLSchedule(week);
      const game = schedule.find(g => g.homeTeam === player.team || g.awayTeam === player.team);
      
      if (!game) return null;

      const opponent = game.homeTeam === player.team ? game.awayTeam : game.homeTeam;
      const isHome = game.homeTeam === player.team;
      
      return {
        opponent,
        isHome,
        gameTime: game.gameTime,
        opponentRank: await this.getOpponentRank(opponent, player.position),
        venue: game.venue
      };
    } catch (error) {
      console.error(`Error getting matchup for ${player.name}:`, error.message);
      return null;
    }
  }

  async getInjuryStatus(player) {
    try {
      // Check multiple sources for injury information
      const sources = [
        this.getESPNInjuryStatus(player),
        this.getNFLInjuryStatus(player),
        this.getRotowireInjuryStatus(player)
      ];

      const results = await Promise.allSettled(sources);
      const validResults = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);

      if (validResults.length === 0) {
        return { status: 'Unknown', probability: 'Unknown', lastUpdated: new Date().toISOString() };
      }

      // Combine results and take the most recent/severe status
      return this.combineInjuryStatuses(validResults);
    } catch (error) {
      console.error(`Error getting injury status for ${player.name}:`, error.message);
      return { status: 'Unknown', probability: 'Unknown', lastUpdated: new Date().toISOString() };
    }
  }

  async getWeatherInfo(player, week) {
    try {
      const matchup = await this.getMatchup(player, week);
      if (!matchup) return null;

      const gameTime = new Date(matchup.gameTime);
      const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${matchup.venue}&appid=${process.env.OPENWEATHER_API_KEY}&units=imperial`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(weatherUrl, { 
        signal: controller.signal 
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const weather = data?.list?.find(w => {
        const weatherTime = new Date(w.dt * 1000);
        return Math.abs(weatherTime - gameTime) < 3 * 60 * 60 * 1000; // Within 3 hours
      });

      if (!weather) return null;

      return {
        temperature: weather.main.temp,
        humidity: weather.main.humidity,
        windSpeed: weather.wind.speed,
        conditions: weather.weather[0].main,
        description: weather.weather[0].description
      };
    } catch (error) {
      console.error(`Error getting weather for ${player.name}:`, error.message);
      return null;
    }
  }

  async getProjections(player, week) {
    try {
      // Get projections from multiple sources
      const sources = [
        this.getESPNProjections(player, week),
        this.getYahooProjections(player, week),
        this.getFantasyProsProjections(player, week)
      ];

      const results = await Promise.allSettled(sources);
      const validResults = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);

      if (validResults.length === 0) {
        return this.getMockProjections(player, week);
      }

      return this.combineProjections(validResults);
    } catch (error) {
      console.error(`Error getting projections for ${player.name}:`, error.message);
      return this.getMockProjections(player, week);
    }
  }

  // Helper methods
  getCurrentWeek() {
    const now = new Date();
    const seasonStart = new Date('2024-09-05');
    const weekDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(18, weekDiff + 1));
  }

  calculateTrend(recentWeeks) {
    if (recentWeeks.length < 2) return 'stable';
    
    const points = recentWeeks.map(w => w.points);
    const firstHalf = points.slice(0, Math.ceil(points.length / 2));
    const secondHalf = points.slice(Math.ceil(points.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + p, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    if (diff > 2) return 'improving';
    if (diff < -2) return 'declining';
    return 'stable';
  }

  getDefaultPlayerData() {
    return {
      name: 'Unknown Player',
      position: 'Unknown',
      team: 'Unknown',
      seasonStats: {},
      recentPerformance: { recentWeeks: [], averagePoints: 0, trend: 'stable' },
      matchup: null,
      injuryStatus: { status: 'Unknown', probability: 'Unknown' },
      weather: null,
      projections: { points: 0, confidence: 'low' },
      lastUpdated: new Date().toISOString()
    };
  }

  getMockSeasonStats(player) {
    const baseStats = {
      gamesPlayed: 12,
      fantasyPoints: 0
    };

    switch (player.position) {
      case 'QB':
        return {
          ...baseStats,
          fantasyPoints: 280,
          passingYards: 3200,
          passingTDs: 22,
          interceptions: 8,
          rushingYards: 350,
          rushingTDs: 4
        };
      case 'RB':
        return {
          ...baseStats,
          fantasyPoints: 180,
          rushingYards: 850,
          rushingTDs: 8,
          receptions: 45,
          receivingYards: 320,
          receivingTDs: 2
        };
      case 'WR':
        return {
          ...baseStats,
          fantasyPoints: 160,
          receptions: 65,
          receivingYards: 850,
          receivingTDs: 6,
          rushingYards: 50
        };
      case 'TE':
        return {
          ...baseStats,
          fantasyPoints: 120,
          receptions: 55,
          receivingYards: 650,
          receivingTDs: 5
        };
      case 'K':
        return {
          ...baseStats,
          fantasyPoints: 110,
          fieldGoals: 22,
          extraPoints: 35
        };
      case 'DEF':
        return {
          ...baseStats,
          fantasyPoints: 95,
          sacks: 35,
          interceptions: 12,
          fumblesRecovered: 8,
          defensiveTDs: 2,
          pointsAllowed: 320
        };
      default:
        return baseStats;
    }
  }

  getMockProjections(player, week) {
    const baseProjection = {
      points: Math.floor(Math.random() * 25) + 5,
      confidence: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      week: week
    };

    switch (player.position) {
      case 'QB':
        return { ...baseProjection, points: Math.floor(Math.random() * 35) + 15 };
      case 'RB':
        return { ...baseProjection, points: Math.floor(Math.random() * 30) + 8 };
      case 'WR':
        return { ...baseProjection, points: Math.floor(Math.random() * 25) + 6 };
      case 'TE':
        return { ...baseProjection, points: Math.floor(Math.random() * 20) + 4 };
      case 'K':
        return { ...baseProjection, points: Math.floor(Math.random() * 15) + 6 };
      case 'DEF':
        return { ...baseProjection, points: Math.floor(Math.random() * 20) + 5 };
      default:
        return baseProjection;
    }
  }

  // Placeholder methods for external API calls
  async getESPNPlayerId(player) { return null; }
  async getESPNStats(stats, position) { return null; }
  async getPFRStats($, position) { return null; }
  async getWeekStats(player, week) { return null; }
  async getNFLSchedule(week) { return []; }
  async getOpponentRank(team, position) { return 'Unknown'; }
  async getESPNInjuryStatus(player) { return null; }
  async getNFLInjuryStatus(player) { return null; }
  async getRotowireInjuryStatus(player) { return null; }
  async getESPNProjections(player, week) { return null; }
  async getYahooProjections(player, week) { return null; }
  async getFantasyProsProjections(player, week) { return null; }
  
  parseESPNStats(stats, position) { return {}; }
  parsePFRStats($, position) { 
    // Mock implementation - returns empty object
    return {}; 
  }
  combineInjuryStatuses(statuses) { return statuses[0]; }
  combineProjections(projections) { return projections[0]; }
}

export default PlayerResearch;
