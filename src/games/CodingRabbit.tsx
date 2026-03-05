import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Direction = 'up' | 'right' | 'down' | 'left';
type CmdType = 'forward' | 'left' | 'right' | 'loop';

interface Cmd {
  id: string;
  type: CmdType;
  loopCount?: number;
  inner?: Cmd[];
}

interface Cell {
  tree?: boolean;
  carrot?: boolean;
  ground: boolean;
}

interface LevelDef {
  id: number;
  name: string;
  grid: Cell[][];
  rabbitStart: { row: number; col: number; dir: Direction };
  maxCmds: number;
  availableCmds: CmdType[];
  hint?: string;
  solutionCmds?: CmdType[];
}

// ─────────────────────────────────────────────
// Level Definitions
// ─────────────────────────────────────────────
function makeCell(ground = true, carrot = false, tree = false): Cell {
  return { ground, carrot, tree };
}
const G = makeCell(true);
const C = makeCell(true, true);
const T = makeCell(true, false, true);
const V = makeCell(false);

const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: '第一步',
    grid: [
      [G, G, G, G, G],
      [G, G, G, G, G],
      [G, G, V, G, G],
      [G, G, C, G, G],
      [G, G, G, G, G],
    ],
    rabbitStart: { row: 4, col: 2, dir: 'up' },
    maxCmds: 3,
    availableCmds: ['forward'],
    hint: '让小兔子向前走，采集胡萝卜！',
    solutionCmds: ['forward'],
  },
  {
    id: 2,
    name: '直行',
    grid: [
      [G, G, G, G, G],
      [G, G, C, G, G],
      [G, G, G, G, G],
      [G, G, C, G, G],
      [G, G, G, G, G],
    ],
    rabbitStart: { row: 4, col: 2, dir: 'up' },
    maxCmds: 5,
    availableCmds: ['forward'],
    hint: '连续前进，收集两根胡萝卜！',
  },
  {
    id: 3,
    name: '长途旅行',
    grid: [
      [G, G, C, G, G],
      [G, G, G, G, G],
      [G, G, G, G, G],
      [G, G, G, G, G],
      [G, G, G, G, G],
    ],
    rabbitStart: { row: 4, col: 2, dir: 'up' },
    maxCmds: 5,
    availableCmds: ['forward'],
    hint: '胡萝卜在远处，需要走很多步！',
  },
  {
    id: 4,
    name: '转弯',
    grid: [
      [G, G, G, G, G],
      [G, G, G, G, G],
      [G, G, G, G, C],
      [G, G, G, G, G],
      [G, G, G, G, G],
    ],
    rabbitStart: { row: 2, col: 0, dir: 'right' },
    maxCmds: 5,
    availableCmds: ['forward', 'right'],
    hint: '向右走向目标！',
  },
  {
    id: 5,
    name: '转个弯',
    grid: [
      [G, G, G, G, G],
      [G, G, C, G, G],
      [G, G, G, G, G],
      [G, G, G, G, G],
      [G, G, G, G, G],
    ],
    rabbitStart: { row: 4, col: 0, dir: 'right' },
    maxCmds: 6,
    availableCmds: ['forward', 'left', 'right'],
    hint: '需要转弯才能到达胡萝卜！',
  },
  {
    id: 6,
    name: '绕树而行',
    grid: [
      [G, G, G, G, G],
      [G, G, G, G, G],
      [G, T, T, T, G],
      [G, G, G, G, C],
      [G, G, G, G, G],
    ],
    rabbitStart: { row: 4, col: 0, dir: 'up' },
    maxCmds: 10,
    availableCmds: ['forward', 'left', 'right'],
    hint: '绕过树木，到达右边采集胡萝卜！',
    solutionCmds: ['forward', 'forward', 'right', 'forward', 'forward', 'forward', 'forward', 'forward'],
  },
  {
    id: 7,
    name: '两根胡萝卜',
    grid: [
      [G, G, G, G, G],
      [G, C, G, C, G],
      [G, G, G, G, G],
      [G, G, G, G, G],
      [G, G, G, G, G],
    ],
    rabbitStart: { row: 3, col: 2, dir: 'up' },
    maxCmds: 8,
    availableCmds: ['forward', 'left', 'right'],
    hint: '收集两根胡萝卜！',
  },
  {
    id: 8,
    name: '迷宫',
    grid: [
      [G, G, G, G, C],
      [G, T, T, T, G],
      [G, G, G, T, G],
      [G, T, G, T, G],
      [G, G, G, G, G],
    ],
    rabbitStart: { row: 4, col: 0, dir: 'up' },
    maxCmds: 12,
    availableCmds: ['forward', 'left', 'right'],
    hint: '穿越迷宫找到胡萝卜！',
  },
  {
    id: 9,
    name: '循环入门',
    grid: [
      [G, G, G, G, G],
      [G, G, G, G, G],
      [G, G, G, G, G],
      [G, G, G, G, G],
      [C, C, C, C, C],
    ],
    rabbitStart: { row: 4, col: 0, dir: 'right' },
    maxCmds: 6,
    availableCmds: ['forward', 'left', 'right', 'loop'],
    hint: '使用循环来高效收集胡萝卜！',
  },
  {
    id: 10,
    name: '终极挑战',
    grid: [
      [C, G, C, G, C],
      [G, G, G, G, G],
      [G, T, G, T, G],
      [G, G, G, G, G],
      [G, G, G, G, G],
    ],
    rabbitStart: { row: 4, col: 0, dir: 'up' },
    maxCmds: 15,
    availableCmds: ['forward', 'left', 'right', 'loop'],
    hint: '综合运用所有指令，收集所有胡萝卜！',
  },
];

// Generate 20 more random levels
for (let id = 11; id <= 30; id++) {
  // 5x5 Grid
  const grid = Array(5).fill(0).map(() => Array(5).fill(G));

  // Random number of trees and carrots
  const numTrees = Math.floor(Math.random() * 4) + 1; // 1 to 4 trees
  const numCarrots = Math.floor(Math.random() * 3) + 2; // 2 to 4 carrots

  // Place trees randomly (not on bottom row where rabbit usually starts)
  for (let i = 0; i < numTrees; i++) {
    const r = Math.floor(Math.random() * 4); // row 0-3
    const c = Math.floor(Math.random() * 5);
    grid[r][c] = T;
  }

  // Place carrots randomly
  for (let i = 0; i < numCarrots; i++) {
    const r = Math.floor(Math.random() * 4); // row 0-3
    const c = Math.floor(Math.random() * 5);
    // Don't overwrite trees
    if (!grid[r][c].tree) {
      grid[r][c] = C;
    }
  }

  LEVELS.push({
    id,
    name: `随机挑战 ${id}`,
    grid,
    rabbitStart: { row: 4, col: Math.floor(Math.random() * 5), dir: 'up' },
    maxCmds: 15,
    availableCmds: ['forward', 'left', 'right', 'loop'],
    hint: '这是由程序生成的进阶挑战关卡！',
  });
}

function generateEndlessLevel(id: number): LevelDef {
  // larger 8x8 grid for endless mode
  const grid = Array(8).fill(0).map(() => Array(8).fill(G));
  const numTrees = Math.floor(Math.random() * 10) + 5;
  const numCarrots = Math.floor(Math.random() * 6) + 3;

  const startR = Math.floor(Math.random() * 2) + 6; // start in bottom 2 rows
  const startC = Math.floor(Math.random() * 8); // anywhere on cols
  const directions: Direction[] = ['up', 'left', 'right'];

  // place trees
  for (let i = 0; i < numTrees; i++) {
    const r = Math.floor(Math.random() * 7);
    const c = Math.floor(Math.random() * 8);
    if (!(r === startR && c === startC)) grid[r][c] = T;
  }

  // place carrots
  for (let i = 0; i < numCarrots; i++) {
    const r = Math.floor(Math.random() * 7);
    const c = Math.floor(Math.random() * 8);
    if (!grid[r][c].tree && !(r === startR && c === startC)) {
      grid[r][c] = C;
    }
  }

  return {
    id,
    name: `无尽模式 ${id}`,
    grid,
    rabbitStart: { row: startR, col: startC, dir: directions[Math.floor(Math.random() * 3)] },
    maxCmds: 20, // More commands for larger map
    availableCmds: ['forward', 'left', 'right', 'loop'],
    hint: '超级难度的无尽挑战！',
  };
}

// ─────────────────────────────────────────────
// Direction helpers
// ─────────────────────────────────────────────
const DIR_ANGLES: Record<Direction, number> = { up: 0, right: 90, down: 180, left: 270 };
const TURN_LEFT: Record<Direction, Direction> = { up: 'left', left: 'down', down: 'right', right: 'up' };
const TURN_RIGHT: Record<Direction, Direction> = { up: 'right', right: 'down', down: 'left', left: 'up' };
const MOVE_DELTA: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

let cmdIdCounter = 0;
function newId() { return `cmd-${++cmdIdCounter}`; }
function mkCmd(type: CmdType): Cmd {
  if (type === 'loop') return { id: newId(), type: 'loop', loopCount: 3, inner: [] };
  return { id: newId(), type };
}

// ─────────────────────────────────────────────
// Execution engine
// ─────────────────────────────────────────────
interface ExecState {
  row: number;
  col: number;
  dir: Direction;
  grid: Cell[][];
  collected: number;
  total: number;
}

function flattenCmds(cmds: Cmd[]): string[] {
  const steps: string[] = [];
  for (const cmd of cmds) {
    if (cmd.type === 'loop') {
      const count = cmd.loopCount ?? 2;
      for (let i = 0; i < count; i++) {
        steps.push(...flattenCmds(cmd.inner ?? []));
      }
    } else {
      steps.push(cmd.type);
    }
  }
  return steps;
}

function applyStep(
  step: string,
  s: ExecState,
): ExecState {
  const ns = { ...s, grid: s.grid.map(r => r.map(c => ({ ...c }))) };
  if (step === 'forward') {
    const d = MOVE_DELTA[ns.dir];
    const nr = ns.row + d.dr;
    const nc = ns.col + d.dc;
    const rows = ns.grid.length;
    const cols = ns.grid[0].length;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && ns.grid[nr][nc].ground && !ns.grid[nr][nc].tree) {
      ns.row = nr;
      ns.col = nc;
      if (ns.grid[nr][nc].carrot) {
        ns.grid[nr][nc] = { ...ns.grid[nr][nc], carrot: false };
        ns.collected += 1;
      }
    }
  } else if (step === 'left') {
    ns.dir = TURN_LEFT[ns.dir];
  } else if (step === 'right') {
    ns.dir = TURN_RIGHT[ns.dir];
  }
  return ns;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
const CMD_LABELS: Record<CmdType, string> = {
  forward: '前进',
  left: '左转',
  right: '右转',
  loop: '循环',
};

const CMD_ICONS: Record<CmdType, string> = {
  forward: '⬆️',
  left: '↺',
  right: '↻',
  loop: '🔁',
};

const CMD_COLORS: Record<CmdType, string> = {
  forward: 'text-emerald-500 border-emerald-500 hover:bg-emerald-50',
  left: 'text-blue-500 border-blue-500 hover:bg-blue-50',
  right: 'text-red-500 border-red-500 hover:bg-red-50',
  loop: 'text-amber-500 border-amber-500 hover:bg-amber-50',
};

function CommandCard({ cmd, onClick, small, active }: {
  cmd: Cmd;
  onClick?: () => void;
  small?: boolean;
  active?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        ${small ? 'w-[4.5rem] h-14' : 'w-20 h-24'}
        bg-white border-2 rounded-2xl flex flex-col items-center justify-center gap-1
        shadow-sm select-none cursor-pointer transition-colors relative
        ${CMD_COLORS[cmd.type]}
        ${active ? 'ring-4 ring-yellow-400/50' : ''}
      `}
    >
      <span className={small ? 'text-xl' : 'text-3xl font-black'} style={{
        color: 'inherit',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {cmd.type === 'forward' ? '⬆' : cmd.type === 'left' ? '↺' : cmd.type === 'right' ? '↻' : '🔁'}
      </span>
      <span className={`${small ? 'text-[10px]' : 'text-sm'} font-bold text-slate-600`}>
        {CMD_LABELS[cmd.type]}
      </span>
    </motion.button>
  );
}

// ─────────────────────────────────────────────
// 3D Voxel Engine & Objects
// ─────────────────────────────────────────────
const CubeFace = ({ w, h, x, y, z, transform, color }: any) => (
  <div style={{
    position: 'absolute',
    left: 0, top: 0,
    width: w, height: h,
    marginLeft: -w / 2, marginTop: -h / 2,
    background: color,
    transform: `translate3d(${x}px, ${y}px, ${z}px) ${transform}`,
    backfaceVisibility: 'visible',
  }} />
);

const Cube = ({ w, d, h, x, y, z, color, top, front, right, left, back, bottom }: any) => {
  const cx = x + w / 2, cy = y + d / 2, cz = z + h / 2;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
      <CubeFace w={w} h={d} x={cx} y={cy} z={cz + h / 2} transform="" color={top || color} />
      <CubeFace w={w} h={d} x={cx} y={cy} z={cz - h / 2} transform="rotateX(180deg)" color={bottom || color} />
      <CubeFace w={w} h={h} x={cx} y={cy + d / 2} z={cz} transform="rotateX(-90deg)" color={front || color} />
      <CubeFace w={w} h={h} x={cx} y={cy - d / 2} z={cz} transform="rotateX(90deg)" color={back || color} />
      <CubeFace w={d} h={h} x={cx + w / 2} y={cy} z={cz} transform="rotateZ(90deg) rotateX(-90deg)" color={right || color} />
      <CubeFace w={d} h={h} x={cx - w / 2} y={cy} z={cz} transform="rotateZ(90deg) rotateX(90deg)" color={left || color} />
    </div>
  );
};

const Rabbit3D = ({ dir }: { dir: Direction }) => {
  return (
    <motion.div
      initial={{ z: 40, scale: 0.8 }}
      animate={{ z: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 12, stiffness: 300 }}
      className="absolute inset-0"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <motion.div
        className="absolute inset-0 block w-full h-full"
        style={{ transformStyle: 'preserve-3d', transformOrigin: '40px 40px' }}
        animate={{ rotateZ: DIR_ANGLES[dir] }}
        transition={{ duration: 0.3 }}
      >
        {/* Body */}
        <Cube x={24} y={28} z={6} w={32} d={36} h={26} color="#f8fafc" top="#ffffff" left="#e2e8f0" back="#e2e8f0" right="#cbd5e1" front="#f1f5f9" bottom="#e2e8f0" />
        {/* Head */}
        <Cube x={20} y={16} z={20} w={40} d={28} h={28} color="#ffffff" top="#ffffff" left="#e2e8f0" back="#e2e8f0" right="#e2e8f0" front="#f8fafc" bottom="#e2e8f0" />
        {/* Ears */}
        <Cube x={24} y={20} z={48} w={10} d={8} h={24} color="#f8fafc" top="#ffffff" left="#e2e8f0" back="#f472b6" right="#cbd5e1" front="#f1f5f9" />
        <Cube x={46} y={20} z={48} w={10} d={8} h={24} color="#f8fafc" top="#ffffff" left="#e2e8f0" back="#f472b6" right="#cbd5e1" front="#f1f5f9" />
        {/* Tail */}
        <Cube x={34} y={64} z={10} w={12} d={12} h={12} color="#ffffff" top="#ffffff" left="#e2e8f0" back="#e2e8f0" />
        {/* Eyes (Black) */}
        <Cube x={26} y={14} z={32} w={6} d={4} h={6} color="#0f172a" left="#0f172a" right="#0f172a" back="#0f172a" top="#0f172a" />
        <Cube x={48} y={14} z={32} w={6} d={4} h={6} color="#0f172a" left="#0f172a" right="#0f172a" back="#0f172a" top="#0f172a" />
        {/* Nose (Pink) */}
        <Cube x={37} y={14} z={24} w={6} d={4} h={4} color="#fb7185" left="#fb7185" right="#fb7185" back="#fb7185" top="#fb7185" />
        {/* Shadow */}
        <div style={{ position: 'absolute', left: 20, top: 20, width: 40, height: 44, backgroundColor: 'rgba(0,0,0,0.15)', filter: 'blur(4px)', transform: 'translateZ(1px)' }} />
      </motion.div>
    </motion.div>
  );
};

const Carrot3D = () => {
  return (
    <motion.div
      className="absolute inset-0"
      style={{ transformStyle: 'preserve-3d' }}
      initial={{ z: 0 }}
      animate={{ z: [0, 8, 0] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
    >
      {/* Top */}
      <Cube x={32} y={32} z={16} w={16} d={16} h={16} color="#f97316" top="#fdba74" left="#ea580c" back="#ea580c" right="#f97316" front="#fb923c" />
      {/* Mid */}
      <Cube x={34} y={34} z={4} w={12} d={12} h={12} color="#f97316" left="#ea580c" back="#ea580c" right="#f97316" front="#fb923c" top="#fdba74" />
      {/* Tip */}
      <Cube x={37} y={37} z={-2} w={6} d={6} h={6} color="#f97316" left="#ea580c" back="#ea580c" right="#f97316" front="#fb923c" top="#fdba74" />
      {/* Leaves */}
      <Cube x={38} y={38} z={32} w={4} d={4} h={12} color="#22c55e" left="#16a34a" back="#16a34a" right="#22c55e" front="#4ade80" top="#86efac" />
    </motion.div>
  );
};

const Barrier3D = () => {
  // 🍄 Cute mushroom obstacle - fits the garden theme!
  return (
    <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
      {/* Stalk - cream colored */}
      <Cube x={28} y={28} z={0} w={24} d={24} h={24}
        color="#fef3c7"
        top="#fefce8"
        front="#fde68a"
        back="#fde68a"
        right="#fef3c7"
        left="#fef3c7"
        bottom="#fde68a"
      />
      {/* Cap base (wide part) */}
      <Cube x={10} y={10} z={24} w={60} d={60} h={28}
        color="#ef4444"
        top="#f87171"
        front="#dc2626"
        back="#dc2626"
        right="#ef4444"
        left="#ef4444"
        bottom="#b91c1c"
      />
      {/* Cap top (narrower) */}
      <Cube x={16} y={16} z={52} w={48} d={48} h={16}
        color="#ef4444"
        top="#fca5a5"
        front="#dc2626"
        back="#dc2626"
        right="#ef4444"
        left="#ef4444"
      />
      {/* White dots on cap */}
      <Cube x={20} y={20} z={68} w={10} d={10} h={4} color="#fff" top="#fff" />
      <Cube x={50} y={20} z={68} w={10} d={10} h={4} color="#fff" top="#fff" />
      <Cube x={34} y={46} z={68} w={10} d={10} h={4} color="#fff" top="#fff" />
      {/* Shadow */}
      <div style={{ position: 'absolute', left: 10, top: 10, width: 60, height: 60, backgroundColor: 'rgba(0,0,0,0.18)', filter: 'blur(6px)', transform: 'translateZ(1px)' }} />
    </div>
  );
};

const Plant3D = () => {
  return (
    <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
      <Cube x={32} y={32} z={0} w={20} d={20} h={12} color="#15803d" top="#22c55e" left="#166534" back="#166534" right="#15803d" front="#16a34a" bottom="#14532d" />
      <Cube x={36} y={36} z={12} w={12} d={12} h={8} color="#16a34a" top="#4ade80" left="#15803d" back="#15803d" right="#16a34a" front="#22c55e" bottom="#166534" />
      <div style={{ position: 'absolute', left: 24, top: 24, width: 32, height: 32, backgroundColor: 'rgba(0,0,0,0.15)', filter: 'blur(3px)', transform: 'translateZ(1px)' }} />
    </div>
  );
};

// ─── Dog character ────────────────────────────────────────
const Dog3D = ({ dir }: { dir: Direction }) => (
  <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}
    initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 300 }}>
    <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d', transformOrigin: '40px 40px' }}
      animate={{ rotateZ: DIR_ANGLES[dir] }} transition={{ duration: 0.3 }}>
      {/* Body */}
      <Cube x={22} y={26} z={4} w={36} d={32} h={26} color="#d97706" top="#fbbf24" left="#b45309" back="#b45309" right="#d97706" front="#f59e0b" bottom="#b45309" />
      {/* Head */}
      <Cube x={19} y={14} z={18} w={42} d={30} h={30} color="#fbbf24" top="#fef3c7" left="#d97706" back="#d97706" right="#d97706" front="#fcd34d" bottom="#d97706" />
      {/* Floppy ears */}
      <Cube x={12} y={16} z={28} w={12} d={10} h={22} color="#b45309" top="#d97706" />
      <Cube x={56} y={16} z={28} w={12} d={10} h={22} color="#b45309" top="#d97706" />
      {/* Snout */}
      <Cube x={26} y={8} z={22} w={28} d={12} h={16} color="#fcd34d" top="#fef3c7" front="#fde68a" />
      {/* Nose */}
      <Cube x={34} y={6} z={32} w={12} d={6} h={8} color="#1f2937" top="#111827" />
      {/* Eyes */}
      <Cube x={28} y={12} z={36} w={6} d={4} h={6} color="#1f2937" top="#111827" />
      <Cube x={46} y={12} z={36} w={6} d={4} h={6} color="#1f2937" top="#111827" />
      {/* Tail */}
      <Cube x={32} y={58} z={14} w={16} d={12} h={20} color="#d97706" top="#fbbf24" />
    </motion.div>
  </motion.div>
);

const Bone3D = () => (
  <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}
    animate={{ z: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}>
    {/* Shaft */}
    <Cube x={26} y={36} z={8} w={28} d={12} h={8} color="#f8fafc" top="#ffffff" left="#e2e8f0" right="#e2e8f0" />
    {/* Left ends (2 balls) */}
    <Cube x={18} y={32} z={4} w={14} d={20} h={16} color="#f8fafc" top="#ffffff" />
    {/* Right ends */}
    <Cube x={48} y={32} z={4} w={14} d={20} h={16} color="#f8fafc" top="#ffffff" />
  </motion.div>
);

// ─── Cat character ────────────────────────────────────────
const Cat3D = ({ dir }: { dir: Direction }) => (
  <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}
    initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 300 }}>
    <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d', transformOrigin: '40px 40px' }}
      animate={{ rotateZ: DIR_ANGLES[dir] }} transition={{ duration: 0.3 }}>
      {/* Body - grey striped */}
      <Cube x={22} y={26} z={4} w={36} d={32} h={26} color="#9ca3af" top="#d1d5db" left="#6b7280" back="#6b7280" right="#9ca3af" front="#d1d5db" bottom="#6b7280" />
      {/* Head */}
      <Cube x={19} y={13} z={18} w={42} d={28} h={30} color="#d1d5db" top="#f3f4f6" left="#9ca3af" back="#9ca3af" right="#9ca3af" front="#e5e7eb" />
      {/* Pointy ears */}
      <Cube x={20} y={16} z={46} w={10} d={8} h={16} color="#9ca3af" top="#d1d5db" />
      <Cube x={50} y={16} z={46} w={10} d={8} h={16} color="#9ca3af" top="#d1d5db" />
      {/* Inner ears pink */}
      <Cube x={22} y={17} z={48} w={6} d={4} h={10} color="#f9a8d4" top="#fce7f3" />
      <Cube x={52} y={17} z={48} w={6} d={4} h={10} color="#f9a8d4" top="#fce7f3" />
      {/* Eyes (green cats eyes) */}
      <Cube x={28} y={12} z={36} w={8} d={4} h={8} color="#16a34a" top="#22c55e" />
      <Cube x={44} y={12} z={36} w={8} d={4} h={8} color="#16a34a" top="#22c55e" />
      {/* Nose */}
      <Cube x={36} y={8} z={28} w={8} d={4} h={6} color="#f9a8d4" top="#fce7f3" />
      {/* Tail - curved up */}
      <Cube x={58} y={36} z={4} w={8} d={8} h={24} color="#9ca3af" top="#d1d5db" />
      <Cube x={58} y={26} z={24} w={8} d={8} h={8} color="#9ca3af" top="#d1d5db" />
    </motion.div>
  </motion.div>
);

const Fish3D = () => (
  <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}
    animate={{ z: [0, 8, 0], rotateZ: [0, 10, 0, -10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}>
    {/* Fish body */}
    <Cube x={20} y={28} z={8} w={36} d={24} h={24} color="#3b82f6" top="#60a5fa" left="#1d4ed8" back="#1d4ed8" right="#3b82f6" front="#60a5fa" />
    {/* Tail fin */}
    <Cube x={8} y={24} z={8} w={16} d={32} h={24} color="#2563eb" top="#3b82f6" />
    {/* Eye */}
    <Cube x={52} y={30} z={20} w={8} d={4} h={8} color="#fef3c7" top="#fef9c3" />
    <Cube x={54} y={29} z={22} w={4} d={2} h={4} color="#1e40af" top="#1e3a8a" />
    {/* Belly */}
    <Cube x={24} y={32} z={8} w={28} d={16} h={14} color="#93c5fd" top="#bfdbfe" />
  </motion.div>
);

// ─── Ultraman character ────────────────────────────────────
const Ultraman3D = ({ dir }: { dir: Direction }) => (
  <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}
    initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 300 }}>
    <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d', transformOrigin: '40px 40px' }}
      animate={{ rotateZ: DIR_ANGLES[dir] }} transition={{ duration: 0.3 }}>
      {/* Body - silver with red */}
      <Cube x={24} y={26} z={4} w={32} d={30} h={28} color="#e2e8f0" top="#f8fafc" left="#94a3b8" back="#94a3b8" right="#cbd5e1" front="#f1f5f9" />
      {/* Red chest stripe */}
      <Cube x={30} y={24} z={8} w={20} d={4} h={20} color="#ef4444" top="#f87171" front="#dc2626" />
      {/* Head */}
      <Cube x={20} y={16} z={30} w={40} d={26} h={28} color="#e2e8f0" top="#f8fafc" left="#94a3b8" back="#94a3b8" right="#cbd5e1" front="#f1f5f9" />
      {/* Head crest (characteristic V shape) */}
      <Cube x={28} y={14} z={56} w={10} d={4} h={14} color="#ef4444" top="#f87171" />
      <Cube x={42} y={14} z={56} w={10} d={4} h={14} color="#ef4444" top="#f87171" />
      <Cube x={32} y={14} z={62} w={16} d={4} h={8} color="#ef4444" top="#f87171" />
      {/* Eyes - yellow */}
      <Cube x={26} y={14} z={40} w={10} d={4} h={8} color="#fbbf24" top="#fef3c7" />
      <Cube x={44} y={14} z={40} w={10} d={4} h={8} color="#fbbf24" top="#fef3c7" />
      {/* Color timer on chest */}
      <Cube x={34} y={22} z={24} w={12} d={4} h={8} color="#60a5fa" top="#93c5fd" front="#3b82f6" />
    </motion.div>
  </motion.div>
);

const Monster3D = () => (
  // 👾 Purple Space Invader style pixel alien
  <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}
    animate={{ z: [0, 6, 0], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
    {/* Main Body - purple */}
    <Cube x={20} y={20} z={12} w={40} d={40} h={24} color="#8b5cf6" top="#a78bfa" left="#7c3aed" back="#7c3aed" right="#8b5cf6" front="#6d28d9" bottom="#5b21b6" />

    {/* Top Head Bumps (Ears/Antennae base) */}
    <Cube x={24} y={24} z={36} w={12} d={12} h={12} color="#8b5cf6" top="#a78bfa" front="#6d28d9" left="#7c3aed" />
    <Cube x={44} y={24} z={36} w={12} d={12} h={12} color="#8b5cf6" top="#a78bfa" front="#6d28d9" right="#7c3aed" />

    {/* High Antennae Tips */}
    <Cube x={20} y={20} z={48} w={8} d={8} h={8} color="#7c3aed" top="#8b5cf6" front="#5b21b6" />
    <Cube x={52} y={20} z={48} w={8} d={8} h={8} color="#7c3aed" top="#8b5cf6" front="#5b21b6" />

    {/* Eyes - Black/Dark Void */}
    <Cube x={28} y={16} z={20} w={6} d={6} h={8} color="#111827" top="#1f2937" />
    <Cube x={46} y={16} z={20} w={6} d={6} h={8} color="#111827" top="#1f2937" />

    {/* Inner eye glint */}
    <Cube x={30} y={14} z={24} w={2} d={2} h={2} color="#ffffff" top="#ffffff" />
    <Cube x={48} y={14} z={24} w={2} d={2} h={2} color="#ffffff" top="#ffffff" />

    {/* Left Arm/Tentacle */}
    <Cube x={12} y={24} z={16} w={8} d={16} h={16} color="#7c3aed" top="#8b5cf6" left="#6d28d9" />
    <Cube x={12} y={20} z={8} w={12} d={12} h={8} color="#6d28d9" top="#7c3aed" left="#5b21b6" />

    {/* Right Arm/Tentacle */}
    <Cube x={60} y={24} z={16} w={8} d={16} h={16} color="#7c3aed" top="#8b5cf6" right="#6d28d9" />
    <Cube x={56} y={20} z={8} w={12} d={12} h={8} color="#6d28d9" top="#7c3aed" right="#5b21b6" />

    {/* Center legs/tentacles */}
    <Cube x={28} y={24} z={0} w={10} d={12} h={12} color="#6d28d9" top="#7c3aed" front="#5b21b6" />
    <Cube x={42} y={24} z={0} w={10} d={12} h={12} color="#6d28d9" top="#7c3aed" front="#5b21b6" />

    {/* Outer leg tips curling out */}
    <Cube x={24} y={20} z={0} w={8} d={8} h={8} color="#5b21b6" top="#6d28d9" />
    <Cube x={48} y={20} z={0} w={8} d={8} h={8} color="#5b21b6" top="#6d28d9" />
  </motion.div>
);

// ─── Theme definitions ─────────────────────────────────────
interface GameTheme {
  id: string;
  name: string;
  emoji: string;
  Player: React.FC<{ dir: Direction }>;
  Collectible: React.FC;
  collectibleName: string;
  collectibleEmoji: string;
}

const THEMES: GameTheme[] = [
  { id: 'rabbit', name: '小兔', emoji: '🐰', Player: Rabbit3D, Collectible: Carrot3D, collectibleName: '胡萝卜', collectibleEmoji: '🥕' },
  { id: 'dog', name: '小狗', emoji: '🐶', Player: Dog3D, Collectible: Bone3D, collectibleName: '骨头', collectibleEmoji: '🦴' },
  { id: 'cat', name: '小猫', emoji: '🐱', Player: Cat3D, Collectible: Fish3D, collectibleName: '鱼', collectibleEmoji: '🐟' },
  { id: 'ultraman', name: '英雄', emoji: '🦸', Player: Ultraman3D, Collectible: Monster3D, collectibleName: '小怪兽', collectibleEmoji: '👾' },
];



// ─────────────────────────────────────────────
// Grid rendering (3D Voxel implementation)
// ─────────────────────────────────────────────
function GameGrid({
  levelGrid,
  rabbit,
  currentStep,
  steps,
  Player,
  Collectible,
}: {
  levelGrid: Cell[][];
  rabbit: { row: number; col: number; dir: Direction };
  currentStep: number;
  steps: { row: number; col: number; dir: Direction; grid: Cell[][] }[];
  Player: React.FC<{ dir: Direction }>;
  Collectible: React.FC;
}) {
  const CELL_SIZE = 80;
  const rows = levelGrid.length;
  const cols = levelGrid[0].length;

  const [isDragging, setIsDragging] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const angles = useRef({ rx: 55, rz: 0 });
  const dragStart = useRef({ x: 0, y: 0, rx: 55, rz: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, rx: angles.current.rx, rz: angles.current.rz };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    // Correct intuitive drag direction:
    // User requested inverted Y-axis: Drag down (dy > 0) should decrease rotateX
    // Drag right (dx > 0) spins the board counter-clockwise = decrease rotateZ
    let newRx = dragStart.current.rx - dy * 0.5;
    const newRz = dragStart.current.rz - dx * 0.5;

    newRx = Math.max(20, Math.min(80, newRx));

    angles.current.rx = newRx;
    angles.current.rz = newRz;

    if (gridContainerRef.current) {
      gridContainerRef.current.style.transform = `rotateX(${newRx}deg) rotateZ(${newRz}deg)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Use intermediate step state if running
  const displayState = steps[currentStep] ?? null;
  const displayGrid = displayState ? displayState.grid : levelGrid;
  const displayRabbit = displayState ? { row: displayState.row, col: displayState.col, dir: displayState.dir } : rabbit;

  // Generate random trees for empty space. We memoize this per level.
  // Using a simple deterministic hash so it doesn't change on re-renders, but changes per level layout
  const randomDecor = React.useMemo(() => {
    const decors: { r: number; c: number }[] = [];
    levelGrid.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        // If it's empty ground, not the rabbit start, not a carrot, not a tree
        if (cell.ground && !cell.tree && !cell.carrot && !(rabbit.row === ri && rabbit.col === ci)) {
          // simple pseudo random
          const hash = Math.sin(ri * 12.9898 + ci * 78.233) * 43758.5453;
          if (hash - Math.floor(hash) > 0.85) { // 15% chance
            decors.push({ r: ri, c: ci });
          }
        }
      });
    });
    return decors;
  }, [levelGrid, rabbit.row, rabbit.col]);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none"
      style={{ perspective: '1200px', cursor: isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        ref={gridContainerRef}
        className="relative shadow-[0_40px_80px_rgba(0,0,0,0.4)]"
        style={{
          width: cols * CELL_SIZE,
          height: rows * CELL_SIZE,
          transform: `rotateX(${angles.current.rx}deg) rotateZ(${angles.current.rz}deg)`,
          transformStyle: 'preserve-3d',
          transition: isDragging ? 'none' : 'transform 0.5s ease',
        }}
      >
        {/* Base Grid Plate using 3D Cube */}
        <Cube
          x={0} y={0} z={-20}
          w={cols * CELL_SIZE} d={rows * CELL_SIZE} h={20}
          color="#65c02b"
          front="#4a961d"
          right="#3e8018"
          back="#4a961d"
          left="#3e8018"
          top="#65c02b"
          bottom="#3e8018"
        />

        {displayGrid.map((row, ri) =>
          row.map((cell, ci) => {
            const isRabbit = displayRabbit.row === ri && displayRabbit.col === ci;
            const isDecorTree = randomDecor.some(d => d.r === ri && d.c === ci);

            return (
              <div
                key={`${ri}-${ci}`}
                style={{
                  position: 'absolute',
                  left: ci * CELL_SIZE,
                  top: ri * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Tile floor */}
                {cell.ground && (
                  <div className={`absolute inset-0 border transition-colors duration-300`}
                    style={{
                      backgroundColor: cell.tree
                        ? '#fef3c7'   // warm cream background for mushroom tiles
                        : (isDecorTree ? '#5bad24' : '#6fcb34'),
                      borderColor: cell.tree ? 'rgba(180,130,0,0.4)' : 'rgba(120,219,59,0.5)',
                      boxShadow: cell.tree ? 'inset 0 0 10px rgba(254,200,0,0.3)' : 'inset 0 0 10px rgba(0,0,0,0.05)',
                      transform: 'translateZ(1px)'
                    }} />
                )}

                {/* 3D Entities */}
                {cell.tree && <Barrier3D />}
                {isDecorTree && <Plant3D />}
                {cell.carrot && !isRabbit && <Collectible />}
                {isRabbit && <Player dir={displayRabbit.dir} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Loop command in program area
// ─────────────────────────────────────────────
function LoopBlock({ cmd, onRemove, onAddInner, onRemoveInner, activeIdx, programOffset }: {
  cmd: Cmd;
  onRemove: () => void;
  onAddInner: (type: CmdType) => void;
  onRemoveInner: (idx: number) => void;
  activeIdx: number;
  programOffset: number;
}) {
  return (
    <div className="relative bg-amber-50/80 border-2 border-amber-400 border-dashed rounded-2xl p-2 w-full min-h-[5rem]">
      <div className="flex items-center gap-1 mb-2 px-1">
        <span className="text-sm font-bold text-amber-600">🔁 循环</span>
        <span className="ml-2 text-xs text-amber-800 font-bold bg-amber-200 px-2 py-0.5 rounded-full">
          {cmd.loopCount}次
        </span>
        <button
          onClick={onRemove}
          className="text-amber-400 hover:text-red-500 text-xs ml-auto font-bold bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
        >✕</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(cmd.inner ?? []).map((inner, idx) => (
          <CommandCard
            key={inner.id}
            cmd={inner}
            small
            active={activeIdx === programOffset + idx}
            onClick={() => onRemoveInner(idx)}
          />
        ))}
        {(cmd.inner ?? []).length === 0 && (
          <span className="text-xs text-amber-500/60 font-medium italic w-full text-center py-2">
            拖拽或点击指令到此处
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Level select screen
// ─────────────────────────────────────────────
function LevelSelect({ completedLevels, onSelect, onClose, endlessLevels, onGenerateEndless }: {
  completedLevels: Record<number, boolean>;
  onSelect: (id: number) => void;
  onClose: () => void;
  endlessLevels: LevelDef[];
  onGenerateEndless: () => void;
}) {
  const hasBeatenAll = completedLevels[30]; // Did they beat the last random level?

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h2 className="text-2xl font-extrabold text-slate-800">🗺️ 关卡选择</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 grid grid-cols-5 sm:grid-cols-8 gap-3 content-start">
          {LEVELS.map(lv => (
            <motion.button
              key={lv.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => { onSelect(lv.id); onClose(); }}
              className={`
                aspect-square rounded-xl font-bold text-lg flex flex-col items-center justify-center shadow
                ${completedLevels[lv.id]
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-2 border-slate-200'}
              `}
            >
              {lv.id}
              {completedLevels[lv.id] && <span className="text-xs">⭐</span>}
            </motion.button>
          ))}

          {/* Render already generated endless levels */}
          {endlessLevels.map(lv => (
            <motion.button
              key={lv.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => { onSelect(lv.id); onClose(); }}
              className={`
                aspect-square rounded-xl font-bold text-lg flex flex-col items-center justify-center shadow
                ${completedLevels[lv.id]
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
                  : 'bg-indigo-50 text-indigo-600 border-2 border-indigo-200'}
              `}
              title="无尽模式"
            >
              ∞{lv.id - 30}
              {completedLevels[lv.id] && <span className="text-xs">⭐</span>}
            </motion.button>
          ))}
        </div>

        {/* Endless Mode Unlock Banner */}
        {hasBeatenAll && (
          <div className="mt-6 shrink-0 bg-indigo-50 border-2 border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-extrabold text-indigo-800 text-lg">✨ 无尽模式已解锁！</span>
              <span className="text-indigo-600 font-medium text-sm">程序将生成更大的 8x8 随机超难地图</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onGenerateEndless();
                onClose();
              }}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold shadow-md shadow-indigo-500/30 hover:bg-indigo-700"
            >
              🚀 生成新无尽关卡
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Achievements shield
// ─────────────────────────────────────────────
function AchievementsSelect({ completedLevels, onClose }: {
  completedLevels: Record<number, boolean>;
  onClose: () => void;
}) {
  const count = Object.keys(completedLevels).length;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-yellow-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-blue-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="text-2xl font-extrabold text-slate-800">🏆 成就记录</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          {count === 0 ? (
            <div className="text-slate-500 py-8 text-center italic">还没有完成任何关卡。<br />加油开始你的第一关吧！</div>
          ) : (
            <>
              <div className="text-6xl my-4">🌟</div>
              <div className="text-lg font-bold text-slate-700 text-center">
                已累计通关 <span className="text-3xl text-orange-500 mx-2 font-black">{count}</span> 个关卡！
              </div>
              {count >= 5 && <div className="mt-2 text-sm text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full">🏆 编程新手</div>}
              {count >= 10 && <div className="mt-2 text-sm text-purple-600 font-bold bg-purple-50 px-4 py-2 rounded-full">👑 逻辑达人</div>}
              {count >= 20 && <div className="mt-2 text-sm text-rose-600 font-bold bg-rose-50 px-4 py-2 rounded-full">🔥 骨灰级玩家</div>}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Main Game Component
// ─────────────────────────────────────────────
interface CodingRabbitProps {
  onGameOver?: (result: string) => void;
}

type GamePhase = 'idle' | 'running' | 'paused' | 'won' | 'failed';

export function CodingRabbit({ onGameOver }: CodingRabbitProps) {
  const [levelId, setLevelId] = useState(1);
  const [endlessLevels, setEndlessLevels] = useState<LevelDef[]>([]);
  const [program, setProgram] = useState<Cmd[]>([]);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [steps, setSteps] = useState<{ row: number; col: number; dir: Direction; grid: Cell[][] }[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [gameMode, setGameMode] = useState<'beginner' | 'hard'>('hard');
  const [gameTheme, setGameTheme] = useState<GameTheme>(THEMES[0]);
  const [completedLevels, setCompletedLevels] = useState<Record<number, boolean>>({ 30: true }); // Unlock for testing
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [activeLoopId, setActiveLoopId] = useState<string | null>(null);
  const [collected, setCollected] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // All available levels (static + dynamically generated endless ones)
  const currentLevels = [...LEVELS, ...endlessLevels];
  const level = (currentLevels.find(l => l.id === levelId) ?? currentLevels[0])!;

  const handleGenerateEndless = () => {
    const newId = 30 + endlessLevels.length + 1;
    const newLevel = generateEndlessLevel(newId);
    setEndlessLevels(prev => [...prev, newLevel]);
    setLevelId(newId);
  };

  // Effective grid: in beginner mode, strip all trees (make the cell passable ground)
  const effectiveGrid = React.useMemo(() =>
    gameMode === 'beginner'
      ? level.grid.map(row => row.map(cell => cell.tree ? { ...cell, tree: false } : cell))
      : level.grid
    , [level.grid, gameMode]);

  // Check if this level has any trees (for warning banner)
  const levelHasTrees = React.useMemo(() =>
    level.grid.some(row => row.some(cell => cell.tree))
    , [level.grid]);

  // Count carrots
  const totalCarrots = effectiveGrid.flat().filter(c => c.carrot).length;

  // Build initial state
  const initialExecState = useCallback((): ExecState => {
    const gridCopy = effectiveGrid.map(r => r.map(c => ({ ...c })));
    return {
      row: level.rabbitStart.row,
      col: level.rabbitStart.col,
      dir: level.rabbitStart.dir,
      grid: gridCopy,
      collected: 0,
      total: totalCarrots,
    };
  }, [effectiveGrid, level.rabbitStart, totalCarrots]);

  const [rabbit, setRabbit] = useState(level.rabbitStart);
  const [displayGrid, setDisplayGrid] = useState(effectiveGrid);

  const resetLevel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('idle');
    setSteps([]);
    setStepIdx(0);
    setRabbit(level.rabbitStart);
    setDisplayGrid(effectiveGrid);
    setCollected(0);
    setShowComplete(false);
    setActiveLoopId(null);
  }, [level, effectiveGrid]);

  // When level changes, reset
  useEffect(() => {
    setProgram([]);
    resetLevel();
  }, [levelId]);

  const totalCmds = (cmds: Cmd[]): number =>
    cmds.reduce((acc, c) => acc + (c.type === 'loop' ? 1 + (c.inner?.length ?? 0) : 1), 0);

  // Compile steps
  const compileSteps = useCallback(() => {
    const flat = flattenCmds(program);
    const states: ExecState[] = [];
    let s = initialExecState();
    for (const step of flat) {
      s = applyStep(step, s);
      states.push({ row: s.row, col: s.col, dir: s.dir, grid: s.grid });
    }
    return { states, finalCollected: states.length > 0 ? (states[states.length - 1] as any).collected ?? 0 : 0, execState: s };
  }, [program, initialExecState]);

  // Run program
  const handleRun = () => {
    if (phase === 'running') {
      setPhase('paused');
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    if (phase === 'paused') {
      setPhase('running');
      return;
    }

    const flat = flattenCmds(program);
    if (flat.length === 0) return;

    // Build all exec states
    const allStates: ExecState[] = [];
    let s = initialExecState();
    for (const step of flat) {
      s = applyStep(step, s);
      allStates.push({ ...s });
    }

    setSteps(allStates.map(es => ({ row: es.row, col: es.col, dir: es.dir, grid: es.grid })));
    setStepIdx(0);
    setPhase('running');
  };

  // Animate steps
  useEffect(() => {
    if (phase !== 'running') return;
    if (steps.length === 0) return;

    const delay = 600 / speed;

    const tick = () => {
      setStepIdx(prev => {
        const next = prev + 1;
        if (next >= steps.length) {
          // Done
          const lastState = steps[steps.length - 1];
          const collectedCount = lastState.grid.flat().filter(c => !c.carrot).length -
            (level.grid.flat().filter(c => !c.carrot).length);
          // Count carrots not present in last state
          const totalCarrots2 = level.grid.flat().filter(c => c.carrot).length;
          const remaining = lastState.grid.flat().filter(c => c.carrot).length;
          const collectedFinal = totalCarrots2 - remaining;
          setCollected(collectedFinal);
          setDisplayGrid(lastState.grid);
          setRabbit({ row: lastState.row, col: lastState.col, dir: lastState.dir });

          if (totalCarrots2 > 0 && collectedFinal >= totalCarrots2) {
            setTimeout(() => {
              setPhase('won');
              setShowComplete(true);
              setCompletedLevels(prev => ({ ...prev, [levelId]: true }));
              if (onGameOver) onGameOver(`编程兔：完成第${levelId}关！`);
            }, 400);
          } else {
            setTimeout(() => setPhase('failed'), 400);
          }
          return steps.length;
        }

        const cur = steps[next];
        setCollected(totalCarrots - cur.grid.flat().filter(c => c.carrot).length);
        return next;
      });
    };

    timerRef.current = setTimeout(tick, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, stepIdx, steps, speed, level, totalCarrots, levelId, onGameOver]);

  // ── Program management ──
  const addCmd = (type: CmdType) => {
    if (phase === 'running') return;
    if (totalCmds(program) >= level.maxCmds && type !== 'loop') return;

    if (activeLoopId) {
      // Add to the active loop
      setProgram(prev => prev.map(c =>
        c.id === activeLoopId && c.type === 'loop'
          ? { ...c, inner: [...(c.inner ?? []), mkCmd(type)] }
          : c
      ));
    } else {
      if (type === 'loop') {
        setProgram(prev => [...prev, mkCmd('loop')]);
      } else {
        setProgram(prev => [...prev, mkCmd(type)]);
      }
    }
  };

  const removeCmd = (id: string) => {
    if (phase === 'running') return;
    setProgram(prev => prev.filter(c => c.id !== id));
    if (activeLoopId === id) setActiveLoopId(null);
  };

  const removeInnerCmd = (loopId: string, idx: number) => {
    if (phase === 'running') return;
    setProgram(prev => prev.map(c =>
      c.id === loopId ? { ...c, inner: (c.inner ?? []).filter((_, i) => i !== idx) } : c
    ));
  };

  const clearProgram = () => {
    if (phase === 'running') return;
    setProgram([]);
    setActiveLoopId(null);
  };

  // The current step's display state
  const currentDisplayStep = stepIdx < steps.length ? stepIdx : steps.length - 1;
  const activeStepGrid = steps[currentDisplayStep]?.grid ?? displayGrid;
  const activeRabbit = steps[currentDisplayStep]
    ? { row: steps[currentDisplayStep].row, col: steps[currentDisplayStep].col, dir: steps[currentDisplayStep].dir }
    : rabbit;

  const cmdCount = totalCmds(program);
  const isRunnable = program.length > 0 && phase !== 'running';

  return (
    <div className="flex flex-col items-center w-full h-full min-h-0 bg-[#d8f0f0] select-none" style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>

      {/* ── Header ── */}
      <div className="w-full flex items-center justify-between px-6 py-3 bg-white/70 backdrop-blur-md border-b border-white/50 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-orange-100 rounded-full text-2xl shadow-sm">
              {gameTheme.emoji}
            </div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500 tracking-tight whitespace-nowrap">
              {gameTheme.id === 'ultraman' ? '奥特打怪兽' : gameTheme.id === 'rabbit' ? 'CodingRabbit' : `Coding${gameTheme.name}`}
            </h1>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          {/* Theme toggle (Left side) */}
          <div className="flex bg-slate-100/80 backdrop-blur rounded-full p-1 border border-slate-200 shadow-inner gap-1">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => { setGameTheme(theme); resetLevel(); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xl transition-all ${gameTheme.id === theme.id ? 'bg-white shadow-sm scale-110' : 'hover:scale-110 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                  }`}
                title={theme.name}
              >
                {theme.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            className={`
              px-6 py-2.5 rounded-full font-extrabold text-sm shadow-sm transition-all
              ${(phase === 'running' || phase === 'paused')
                ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95 shadow-red-500/30'
                : 'bg-[#f48c06] text-white hover:bg-[#e85d04] hover:shadow-lg hover:shadow-orange-500/30 active:scale-95'
              }
            `}
          >
            {phase === 'running' ? '⏸️ 暂停' : phase === 'paused' ? '▶️ 继续' : '▶️ 开始游戏'}
          </button>
          <button
            onClick={() => setShowLevelSelect(true)}
            className="px-5 py-2.5 rounded-full font-bold text-sm bg-orange-50 text-orange-600 border-2 border-orange-100 hover:bg-orange-100 hover:border-orange-200 transition-colors shadow-sm"
          >
            关卡选择
          </button>
          <button
            onClick={() => setShowAchievements(true)}
            className="px-5 py-2.5 rounded-full font-bold text-sm bg-white text-slate-600 border-2 border-blue-600 shadow-[0_0_0_2px_rgba(37,99,235,0.2)] hover:bg-slate-50 transition-colors"
          >
            成就记录
          </button>

          {/* Mode toggle */}
          <div className="flex bg-slate-100 rounded-full p-0.5 border border-slate-200 shadow-inner">
            <button
              onClick={() => { setGameMode('beginner'); resetLevel(); }}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${gameMode === 'beginner' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              🌱 入门
            </button>
            <button
              onClick={() => { setGameMode('hard'); resetLevel(); }}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${gameMode === 'hard' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              🌲 困难
            </button>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-6 flex-1 min-h-0">

        {/* ── Left: Game grid ── */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 bg-[#74c69d] rounded-[32px] shadow-2xl overflow-hidden pointer-events-none">
            {/* Background decorative clouds/gradients could go here */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#8ed3b6] to-transparent"></div>
          </div>

          <div className="z-10 w-full h-full flex flex-col items-center justify-center" style={{ minHeight: '500px' }}>
            {/* Barrier warning banner */}
            {gameMode === 'hard' && levelHasTrees && (
              <div className="mb-2 px-4 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                🍄 提示：有蘑菇的格子不能走，需要绕开！
              </div>
            )}
            <GameGrid
              levelGrid={effectiveGrid}
              rabbit={activeRabbit}
              currentStep={currentDisplayStep}
              steps={steps.map(s => ({ row: s.row, col: s.col, dir: s.dir, grid: s.grid }))}
              Player={gameTheme.Player}
              Collectible={gameTheme.Collectible}
            />
          </div>
        </div>

        {/* ── Right: Controls ── */}
        <div className="flex flex-col gap-4 w-full lg:w-[360px] relative z-10 shrink-0">

          {/* Top Panel: Available commands */}
          <div className="bg-[#fef6ed]/90 backdrop-blur rounded-[24px] shadow-lg p-5 border-2 border-white">
            <h3 className="text-center font-bold text-slate-700 text-lg mb-4">指令</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {level.availableCmds.map(type => (
                <CommandCard
                  key={type}
                  cmd={{ id: type, type }}
                  onClick={() => addCmd(type)}
                />
              ))}
            </div>

            <div className="mt-4 text-center">
              <span className="font-bold text-slate-500 text-sm tracking-widest">{cmdCount} / {level.maxCmds}</span>
            </div>

            {activeLoopId && (
              <p className="text-xs text-amber-600 mt-3 font-bold text-center bg-amber-100 py-2 rounded-xl">
                ↪ 点击上方指令加入循环
                <button
                  className="ml-3 px-2 py-0.5 bg-white text-slate-500 rounded-md shadow-sm"
                  onClick={() => setActiveLoopId(null)}
                >
                  取消
                </button>
              </p>
            )}
          </div>

          {/* Middle Panel: Program area */}
          <div className="bg-[#fef6ed]/90 backdrop-blur rounded-[24px] shadow-lg p-5 border-2 border-white flex-1 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-700 text-lg">程序</h3>
              <button
                onClick={clearProgram}
                className="text-sm text-slate-400 hover:text-red-400 font-bold transition-colors"
              >
                清空
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <div className={`
                flex flex-wrap gap-2 p-3 min-h-[140px] rounded-2xl
                ${program.length === 0 ? 'bg-white/50 border-2 border-dashed border-[#e6e2df]' : 'bg-transparent'}
              `}>
                {program.map((cmd, i) => {
                  if (cmd.type === 'loop') {
                    // Count inner offset
                    let offset = 0;
                    for (let j = 0; j < i; j++) {
                      const c = program[j];
                      if (c.type === 'loop') offset += (c.inner?.length ?? 0) * (c.loopCount ?? 2);
                      else offset += 1;
                    }
                    return (
                      <LoopBlock
                        key={cmd.id}
                        cmd={cmd}
                        onRemove={() => removeCmd(cmd.id)}
                        onAddInner={(type) => {
                          setProgram(prev => prev.map(c =>
                            c.id === cmd.id ? { ...c, inner: [...(c.inner ?? []), mkCmd(type)] } : c
                          ));
                        }}
                        onRemoveInner={(idx) => removeInnerCmd(cmd.id, idx)}
                        activeIdx={currentDisplayStep}
                        programOffset={offset}
                      />
                    );
                  }
                  return (
                    <CommandCard
                      key={cmd.id}
                      cmd={cmd}
                      small
                      onClick={() => removeCmd(cmd.id)}
                    />
                  );
                })}
                {program.length === 0 && (
                  <div className="w-full h-full flex items-center justify-center flex-col gap-2 opacity-60">
                    <span className="text-sm font-bold text-slate-400">拖拽指令到此处或点击添加</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hint at the bottom of the program area */}
            {level.hint && (
              <div className="mt-4 pt-4 border-t border-slate-200/50 text-center">
                <p className="text-xs font-bold text-slate-400">
                  <span className="text-amber-500 mr-1">TIPS:</span>
                  关卡 {level.id}: {level.hint}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Panel: Controls */}
          <div className="bg-[#fef6ed]/90 backdrop-blur rounded-[24px] shadow-lg p-5 border-2 border-white flex flex-col gap-4">

            <div className="flex items-center justify-between gap-3">
              {/* Collectible Counter Token */}
              <div className="bg-white px-4 py-3 rounded-full shadow-sm border border-orange-100 flex items-center gap-2">
                <span className="text-2xl drop-shadow-sm">{gameTheme.collectibleEmoji}</span>
                <span className="font-extrabold text-orange-500 text-xl">{collected} / {totalCarrots}</span>
              </div>

              {/* Status/Run Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRun}
                disabled={program.length === 0 && phase === 'idle'}
                className={`
                  flex-1 py-3 px-6 rounded-full font-extrabold text-white text-lg shadow-md transition-colors flex items-center justify-center gap-2
                  ${phase === 'running'
                    ? 'bg-amber-400 hover:bg-amber-500 shadow-amber-200'
                    : phase === 'paused'
                      ? 'bg-sky-400 hover:bg-sky-500 shadow-sky-200'
                      : 'bg-[#ffaa80] hover:bg-[#ff9966] shadow-orange-200'}
                  disabled:opacity-50 disabled:grayscale
                `}
              >
                {phase === 'running' ? '⏸ 暂停' : phase === 'paused' ? '▶ 继续' : '▶ 运行'}
              </motion.button>
            </div>

            <div className="flex items-center gap-4 px-2">
              <span className="text-sm font-bold text-slate-500">速度</span>
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.5}
                value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="flex-1 accent-orange-400"
              />
              <span className="text-sm font-extrabold text-orange-500 w-8">{speed}x</span>

              <button
                onClick={resetLevel}
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 text-slate-500 font-bold shadow-sm border border-slate-100 flex items-center justify-center transition-colors shrink-0"
                title="重置"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Level complete modal ── */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.6, y: 60 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 200 }}
              className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-xs w-full mx-4"
            >
              <div className="text-6xl">⭐</div>
              <h2 className="text-2xl font-extrabold text-slate-800">关卡完成！</h2>
              <p className="text-slate-500 text-sm">你完成了第 {levelId} 关 — {level.name}</p>
              <p className="text-lg font-bold text-orange-500">{gameTheme.collectibleEmoji} {totalCarrots}/{totalCarrots} 已收集</p>
              <div className="flex gap-3 w-full">
                {levelId < LEVELS.length && (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setLevelId(levelId + 1); setShowComplete(false); }}
                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-extrabold rounded-xl shadow-lg"
                  >
                    下一关 →
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { resetLevel(); setShowComplete(false); }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  再玩
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Level Failed modal ── */}
      <AnimatePresence>
        {phase === 'failed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.6, y: 60 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 200 }}
              className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-xs w-full mx-4"
            >
              <div className="text-6xl">😕</div>
              <h2 className="text-2xl font-extrabold text-slate-800">没有收集完！</h2>
              <p className="text-slate-500 text-sm text-center">
                程序执行完毕，但还有{gameTheme.collectibleName}没有采到。
                <br />试着调整你的指令序列！
              </p>
              <p className="text-lg font-bold text-orange-500">
                {gameTheme.collectibleEmoji} {collected}/{totalCarrots} 已收集
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => resetLevel()}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl shadow-lg"
              >
                再试一次 →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <AnimatePresence>
        {showLevelSelect && (
          <LevelSelect
            completedLevels={completedLevels}
            onSelect={setLevelId}
            onClose={() => setShowLevelSelect(false)}
            endlessLevels={endlessLevels}
            onGenerateEndless={handleGenerateEndless}
          />
        )}
        {showAchievements && (
          <AchievementsSelect
            completedLevels={completedLevels}
            onClose={() => setShowAchievements(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
