/**
 * sudoku.js — puzzle generation, solving, and validation
 *
 * All functions are pure (no DOM access). They operate on flat 81-element
 * arrays where index = row * 9 + col, and 0 represents an empty cell.
 */

/** Returns a blank 81-element grid filled with zeros. */
export function emptyGrid() {
  return Array(81).fill(0);
}

/** Converts (row, col) to a flat array index. */
export function idx(row, col) {
  return row * 9 + col;
}

/**
 * Returns true if placing `num` at `pos` in `grid` is valid
 * (no conflict in the same row, column, or 3×3 box).
 */
export function isValid(grid, pos, num) {
  const r = Math.floor(pos / 9);
  const c = pos % 9;

  for (let i = 0; i < 9; i++) {
    if (grid[idx(r, i)] === num) return false;
    if (grid[idx(i, c)] === num) return false;
  }

  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      if (grid[idx(br + dr, bc + dc)] === num) return false;
    }
  }

  return true;
}

/** Fisher-Yates shuffle — mutates and returns the array. */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Fills `grid` in-place using backtracking with randomised number order.
 * Returns true when the grid is fully solved.
 */
export function solve(grid) {
  const empty = grid.indexOf(0);
  if (empty === -1) return true;

  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const n of nums) {
    if (isValid(grid, empty, n)) {
      grid[empty] = n;
      if (solve(grid)) return true;
      grid[empty] = 0;
    }
  }
  return false;
}

/**
 * Counts the number of solutions for `grid`, stopping early once `count`
 * exceeds 1. Used to verify puzzle uniqueness.
 */
export function countSolutions(grid, count = 0) {
  if (count > 1) return count;
  const empty = grid.indexOf(0);
  if (empty === -1) return count + 1;

  for (let n = 1; n <= 9; n++) {
    if (isValid(grid, empty, n)) {
      grid[empty] = n;
      count = countSolutions(grid, count);
      grid[empty] = 0;
      if (count > 1) return count;
    }
  }
  return count;
}

/**
 * Generates a Sudoku puzzle with a unique solution.
 *
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {{ puzzle: number[], solution: number[] }}
 */
export function generatePuzzle(difficulty) {
  const removals = { easy: 36, medium: 46, hard: 54 };

  const full = emptyGrid();
  solve(full);
  const solution = [...full];

  const positions = shuffle([...Array(81).keys()]);
  let removed = 0;

  for (const pos of positions) {
    if (removed >= removals[difficulty]) break;
    const backup = full[pos];
    full[pos] = 0;
    if (countSolutions([...full]) === 1) {
      removed++;
    } else {
      full[pos] = backup;
    }
  }

  return { puzzle: full, solution };
}

/**
 * Returns true if every non-given cell in `userGrid` matches `solution`.
 *
 * @param {number[]} puzzle   - original puzzle (0 = empty)
 * @param {number[]} userGrid - user's entries (null = empty)
 * @param {number[]} solution - correct solution
 */
export function isBoardCorrect(puzzle, userGrid, solution) {
  for (let i = 0; i < 81; i++) {
    const val = puzzle[i] !== 0 ? puzzle[i] : userGrid[i];
    if (val !== solution[i]) return false;
  }
  return true;
}

/**
 * Returns true when every cell has a value (no empty user cells remain).
 *
 * @param {boolean[]} given    - which cells are pre-filled
 * @param {number[]}  userGrid - user's entries (null = empty)
 */
export function isBoardComplete(given, userGrid) {
  for (let i = 0; i < 81; i++) {
    if (!given[i] && !userGrid[i]) return false;
  }
  return true;
}
