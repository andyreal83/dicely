import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { store } from "../lib/store";
import type { Game } from "../lib/types";

export default function HistoryPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store.listFinishedGames().then((games) => {
      setGames(games);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="top-nav">
        <h1>History</h1>
        <Link to="/">New Game</Link>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : games.length === 0 ? (
        <div className="empty-state">No finished games yet</div>
      ) : (
        <div className="stack">
          {games.map((g) => (
            <Link key={g.id} to={`/history/${g.id}`} style={{ textDecoration: "none" }}>
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="row-between">
                  <strong>{g.name}</strong>
                  <span className="muted">
                    {g.ended_at ? new Date(g.ended_at).toLocaleDateString() : ""}
                  </span>
                </div>
                <div className="muted">🏆 {g.winner_name} ({g.winner_score})</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
