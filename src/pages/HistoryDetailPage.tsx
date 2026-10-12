import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { store } from "../lib/store";
import type { Game, Player, Score } from "../lib/types";

export default function HistoryDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    Promise.all([
      store.getGame(gameId),
      store.listPlayers(gameId),
      store.listScores(gameId),
    ]).then(([g, p, s]) => {
      setGame(g);
      setPlayers(p);
      setScores(s);
      setLoading(false);
    });
  }, [gameId]);

  if (loading) return <div className="empty-state">Loading…</div>;
  if (!game) return <div className="empty-state">Game not found.</div>;

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
  const ranked = [...players].sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0));
  const topScores = [...scores]
    .sort((a, b) => b.value - a.value || a.created_at.localeCompare(b.created_at))
    .slice(0, 3);

  async function deleteGame() {
    if (!window.confirm(`Delete "${game!.name}"? This can't be undone.`)) return;
    setDeleting(true);
    await store.deleteGame(game!.id);
    navigate("/history");
  }

  return (
    <div>
      <div className="top-nav">
        <h1>{game.name}</h1>
        <Link to="/history">Back</Link>
      </div>

      <div className="muted" style={{ marginBottom: "1rem" }}>
        {game.ended_at ? new Date(game.ended_at).toLocaleString() : ""}
      </div>

      <div className="card winner-banner">
        <div className="trophy">🏆</div>
        <div className="name">{game.winner_name}</div>
        <div className="muted">{game.winner_score} points</div>
      </div>

      <div className="card">
        <h2>Final Scores</h2>
        <div className="stack">
          {ranked.map((p) => (
            <div className="player-row" key={p.id}>
              <div>
                <div className="name">{p.name}</div>
                <div className="meta">{counts.get(p.id) ?? 0} turns</div>
              </div>
              <span className="score-tag">{totals.get(p.id) ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {topScores.length > 0 && (
        <div className="card">
          <h2>Top Scores</h2>
          <div className="stack">
            {topScores.map((s) => (
              <div className="player-row" key={s.id}>
                <span className="name">
                  {players.find((p) => p.id === s.player_id)?.name ?? "Unknown"}
                </span>
                <span className="score-tag">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-danger" onClick={deleteGame} disabled={deleting}>
        Delete Game
      </button>
    </div>
  );
}
