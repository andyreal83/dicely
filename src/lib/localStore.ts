import type { Game, GameStatus, Player, Score } from "./types";
import { uuid } from "./uuid";

const STORAGE_KEY = "board-game-scorer:data";

interface Data {
  games: Game[];
  players: Player[];
  scores: Score[];
}

function loadData(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { games: [], players: [], scores: [] };
    return JSON.parse(raw);
  } catch {
    return { games: [], players: [], scores: [] };
  }
}

function saveData(data: Data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const localStore = {
  async createGame(input: { name: string; status: GameStatus; started_at: string }): Promise<Game> {
    const data = loadData();
    const game: Game = {
      id: uuid(),
      name: input.name,
      status: input.status,
      winner_name: null,
      winner_score: null,
      current_player_id: null,
      created_at: new Date().toISOString(),
      started_at: input.started_at,
      ended_at: null,
    };
    data.games.push(game);
    saveData(data);
    return game;
  },

  async getGame(id: string): Promise<Game | null> {
    return loadData().games.find((g) => g.id === id) ?? null;
  },

  async updateGame(id: string, patch: Partial<Game>): Promise<void> {
    const data = loadData();
    const idx = data.games.findIndex((g) => g.id === id);
    if (idx === -1) return;
    data.games[idx] = { ...data.games[idx], ...patch };
    saveData(data);
  },

  async listFinishedGames(): Promise<Game[]> {
    return loadData()
      .games.filter((g) => g.status === "finished")
      .sort((a, b) => (b.ended_at ?? "").localeCompare(a.ended_at ?? ""));
  },

  async listActiveGames(): Promise<Game[]> {
    return loadData()
      .games.filter((g) => g.status === "active")
      .sort((a, b) => (b.started_at ?? "").localeCompare(a.started_at ?? ""));
  },

  async deleteGame(id: string): Promise<void> {
    const data = loadData();
    data.games = data.games.filter((g) => g.id !== id);
    data.players = data.players.filter((p) => p.game_id !== id);
    data.scores = data.scores.filter((s) => s.game_id !== id);
    saveData(data);
  },

  async insertPlayers(
    rows: { game_id: string; name: string; position: number }[]
  ): Promise<Player[]> {
    const data = loadData();
    const created = rows.map((r) => ({
      id: uuid(),
      game_id: r.game_id,
      name: r.name,
      position: r.position,
      created_at: new Date().toISOString(),
    }));
    data.players.push(...created);
    saveData(data);
    return created;
  },

  async listPlayers(gameId: string): Promise<Player[]> {
    return loadData()
      .players.filter((p) => p.game_id === gameId)
      .sort((a, b) => a.position - b.position);
  },

  async deletePlayer(id: string): Promise<void> {
    const data = loadData();
    data.players = data.players.filter((p) => p.id !== id);
    data.scores = data.scores.filter((s) => s.player_id !== id);
    saveData(data);
  },

  async updatePlayerPosition(id: string, position: number): Promise<void> {
    const data = loadData();
    const idx = data.players.findIndex((p) => p.id === id);
    if (idx === -1) return;
    data.players[idx] = { ...data.players[idx], position };
    saveData(data);
  },

  async insertScore(row: { player_id: string; game_id: string; value: number }): Promise<void> {
    const data = loadData();
    data.scores.push({
      id: uuid(),
      player_id: row.player_id,
      game_id: row.game_id,
      value: row.value,
      created_at: new Date().toISOString(),
    });
    saveData(data);
  },

  async listScores(gameId: string): Promise<Score[]> {
    return loadData().scores.filter((s) => s.game_id === gameId);
  },
};
