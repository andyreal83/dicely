export type GameStatus = "setup" | "active" | "finished";

export interface Game {
  id: string;
  name: string;
  status: GameStatus;
  winner_name: string | null;
  winner_score: number | null;
  current_player_id: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface Player {
  id: string;
  game_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface Score {
  id: string;
  player_id: string;
  game_id: string;
  value: number;
  created_at: string;
}
