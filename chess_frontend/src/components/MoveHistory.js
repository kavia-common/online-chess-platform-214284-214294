import React from 'react';

function formatMove(item) {
  const mover = item.color === 'white' ? 'W' : 'B';
  const capture = item.capture ? 'x' : '-';
  const promo = item.promotion ? `=${item.promotion.toUpperCase()}` : '';
  const pieceLetter = (() => {
    switch (item.piece?.type) {
      case 'king':
        return 'K';
      case 'queen':
        return 'Q';
      case 'rook':
        return 'R';
      case 'bishop':
        return 'B';
      case 'knight':
        return 'N';
      case 'pawn':
      default:
        return 'P';
    }
  })();

  return `${item.moveNumber}. ${mover} ${pieceLetter} ${item.from}${capture}${item.to}${promo}`;
}

// PUBLIC_INTERFACE
export default function MoveHistory({ history }) {
  /** Renders move history returned by the backend. */
  if (!history || history.length === 0) {
    return <div className="panelBody muted">No moves yet.</div>;
  }

  return (
    <ol className="historyList">
      {history.map((item, idx) => (
        <li key={`${item.moveNumber}-${item.color}-${item.from}-${item.to}-${idx}`} className="historyItem">
          <span className="historyText">{formatMove(item)}</span>
        </li>
      ))}
    </ol>
  );
}
