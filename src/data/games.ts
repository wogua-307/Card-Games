export interface GameInfo {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  players: number;
}

export const GAMES: GameInfo[] = [
  {
    id: 'gomoku',
    name: '五子棋',
    description: '经典连珠游戏，先连成五子者胜。',
    color: 'bg-rose-100 text-rose-600 border-rose-200',
    icon: 'CircleDot',
    players: 2,
  },
  {
    id: 'chess',
    name: '国际象棋',
    description: '策略深远的西方经典棋类。',
    color: 'bg-blue-100 text-blue-600 border-blue-200',
    icon: 'Crown',
    players: 2,
  },
  {
    id: 'go',
    name: '围棋',
    description: '黑白交错，包围与反包围的智慧。',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: 'Circle',
    players: 2,
  },
  {
    id: 'animal-chess',
    name: '斗兽棋',
    description: '象狮虎豹狼狗猫鼠，趣味吃子。',
    color: 'bg-orange-100 text-orange-600 border-orange-200',
    icon: 'Cat',
    players: 2,
  },
  {
    id: 'junqi',
    name: '军棋',
    description: '排兵布阵，运筹帷幄决胜千里。',
    color: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    icon: 'Swords',
    players: 2,
  },
];

export interface TutorialInfo {
  gameId: string;
  title: string;
  content: string[];
}

export const TUTORIALS: Record<string, TutorialInfo> = {
  gomoku: {
    gameId: 'gomoku',
    title: '五子棋教学',
    content: [
      '五子棋是一种两人对弈的纯策略型棋类游戏。',
      '棋具：通常使用15×15的棋盘，黑白两色棋子。',
      '规则：黑棋先手，白棋后手，两人轮流落子。',
      '胜负：最先在横、竖、斜任意一个方向上连成5个同色棋子的一方获胜。',
      '技巧：注意防守对方的"活三"和"冲四"，同时积极创造自己的双杀机会。'
    ]
  },
  chess: {
    gameId: 'chess',
    title: '国际象棋教学',
    content: [
      '国际象棋是世界上最受欢迎的棋类游戏之一。',
      '棋盘：8×8的黑白相间格子。',
      '棋子：王(1)、后(1)、车(2)、象(2)、马(2)、兵(8)。',
      '走法：',
      '- 王：横直斜走一格。',
      '- 后：横直斜走任意格数。',
      '- 车：横直走任意格数。',
      '- 象：斜走任意格数。',
      '- 马：走"日"字。',
      '- 兵：只能向前，第一步可走两格，吃子时斜吃。',
      '胜负：将死对方的"王"即为获胜。'
    ]
  },
  go: {
    gameId: 'go',
    title: '围棋教学',
    content: [
      '围棋是世界上最古老的棋类游戏之一。',
      '棋盘：19×19的网格交叉点。',
      '规则：黑先白后，交替落子于交叉点上。落子无悔。',
      '气：棋子直线紧邻的空点称为"气"。没有气的棋子会被"提"掉（吃掉）。',
      '胜负：终局时，占领地盘（目数）多的一方获胜。',
      '禁手：禁止全局同形（打劫规则），禁止自杀。'
    ]
  },
  'animal-chess': {
    gameId: 'animal-chess',
    title: '斗兽棋教学',
    content: [
      '斗兽棋是一款趣味性极强的儿童棋类游戏。',
      '棋盘：7×9的格子，包含河流、陷阱和兽穴。',
      '棋子大小：象 > 狮 > 虎 > 豹 > 狼 > 狗 > 猫 > 鼠。',
      '特殊规则：',
      '- 鼠可以吃象。',
      '- 鼠可以下河，但在河里不能吃岸上的象。',
      '- 狮、虎可以跳过河流（如果河里没有老鼠阻挡）。',
      '胜负：任何一方的棋子进入对方的兽穴即为获胜，或者吃光对方所有棋子。'
    ]
  },
  junqi: {
    gameId: 'junqi',
    title: '军棋教学',
    content: [
      '军棋是一款模拟战争的棋类游戏。',
      '棋子大小：司令 > 军长 > 师长 > 旅长 > 团长 > 营长 > 连长 > 排长 > 工兵。',
      '特殊棋子：',
      '- 炸弹：与任何敌方棋子同归于尽。',
      '- 地雷：不能移动，除工兵和炸弹外，其他棋子碰到地雷都会阵亡。',
      '- 军旗：不能移动，放在大本营中。',
      '胜负：扛走对方的军旗，或者消灭对方所有能移动的棋子即为获胜。'
    ]
  }
};
