import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { store } from "../lib/store";
import { useDragReorder } from "../lib/useDragReorder";
import { DragHandleIcon } from "../components/DragHandle";
import type { Game, Player, Score } from "../lib/types";

function nextPlayerId(ordered: Player[], currentId: string | null): string | null {
  if (ordered.length === 0) return null;
  if (!currentId) return ordered[0].id;
  const idx = ordered.findIndex((p) => p.id === currentId);
  if (idx === -1) return ordered[0].id;
  return ordered[(idx + 1) % ordered.length].id;
}

function nextPlayerAfterRemoval(ordered: Player[], removedId: string): string | null {
  const remaining = ordered.filter((p) => p.id !== removedId);
  if (remaining.length === 0) return null;
  const idx = ordered.findIndex((p) => p.id === removedId);
  for (let offset = 1; offset <= ordered.length; offset++) {
    const candidate = ordered[(idx + offset) % ordered.length];
    if (candidate.id !== removedId) return candidate.id;
  }
  return remaining[0].id;
}

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [scoreInput, setScoreInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!gameId) return;
    const [g, p, s] = await Promise.all([
      store.getGame(gameId),
      store.listPlayers(gameId),
      store.listScores(gameId),
    ]);
    if (!g) {
      setError("Couldn't load this game.");
      setLoading(false);
      return;
    }
    setGame(g);
    setPlayers(p);
    setScores(s);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    load();
  }, [load]);

  const { setRowRef, draggingIndex, handlePointerDown, handlePointerMove, handlePointerUp } =
    useDragReorder(players, setPlayers);

  if (loading) return <div className="empty-state">Loading…</div>;
  if (error || !game) return <div className="empty-state">{error ?? "Game not found."}</div>;

  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const p of players) {
    totals.set(p.id, 0);
    counts.set(p.id, 0);
  }
  for (const s of scores) {
    totals.set(s.player_id, (totals.get(s.player_id) ?? 0) + s.value);
    counts.set(s.player_id, (counts.get(s.player_id) ?? 0) + 1);
  }

  const recentByPlayer = new Map<string, Score[]>();
  for (const p of players) {
    recentByPlayer.set(
      p.id,
      scores
        .filter((s) => s.player_id === p.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .slice(-3)
    );
  }

  const currentPlayer = players.find((p) => p.id === game.current_player_id) ?? null;

  async function submitScore() {
    const value = Number(scoreInput);
    if (!currentPlayer || !Number.isFinite(value) || scoreInput.trim() === "") return;
    setBusy(true);
    try {
      await store.insertScore({ player_id: currentPlayer.id, game_id: game!.id, value });
      const next = nextPlayerId(players, currentPlayer.id);
      await store.updateGame(game!.id, { current_player_id: next });
      setScoreInput("");
      await load();
    } catch {
      setError("Couldn't save that score.");
    }
    setBusy(false);
  }

  async function skipTurn() {
    if (!currentPlayer) return;
    setBusy(true);
    const next = nextPlayerId(players, currentPlayer.id);
    await store.updateGame(game!.id, { current_player_id: next });
    setScoreInput("");
    await load();
    setBusy(false);
  }

  async function removePlayer(playerId: string) {
    setBusy(true);
    const wasCurrent = game!.current_player_id === playerId;
    try {
      await store.deletePlayer(playerId);
      if (wasCurrent) {
        const next = nextPlayerAfterRemoval(players, playerId);
        await store.updateGame(game!.id, { current_player_id: next });
      }
      await load();
    } catch {
      setError("Couldn't remove that player.");
    }
    setBusy(false);
  }

  async function commitOrder(finalPlayers: Player[]) {
    setBusy(true);
    await Promise.all(
      finalPlayers.map((p, index) => store.updatePlayerPosition(p.id, index))
    );
    await load();
    setBusy(false);
  }

  function handleDragEnd() {
    handlePointerUp();
    commitOrder(players);
  }

  async function endGame() {
    if (players.length === 0) return;
    if (!window.confirm("End the game now? This will save the final scores to history.")) return;
    let winner = players[0];
    for (const p of players) {
      if ((totals.get(p.id) ?? 0) > (totals.get(winner.id) ?? 0)) winner = p;
    }
    setBusy(true);
    await store.updateGame(game!.id, {
      status: "finished",
      ended_at: new Date().toISOString(),
      winner_name: winner.name,
      winner_score: totals.get(winner.id) ?? 0,
      current_player_id: null,
    });
    await load();
    setBusy(false);
  }

  if (game.status === "finished") {
    return (
      <div>
        <div className="card winner-banner">
          <div className="trophy">🏆</div>
          <div className="name">{game.winner_name}</div>
          <div className="muted">wins {game.name} with {game.winner_score} points</div>
        </div>
        <div className="stack">
          <button className="btn" onClick={() => navigate("/history")}>
            View History
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/")}>
            New Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="top-nav">
        <h1>{game.name}</h1>
        <Link to="/history">History</Link>
      </div>

      {currentPlayer && (
        <div className="card current-player">
          <div className="muted">Now scoring</div>
          <div className="name">{currentPlayer.name}</div>
          <div className="total">Total: {totals.get(currentPlayer.id) ?? 0}</div>
          <div className="row">
            <input
              type="number"
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitScore();
              }}
              placeholder="Score (can be negative)"
              autoFocus
            />
            <button className="btn btn-small" onClick={submitScore} disabled={busy}>
              Add
            </button>
            <button className="btn btn-secondary btn-small" onClick={skipTurn} disabled={busy}>
              Skip
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Players</h2>
        {players.length === 0 ? (
          <div className="empty-state">No players left</div>
        ) : (
          <div className="stack">
            {players.map((p, index) => (
              <div
                className={`player-row${draggingIndex === index ? " dragging" : ""}`}
                key={p.id}
                ref={setRowRef(index)}
              >
                <div className="player-row-left">
                  <div
                    className="drag-handle"
                    onPointerDown={handlePointerDown(index)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handleDragEnd}
                    aria-label="Drag to reorder"
                  >
                    <DragHandleIcon />
                  </div>
                  <div>
                    <div className="name">
                      {p.name}
                      {p.id === game.current_player_id ? " •" : ""}
                    </div>
                    <div className="meta">{counts.get(p.id) ?? 0} turns</div>
                  </div>
                </div>
                <div className="row">
                  <div style={{ textAlign: "right" }}>
                    <div className="score-tag">{totals.get(p.id) ?? 0}</div>
                    {(recentByPlayer.get(p.id)?.length ?? 0) > 0 && (
                      <div className="recent-player-scores">
                        {recentByPlayer
                          .get(p.id)!
                          .map((s) => s.value)
                          .join(" ")}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-danger btn-icon"
                    onClick={() => removePlayer(p.id)}
                    disabled={busy}
                    aria-label="Remove player"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="card" style={{ color: "var(--danger)" }}>{error}</div>}

      <button className="btn" onClick={endGame} disabled={busy || players.length === 0}>
        End Game
      </button>
    </div>
  );
}
