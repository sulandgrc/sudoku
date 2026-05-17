/**
 * app.js — application entry point.
 *
 * Wires together the sudoku engine (sudoku.js) and the UI layer (ui.js).
 * All user-initiated actions flow through here.
 */

import {
  generatePuzzle,
  isBoardComplete,
  isBoardCorrect,
} from './sudoku.js';

import {
  init,
  renderBoard,
  updateCell,
  highlightRelated,
  applyCheckResults,
  startTimer,
  stopTimer,
  resetTimer,
  setStatus,
  getSelected,
  clearSelection,
} from './ui.js';

// ── Game state ────────────────────────────────────────────────────────────────

let puzzle   = [];   // 81-element array, 0 = empty
let solution = [];   // fully solved grid
let userGrid = [];   // user's entries, null = empty
let given    = [];   // boolean[81] — true if cell is pre-filled

// ── Initialise UI ─────────────────────────────────────────────────────────────

init({
  onCellSelect: (index) => {
    highlightRelated(index);
    setStatus('');
  },
  onNumberEnter: (n) => {
    enterNumber(n);
  },
});

// ── Game actions ──────────────────────────────────────────────────────────────

/**
 * Starts a new game at the selected difficulty.
 * Called by the "New Game" button in the HTML.
 */
export function newGame() {
  setStatus('Generating puzzle…');

  // Defer to allow the status message to paint before the CPU-heavy generation
  setTimeout(() => {
    const difficulty = document.getElementById('difficulty').value;
    const result = generatePuzzle(difficulty);

    puzzle   = result.puzzle;
    solution = result.solution;
    userGrid = Array(81).fill(null);
    given    = puzzle.map(v => v !== 0);

    clearSelection();
    resetTimer();
    startTimer();
    renderBoard(puzzle, userGrid, given);
    setStatus('');
  }, 10);
}

/**
 * Enters a number into the selected cell.
 * n = 0 means erase.
 *
 * @param {number} n
 */
function enterNumber(n) {
  const selected = getSelected();
  if (selected === null) return;
  if (given[selected]) return;

  userGrid[selected] = n === 0 ? null : n;
  updateCell(selected, puzzle, userGrid, given);
  setStatus('');

  if (isBoardComplete(given, userGrid)) {
    if (isBoardCorrect(puzzle, userGrid, solution)) {
      stopTimer();
      setStatus('🎉 Puzzle solved!');
    } else {
      setStatus('❌ Some cells are incorrect.');
    }
  }
}

/**
 * Checks all user entries and highlights errors and correct cells.
 * Called by the "Check" button in the HTML.
 */
export function checkBoard() {
  let hasError = false;

  const results = Array.from({ length: 81 }, (_, i) => {
    if (given[i] || !userGrid[i]) return { index: i, state: 'none' };
    const correct = userGrid[i] === solution[i];
    if (!correct) hasError = true;
    return { index: i, state: correct ? 'correct' : 'error' };
  });

  applyCheckResults(results);
  setStatus(hasError ? '❌ Some cells are incorrect.' : '✅ Looking good so far!');
}

/**
 * Fills in the full solution.
 * Called by the "Solve" button in the HTML.
 */
export function solvePuzzle() {
  for (let i = 0; i < 81; i++) {
    if (!given[i]) userGrid[i] = solution[i];
  }
  stopTimer();
  renderBoard(puzzle, userGrid, given);
  setStatus('Puzzle solved for you.');
}

// ── Auto-start ────────────────────────────────────────────────────────────────

newGame();
