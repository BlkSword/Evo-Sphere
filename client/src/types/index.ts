// ========================================
// Evo-Sphere 类型定义
// ========================================

// 细胞状态: 0 = 死亡, 1 = 存活, 2 = 拖尾(正在消失)
export type CellState = 0 | 1 | 2

// 坐标
export interface Coord {
  x: number
  y: number
}

// 视野区域
export interface Viewport {
  x1: number
  y1: number
  x2: number
  y2: number
}

// 细胞差异数据
export interface CellDiff {
  x: number
  y: number
  state: CellState
  age?: number // 细胞存活代数
}

// 细胞拖尾效果
export interface CellTrail {
  x: number
  y: number
  opacity: number
  age: number
  depth: number // 下沉深度
}

// 玩家
export interface Player {
  id: string
  name: string
  cursor: Coord
  color: string
  isOnline: boolean
  lastSeen: number
}

// 在线玩家状态
export interface OnlinePlayer {
  id: string
  name: string
  color: string
  cursor: Coord
}

// 消息类型
export const enum MessageType {
  CELL_UPDATE = 0x01,
  VIEWPORT_SUB = 0x02,
  CELL_PLACE = 0x03,
  PLAYER_CURSOR = 0x04,
  SNAPSHOT = 0x05,
  PLAYER_JOIN = 0x06,
  PLAYER_LEAVE = 0x07,
  WORLD_CONFIG = 0x08,
}

// 消息接口
export interface CellUpdateMessage {
  type: MessageType.CELL_UPDATE
  cells: CellDiff[]
  generation: number
}

export interface ViewportSubMessage {
  type: MessageType.VIEWPORT_SUB
  viewport: Viewport
}

export interface CellPlaceMessage {
  type: MessageType.CELL_PLACE
  x: number
  y: number
  playerId?: string
}

export interface PlayerCursorMessage {
  type: MessageType.PLAYER_CURSOR
  playerId: string
  cursor: Coord
}

export interface SnapshotMessage {
  type: MessageType.SNAPSHOT
  cells: CellDiff[]
  generation: number
  population: number
}

export interface PlayerJoinMessage {
  type: MessageType.PLAYER_JOIN
  player: Player
}

export interface PlayerLeaveMessage {
  type: MessageType.PLAYER_LEAVE
  playerId: string
}

export interface WorldConfigMessage {
  type: MessageType.WORLD_CONFIG
  worldSize: number
  cellSize: number
  maxPopulation: number
}

// 主题配置
export interface ThemeConfig {
  name: string
  background: string
  gridColor: string
  cellAlive: string
  cellDead: string
  cellTrail: string
  glowColor: string
  accentColor: string
}

// 预设主题
export const THEMES: Record<string, ThemeConfig> = {
  cyber: {
    name: '赛博朋克',
    background: '#0a0a1a',
    gridColor: 'rgba(0, 240, 255, 0.08)',
    cellAlive: '#00ff88',
    cellDead: 'rgba(255, 100, 100, 0.4)',
    cellTrail: 'rgba(139, 92, 246, 0.3)',
    glowColor: '#00f0ff',
    accentColor: '#ff00a0',
  },
  ocean: {
    name: '深海',
    background: '#001020',
    gridColor: 'rgba(0, 150, 255, 0.1)',
    cellAlive: '#00d4ff',
    cellDead: 'rgba(0, 50, 100, 0.5)',
    cellTrail: 'rgba(0, 200, 255, 0.2)',
    glowColor: '#0096ff',
    accentColor: '#00d4ff',
  },
  matrix: {
    name: '矩阵',
    background: '#000000',
    gridColor: 'rgba(0, 255, 0, 0.05)',
    cellAlive: '#00ff00',
    cellDead: 'rgba(0, 100, 0, 0.3)',
    cellTrail: 'rgba(0, 200, 0, 0.2)',
    glowColor: '#00ff00',
    accentColor: '#00ff00',
  },
  sunset: {
    name: '日落',
    background: '#1a0a1a',
    gridColor: 'rgba(255, 100, 100, 0.08)',
    cellAlive: '#ff6b35',
    cellDead: 'rgba(100, 50, 50, 0.4)',
    cellTrail: 'rgba(255, 150, 100, 0.3)',
    glowColor: '#ff6b35',
    accentColor: '#ffd700',
  },
}

// 应用状态
export interface AppState {
  isLoading: boolean
  isPaused: boolean
  showGrid: boolean
  showTrails: boolean
  showMinimap: boolean
  showPlayers: boolean
  currentTheme: string
  simulationSpeed: number
  zoomLevel: number
}
