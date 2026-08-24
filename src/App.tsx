import { BrowserRouter, Routes, Route } from "react-router-dom";
import SetupPage from "./pages/SetupPage";
import GamePage from "./pages/GamePage";
import HistoryPage from "./pages/HistoryPage";
import HistoryDetailPage from "./pages/HistoryDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SetupPage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:gameId" element={<HistoryDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
