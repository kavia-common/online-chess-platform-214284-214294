import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import ChessBoard from './components/ChessBoard';
import MoveHistory from './components/MoveHistory';
import { getHistory, getState, postMove, restartGame } from './api/chessApi';

function boardListToMap(boardList) {
  const map = {};
  for (const item of boardList || []) {
    map[item.position] = item.piece;
  }
  return map;
}

function oppositeColor(color) {
  return color === 'white' ? 'black' : 'white';
}

// PUBLIC_INTERFACE
function App() {
  /** Main chess app container: fetches state/history and coordinates UI interactions. */
  const [state, setState] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [fromSquare, setFromSquare] = useState(null);

  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  const [error, setError] = useState(null);
  const [moveError, setMoveError] = useState(null);

  const lastMove = useMemo(() => {
    if (!history || history.length === 0) return null;
    return history[history.length - 1];
  }, [history]);

  const boardMap = useMemo(() => boardListToMap(state?.board), [state]);

  const fetchAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [st, hist] = await Promise.all([getState(), getHistory()]);
      setState(st);
      setHistory(hist?.history || []);
    } catch (e) {
      setError(e?.message || 'Failed to load game state.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const resetSelection = useCallback(() => {
    setSelectedSquare(null);
    setFromSquare(null);
  }, []);

  const onSquareClick = useCallback(
    async (square) => {
      if (loading || mutating) return;

      setMoveError(null);
      setSelectedSquare(square);

      // First click chooses "from"
      if (!fromSquare) {
        setFromSquare(square);
        return;
      }

      // Clicking the same square toggles off
      if (fromSquare === square) {
        resetSelection();
        return;
      }

      // Second click chooses "to" and submits
      const move = { from: fromSquare, to: square };

      setMutating(true);
      try {
        await postMove(move);
        resetSelection();
        // After a successful move, refresh state + history
        const [st, hist] = await Promise.all([getState(), getHistory()]);
        setState(st);
        setHistory(hist?.history || []);
      } catch (e) {
        // Keep fromSquare so user can choose another destination quickly
        setMoveError(e?.message || 'Illegal move.');
      } finally {
        setMutating(false);
      }
    },
    [fromSquare, loading, mutating, resetSelection]
  );

  const onRestart = useCallback(async () => {
    if (loading || mutating) return;

    setError(null);
    setMoveError(null);
    setMutating(true);
    try {
      await restartGame();
      resetSelection();
      // Re-fetch to ensure UI matches backend
      const [st, hist] = await Promise.all([getState(), getHistory()]);
      setState(st);
      setHistory(hist?.history || []);
    } catch (e) {
      setError(e?.message || 'Failed to restart game.');
    } finally {
      setMutating(false);
    }
  }, [loading, mutating, resetSelection]);

  const currentTurn = state?.current_turn || 'white';

  const turnLabel = useMemo(() => {
    if (!state) return '';
    return currentTurn === 'white' ? 'White to move' : 'Black to move';
  }, [state, currentTurn]);

  const statusPillClass = currentTurn === 'white' ? 'pill pillWhite' : 'pill pillBlack';

  return (
    <div className="App">
      <div className="page">
        <header className="header">
          <div className="brand">
            <div className="brandMark" aria-hidden="true">
              ♞
            </div>
            <div className="brandText">
              <h1 className="title">Retro Chess</h1>
              <p className="subtitle">Play local two-player chess (MVP rules).</p>
            </div>
          </div>

          <div className="headerRight">
            <div className="status">
              <span className="label">Turn</span>
              <span className={statusPillClass} aria-live="polite">
                {state ? turnLabel : '—'}
              </span>
            </div>

            <button type="button" className="btn" onClick={onRestart} disabled={loading || mutating}>
              Restart Game
            </button>
          </div>
        </header>

        <main className="layout">
          <section className="boardSection">
            <div className="panel">
              <div className="panelHeader">
                <h2 className="panelTitle">Board</h2>
                <div className="panelMeta">
                  <span className="hint">
                    Click a piece square, then click a destination.
                    {fromSquare ? ` From: ${fromSquare.toUpperCase()}` : ''}
                  </span>
                </div>
              </div>

              <div className="panelBody">
                {loading ? (
                  <div className="centerMessage">Loading game…</div>
                ) : error ? (
                  <div className="errorBox" role="alert">
                    <div className="errorTitle">Couldn’t load the game</div>
                    <div className="errorText">{error}</div>
                    <button type="button" className="btn btnSmall" onClick={fetchAll} disabled={mutating}>
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <ChessBoard
                      boardMap={boardMap}
                      selectedSquare={selectedSquare}
                      fromSquare={fromSquare}
                      lastMove={lastMove}
                      onSquareClick={onSquareClick}
                      disabled={mutating}
                    />
                    <div className="belowBoard">
                      <div className="miniStatus">
                        <span className="miniLabel">You selected</span>
                        <span className="miniValue">{fromSquare ? fromSquare.toUpperCase() : '—'}</span>
                      </div>

                      <div className="miniStatus">
                        <span className="miniLabel">Next</span>
                        <span className="miniValue">{(state && oppositeColor(currentTurn).toUpperCase()) || '—'}</span>
                      </div>

                      {mutating ? <span className="muted">Submitting…</span> : null}
                    </div>

                    {moveError ? (
                      <div className="errorInline" role="alert">
                        {moveError}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </section>

          <aside className="sideSection">
            <div className="panel">
              <div className="panelHeader">
                <h2 className="panelTitle">Move History</h2>
                <div className="panelMeta">
                  <span className="hint">{history?.length || 0} moves</span>
                </div>
              </div>
              <div className="panelBody">
                {loading ? <div className="muted">Loading…</div> : <MoveHistory history={history} />}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default App;
