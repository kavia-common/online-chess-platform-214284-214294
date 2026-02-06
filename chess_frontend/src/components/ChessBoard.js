import React from 'react';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const PIECE_TO_UNICODE = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

// PUBLIC_INTERFACE
export default function ChessBoard({
  boardMap,
  selectedSquare,
  fromSquare,
  lastMove,
  onSquareClick,
  disabled,
}) {
  /** Renders an interactive 8x8 chessboard with pieces. */
  const rows = [];
  for (let rank = 8; rank >= 1; rank -= 1) {
    for (let fileIndex = 0; fileIndex < 8; fileIndex += 1) {
      const file = FILES[fileIndex];
      const square = `${file}${rank}`;
      const piece = boardMap?.[square] || null;

      const isLightSquare = (fileIndex + rank) % 2 === 0;
      const isSelected = selectedSquare === square;
      const isFrom = fromSquare === square;

      const isLastFrom = lastMove?.from === square;
      const isLastTo = lastMove?.to === square;

      rows.push(
        <button
          key={square}
          type="button"
          className={[
            'square',
            isLightSquare ? 'light' : 'dark',
            isSelected ? 'selected' : '',
            isFrom ? 'from' : '',
            isLastFrom ? 'last-from' : '',
            isLastTo ? 'last-to' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSquareClick(square)}
          disabled={disabled}
          aria-label={`${square}${piece ? ` ${piece.color} ${piece.type}` : ''}`}
        >
          <span className="piece" aria-hidden="true">
            {piece ? PIECE_TO_UNICODE[piece.color][piece.type] : ''}
          </span>
        </button>
      );
    }
  }

  return (
    <div className="boardWrap">
      <div className="board" role="grid" aria-label="Chess board">
        {rows}
      </div>
      <div className="boardLegend" aria-hidden="true">
        <div className="files">
          {FILES.map((f) => (
            <span key={f} className="legendItem">
              {f}
            </span>
          ))}
        </div>
        <div className="ranks">
          {[8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
            <span key={r} className="legendItem">
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
