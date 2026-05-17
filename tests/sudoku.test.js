/**
 * tests/sudoku.test.js
 * Unit tests for the pure Sudoku engine (js/sudoku.js).
 */

import {
  emptyGrid,
  idx,
  isValid,
  solve,
  countSolutions,
  generatePuzzle,
  isBoardComplete,
  isBoardCorrect,
} from '../js/sudoku.js';

// ── emptyGrid ─────────────────────────────────────────────────────────────────

describe('emptyGrid', () => {
  test('returns an array of 81 zeros', () => {
    const grid = emptyGrid();
    expect(grid).toHaveLength(81);
    expect(grid.every(v => v === 0)).toBe(true);
  });
});

// ── idx ───────────────────────────────────────────────────────────────────────

describe('idx', () => {
  test('converts (0, 0) to 0', () => expect(idx(0, 0)).toBe(0));
  test('converts (0, 8) to 8', () => expect(idx(0, 8)).toBe(8));
  test('converts (1, 0) to 9', () => expect(idx(1, 0)).toBe(9));
  test('converts (8, 8) to 80', () => expect(idx(8, 8)).toBe(80));
});

// ── isValid ───────────────────────────────────────────────────────────────────

describe('isValid', () => {
  test('returns true for a valid placement on an empty grid', () => {
    expect(isValid(emptyGrid(), 0, 5)).toBe(true);
  });

  test('returns false when the number already exists in the same row', () => {
    const grid = emptyGrid();
    grid[idx(0, 3)] = 5;
    expect(isValid(grid, idx(0, 7), 5)).toBe(false);
  });

  test('returns false when the number already exists in the same column', () => {
    const grid = emptyGrid();
    grid[idx(3, 0)] = 7;
    expect(isValid(grid, idx(7, 0), 7)).toBe(false);
  });

  test('returns false when the number already exists in the same 3×3 box', () => {
    const grid = emptyGrid();
    grid[idx(0, 0)] = 3;
    expect(isValid(grid, idx(1, 1), 3)).toBe(false);
  });

  test('returns true when the same number exists in a different row, col, and box', () => {
    const grid = emptyGrid();
    grid[idx(0, 0)] = 3;
    expect(isValid(grid, idx(4, 4), 3)).toBe(true);
  });
});

// ── solve ─────────────────────────────────────────────────────────────────────

describe('solve', () => {
  test('fills an empty grid completely', () => {
    const grid = emptyGrid();
    const result = solve(grid);
    expect(result).toBe(true);
    expect(grid.every(v => v >= 1 && v <= 9)).toBe(true);
  });

  test('produces a valid solution (no row conflicts)', () => {
    const grid = emptyGrid();
    solve(grid);
    for (let r = 0; r < 9; r++) {
      const row = grid.slice(r * 9, r * 9 + 9);
      expect(new Set(row).size).toBe(9);
    }
  });

  test('produces a valid solution (no column conflicts)', () => {
    const grid = emptyGrid();
    solve(grid);
    for (let c = 0; c < 9; c++) {
      const col = Array.from({ length: 9 }, (_, r) => grid[idx(r, c)]);
      expect(new Set(col).size).toBe(9);
    }
  });

  test('produces a valid solution (no 3×3 box conflicts)', () => {
    const grid = emptyGrid();
    solve(grid);
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const box = [];
        for (let dr = 0; dr < 3; dr++)
          for (let dc = 0; dc < 3; dc++)
            box.push(grid[idx(br * 3 + dr, bc * 3 + dc)]);
        expect(new Set(box).size).toBe(9);
      }
    }
  });
});

// ── countSolutions ────────────────────────────────────────────────────────────

describe('countSolutions', () => {
  test('returns 1 for a fully solved grid', () => {
    const grid = emptyGrid();
    solve(grid);
    expect(countSolutions([...grid])).toBe(1);
  });

  test('returns more than 1 for an empty grid (stops at 2)', () => {
    expect(countSolutions(emptyGrid())).toBeGreaterThan(1);
  });
});

// ── generatePuzzle ────────────────────────────────────────────────────────────

describe('generatePuzzle', () => {
  const difficulties = ['easy', 'medium', 'hard'];
  const expectedBlanks = { easy: 36, medium: 46, hard: 54 };

  difficulties.forEach(diff => {
    test(`generates a ${diff} puzzle with the correct number of blanks`, () => {
      const { puzzle } = generatePuzzle(diff);
      const blanks = puzzle.filter(v => v === 0).length;
      expect(blanks).toBe(expectedBlanks[diff]);
    });

    test(`${diff} puzzle has a unique solution`, () => {
      const { puzzle } = generatePuzzle(diff);
      expect(countSolutions([...puzzle])).toBe(1);
    });

    test(`${diff} solution is a fully valid grid`, () => {
      const { solution } = generatePuzzle(diff);
      expect(solution).toHaveLength(81);
      expect(solution.every(v => v >= 1 && v <= 9)).toBe(true);
    });
  });
});

// ── isBoardComplete ───────────────────────────────────────────────────────────

describe('isBoardComplete', () => {
  test('returns false when user cells are empty', () => {
    const given = Array(81).fill(false);
    const userGrid = Array(81).fill(null);
    expect(isBoardComplete(given, userGrid)).toBe(false);
  });

  test('returns true when all cells are filled', () => {
    const given = Array(81).fill(false);
    const userGrid = Array(81).fill(5);
    expect(isBoardComplete(given, userGrid)).toBe(true);
  });

  test('ignores given cells when checking completeness', () => {
    const given = Array(81).fill(true);
    const userGrid = Array(81).fill(null);
    expect(isBoardComplete(given, userGrid)).toBe(true);
  });
});

// ── isBoardCorrect ────────────────────────────────────────────────────────────

describe('isBoardCorrect', () => {
  test('returns true when user entries match the solution', () => {
    const { puzzle, solution } = generatePuzzle('easy');
    const userGrid = solution.map((v, i) => puzzle[i] !== 0 ? null : v);
    expect(isBoardCorrect(puzzle, userGrid, solution)).toBe(true);
  });

  test('returns false when a user entry is wrong', () => {
    const { puzzle, solution } = generatePuzzle('easy');
    const userGrid = solution.map((v, i) => puzzle[i] !== 0 ? null : v);
    // Corrupt the first non-given cell
    const firstEditable = puzzle.findIndex(v => v === 0);
    userGrid[firstEditable] = (solution[firstEditable] % 9) + 1; // wrong value
    expect(isBoardCorrect(puzzle, userGrid, solution)).toBe(false);
  });
});
