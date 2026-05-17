/**
 * ui.js — DOM rendering, cell interaction, numpad, timer, and status bar.
 *
 * Exports a UI object that app.js uses to drive the interface.
 * No game logic lives here — it delegates decisions back via callbacks.
 */

// ── Internal state ────────────────────────────────────────────────────────────

let _selected = null;   // flat index of the currently selected cell
let _timerInterval = null;
let _seconds = 0;

// Callbacks registered by app.js
let _onCellSelect = null;   // (index) => void
let _onNumberEnter = null;  // (number) => void  — 0 means erase

// ── Initialisation ────────────────────────────────────────────────────────────

/**
 * Wires up the numpad and registers app-level callbacks.
 *
 * @param {{ onCellSelect: Function, onNumberEnter: Function }} callbacks
 */
export function init({ onCellSelect, onNumberEnter }) {
  _onCellSelect = onCellSelect;
  _onNumberEnter = onNumberEnter;
  _buildNumpad();
  _bindKeyboard();
}

// ── Board rendering ───────────────────────────────────────────────────────────

/**
 * Fully re-renders the board from scratch.
 *
 * @param {number[]}  puzzle   - 81-element array (0 = empty)
 * @param {number[]}  userGrid - user's entries (null = empty)
 * @param {boolean[]} given    - which cells are pre-filled
 */
export function renderBoard(puzzle, userGrid, given) {
  const board = document.getElementById('board');
  board.innerHTML = '';

  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;

    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.dataset.row = r;
    cell.dataset.col = c;

    if (given[i]) cell.classList.add('given');
    cell.textContent = puzzle[i] !== 0 ? puzzle[i] : (userGrid[i] || '');

    cell.addEventListener('click', () => {
      _selected = i;
      _onCellSelect(i);
    });

    board.appendChild(cell);
  }
}

/**
 * Updates a single cell's appearance without re-rendering the whole board.
 *
 * @param {number}    index
 * @param {number[]}  puzzle
 * @param {number[]}  userGrid
 * @param {boolean[]} given
 */
export function updateCell(index, puzzle, userGrid, given) {
  const cell = document.querySelector(`.cell[data-index="${index}"]`);
  if (!cell) return;

  const r = Math.floor(index / 9);
  const c = index % 9;
  cell.className = 'cell';
  cell.dataset.row = r;
  cell.dataset.col = c;
  if (given[index]) cell.classList.add('given');
  if (_selected === index) cell.classList.add('selected');
  cell.textContent = puzzle[index] !== 0 ? puzzle[index] : (userGrid[index] || '');
}

/**
 * Highlights the selected cell and dims related cells (same row, col, box).
 * Clears any error/correct state from a previous check.
 *
 * @param {number} index - the newly selected cell
 */
export function highlightRelated(index) {
  _selected = index;

  const r = Math.floor(index / 9);
  const c = index % 9;
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;

  document.querySelectorAll('.cell').forEach(cell => {
    const i = parseInt(cell.dataset.index);
    const cr = Math.floor(i / 9);
    const cc = i % 9;
    const cbr = Math.floor(cr / 3) * 3;
    const cbc = Math.floor(cc / 3) * 3;

    cell.classList.remove('selected', 'highlighted', 'error', 'correct');

    if (i === index) {
      cell.classList.add('selected');
    } else if (cr === r || cc === c || (cbr === br && cbc === bc)) {
      cell.classList.add('highlighted');
    }
  });
}

/**
 * Applies error/correct CSS classes to cells after a Check action.
 *
 * @param {Array<{index: number, state: 'error'|'correct'|'none'}>} results
 */
export function applyCheckResults(results) {
  results.forEach(({ index, state }) => {
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (!cell) return;
    cell.classList.remove('error', 'correct');
    if (state !== 'none') cell.classList.add(state);
  });
}

// ── Numpad ────────────────────────────────────────────────────────────────────

function _buildNumpad() {
  const pad = document.getElementById('numpad');
  pad.innerHTML = '';

  for (let n = 1; n <= 9; n++) {
    const btn = document.createElement('button');
    btn.textContent = n;
    btn.addEventListener('click', () => _onNumberEnter(n));
    pad.appendChild(btn);
  }

  const erase = document.createElement('button');
  erase.textContent = '⌫ Erase';
  erase.className = 'erase';
  erase.addEventListener('click', () => _onNumberEnter(0));
  pad.appendChild(erase);
}

// ── Keyboard ──────────────────────────────────────────────────────────────────

function _bindKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '9') {
      _onNumberEnter(parseInt(e.key));
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      _onNumberEnter(0);
      return;
    }
    if (_selected !== null) {
      const moves = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 };
      if (moves[e.key] !== undefined) {
        e.preventDefault();
        const next = _selected + moves[e.key];
        if (next >= 0 && next < 81) {
          _selected = next;
          _onCellSelect(next);
        }
      }
    }
  });
}

// ── Timer ─────────────────────────────────────────────────────────────────────

export function startTimer() {
  _timerInterval = setInterval(() => {
    _seconds++;
    const m = String(Math.floor(_seconds / 60)).padStart(2, '0');
    const s = String(_seconds % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `${m}:${s}`;
  }, 1000);
}

export function stopTimer() {
  clearInterval(_timerInterval);
}

export function resetTimer() {
  stopTimer();
  _seconds = 0;
  document.getElementById('timer').textContent = '00:00';
}

// ── Status bar ────────────────────────────────────────────────────────────────

export function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the index of the currently selected cell, or null. */
export function getSelected() {
  return _selected;
}

/** Clears the current selection. */
export function clearSelection() {
  _selected = null;
}
