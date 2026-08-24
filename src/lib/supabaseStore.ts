import { supabase } from "./supabase";
import type { Game, GameStatus, Player, Score } from "./types";

export const supabaseStore = {
  async createGame(input: { name: string; status: GameStatus; started_at: string }): Promise<Game> {
    const { data, error } = await supabase.from("games").insert(input).select().single();
    if (error || !data) throw error ?? new Error("Failed to create game");
    return data;
  },

  async getGame(id: string): Promise<Game | null> {
    const { data, error } = await supabase.from("games").select("*").eq("id", id).single();
    if (error) return null;
    return data;
  },

  async updateGame(id: string, patch: Partial<Game>): Promise<void> {
    const { error } = await supabase.from("games").update(patch).eq("id", id);
    if (error) throw error;
  },

  async listFinishedGames(): Promise<Game[]> {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("status", "finished")
      .order("ended_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async insertPlayers(
    rows: { game_id: string; name: string; position: number }[]
  ): Promise<Player[]> {
    const { data, error } = await supabase.from("players").insert(rows).select();
    if (error || !data) throw error ?? new Error("Failed to add players");
    return data;
  },

  async listPlayers(gameId: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", gameId)
      .order("position");
    if (error) throw error;
    return data ?? [];
  },

  async deletePlayer(id: string): Promise<void> {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) throw error;
  },

  async updatePlayerPosition(id: string, position: number): Promise<void> {
    const { error } = await supabase.from("players").update({ position }).eq("id", id);
    if (error) throw error;
  },

  async insertScore(row: { player_id: string; game_id: string; value: number }): Promise<void> {
    const { error } = await supabase.from("scores").insert(row);
    if (error) throw error;
  },

  async listScores(gameId: string): Promise<Score[]> {
    const { data, error } = await supabase.from("scores").select("*").eq("game_id", gameId);
    if (error) throw error;
    return data ?? [];
  },
};
