import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { store, usingSupabase } from "../lib/store";
import { uuid } from "../lib/uuid";
import { useDragReorder } from "../lib/useDragReorder";
import { DragHandleIcon } from "../components/DragHandle";

interface DraftPlayer {
  key: string;
  name: string;
}

export default function SetupPage() {
  const navigate = useNavigate();
  const [gameName, setGameName] = useState("");
  const [players, setPlayers] = useState<DraftPlayer[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addPlayer() {
    const name = playerName.trim();
    if (!name) return;
    setPlayers((prev) => [...prev, { key: uuid(), name }]);
    setPlayerName("");
  }

  function removePlayer(key: string) {
    setPlayers((prev) => prev.filter((p) => p.key !== key));
  }

  const { setRowRef, draggingIndex, handlePointerDown, handlePointerMove, handlePointerUp } =
    useDragReorder(players, setPlayers);

  async function startGame() {
    if (!gameName.trim() || players.length < 1) return;
    setStarting(true);
    setError(null);
    try {
      const game = await store.createGame({
        name: gameName.trim(),
        status: "active",
        started_at: new Date().toISOString(),
      });

      const playerRows = players.map((p, index) => ({
        game_id: game.id,
        name: p.name,
        position: index,
      }));
      const insertedPlayers = await store.insertPlayers(playerRows);

      const first = [...insertedPlayers].sort((a, b) => a.position - b.position)[0];
      await store.updateGame(game.id, { current_player_id: first.id });

      navigate(`/game/${game.id}`);
    } catch (err) {
      console.error(err);
      setError("Couldn't start the game. Check your Supabase setup and try again.");
      setStarting(false);
    }
  }

  const canStart = gameName.trim().length > 0 && players.length >= 1 && !starting;

  return (
    <div>
      <div className="top-nav">
        <h1>New Game</h1>
        <Link to="/history">History</Link>
      </div>

      {!usingSupabase && (
        <div className="muted" style={{ marginBottom: "1rem" }}>
          Saving to this device only — add Supabase keys to sync across devices.
        </div>
      )}

      <div className="card stack">
        <label>
          <div className="muted">Game name</div>
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="e.g. Catan, Poker Night"
          />
        </label>
      </div>

      <div className="card">
        <h2>Players</h2>
        <div className="row" style={{ marginBottom: "0.75rem" }}>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addPlayer();
            }}
            placeholder="Player name"
          />
          <button className="btn btn-secondary btn-small" onClick={addPlayer}>
            Add
          </button>
        </div>

        {players.length === 0 ? (
          <div className="empty-state">Add at least one player</div>
        ) : (
          <div className="stack">
            {players.map((p, index) => (
              <div
                className={`player-row${draggingIndex === index ? " dragging" : ""}`}
                key={p.key}
                ref={setRowRef(index)}
              >
                <div className="player-row-left">
                  <div
                    className="drag-handle"
                    onPointerDown={handlePointerDown(index)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    aria-label="Drag to reorder"
                  >
                    <DragHandleIcon />
                  </div>
                  <span className="name">{p.name}</span>
                </div>
                <button
                  className="btn btn-danger btn-icon"
                  onClick={() => removePlayer(p.key)}
                  aria-label="Remove player"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="card" style={{ color: "var(--danger)" }}>{error}</div>}

      <button className="btn" onClick={startGame} disabled={!canStart}>
        {starting ? "Starting…" : "Start Game"}
      </button>
    </div>
  );
}
