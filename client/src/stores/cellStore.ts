import { create } from 'zustand'
import type { CellDiff, CellTrail, Viewport } from '../types'

interface CellStore {
  // 细胞数据
  cells: Map<string, number> // key: "x,y" -> age (存活代数)
  trails: Map<string, CellTrail> // 死亡细胞拖尾

  // 视野 (全部使用细胞坐标)
  viewport: Viewport
  zoomLevel: number

  // 统计
  generation: number
  population: number

  // 世界边界 (细胞坐标)
  worldBounds: { minX: number; minY: number; maxX: number; maxY: number }

  // Actions
  setCells: (cells: Map<string, number>) => void
  applyDiffs: (diffs: CellDiff[]) => void
  setViewport: (viewport: Viewport) => void
  moveViewport: (dx: number, dy: number) => void
  zoomViewport: (factor: number, centerX?: number, centerY?: number) => void
  setZoomLevel: (zoom: number) => void
  setGeneration: (generation: number) => void
  setPopulation: (population: number) => void
  updateTrails: () => void
  clearTrails: () => void
  clearCells: () => void
  randomizeCells: () => void
}

// 世界配置 (细胞坐标)
const WORLD_SIZE = 1000  // 1000x1000 细胞
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const TRAIL_DECAY = 0.03

export const useCellStore = create<CellStore>((set, get) => ({
  // 初始状态
  cells: new Map(),
  trails: new Map(),
  // 初始视野居中于世界中心 (细胞坐标)
  viewport: {
    x1: 300,   // 世界中心 500 - 可见宽度/2
    y1: 300,   // 世界中心 500 - 可见高度/2
    x2: 700,   // 世界中心 500 + 可见宽度/2
    y2: 700    // 世界中心 500 + 可见高度/2
  },
  zoomLevel: 1,
  generation: 0,
  population: 0,
  worldBounds: {
    minX: 0,
    minY: 0,
    maxX: WORLD_SIZE,
    maxY: WORLD_SIZE,
  },

  setCells: (cells) => set({
    cells,
    population: cells.size
  }),

  applyDiffs: (diffs) => {
    const cells = new Map(get().cells)
    const trails = new Map(get().trails)

    for (const diff of diffs) {
      const key = `${diff.x},${diff.y}`

      if (diff.state === 1) {
        // 细胞复活/存活
        cells.set(key, diff.age || 1)
        trails.delete(key)
      } else {
        // 细胞死亡 - 创建拖尾
        const age = cells.get(key) || 1
        cells.delete(key)

        trails.set(key, {
          x: diff.x,
          y: diff.y,
          opacity: Math.min(age * 0.08 + 0.2, 0.7),
          age: 0,
          depth: 0,
        })
      }
    }

    set({
      cells,
      trails,
      population: cells.size
    })
  },

  setViewport: (viewport) => set({ viewport }),

  moveViewport: (dx, dy) => {
    const { viewport, worldBounds } = get()

    // dx, dy 已经是像素移动量，需要转换为细胞坐标
    const cellSize = 8 * get().zoomLevel
    const cellDx = dx / cellSize
    const cellDy = dy / cellSize

    let newX1 = viewport.x1 - cellDx
    let newY1 = viewport.y1 - cellDy

    const width = viewport.x2 - viewport.x1
    const height = viewport.y2 - viewport.y1

    // 边界限制
    newX1 = Math.max(worldBounds.minX, Math.min(newX1, worldBounds.maxX - width))
    newY1 = Math.max(worldBounds.minY, Math.min(newY1, worldBounds.maxY - height))

    set({
      viewport: {
        x1: newX1,
        y1: newY1,
        x2: newX1 + width,
        y2: newY1 + height
      }
    })
  },

  zoomViewport: (factor, centerX, centerY) => {
    const { viewport, zoomLevel, worldBounds } = get()

    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * factor))
    if (newZoom === zoomLevel) return

    const cx = centerX ?? (viewport.x1 + viewport.x2) / 2
    const cy = centerY ?? (viewport.y1 + viewport.y2) / 2

    // 以指定点为中心缩放
    const halfWidth = ((viewport.x2 - viewport.x1) / 2) / factor
    const halfHeight = ((viewport.y2 - viewport.y1) / 2) / factor

    let newX1 = cx - halfWidth
    let newY1 = cy - halfHeight
    let newX2 = cx + halfWidth
    let newY2 = cy + halfHeight

    // 边界限制
    const width = newX2 - newX1
    const height = newY2 - newY1
    newX1 = Math.max(worldBounds.minX, Math.min(newX1, worldBounds.maxX - width))
    newY1 = Math.max(worldBounds.minY, Math.min(newY1, worldBounds.maxY - height))
    newX2 = newX1 + width
    newY2 = newY1 + height

    set({
      zoomLevel: newZoom,
      viewport: { x1: newX1, y1: newY1, x2: newX2, y2: newY2 }
    })
  },

  setZoomLevel: (zoom) => set({ zoomLevel: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) }),

  setGeneration: (generation) => set({ generation }),

  setPopulation: (population) => set({ population }),

  updateTrails: () => {
    const trails = new Map(get().trails)

    for (const [key, trail] of trails) {
      trail.opacity -= TRAIL_DECAY
      trail.depth += 0.5
      trail.age++

      if (trail.opacity <= 0) {
        trails.delete(key)
      }
    }

    set({ trails })
  },

  clearTrails: () => set({ trails: new Map() }),

  clearCells: () => {
    set({ 
      cells: new Map(),
      trails: new Map(),
      population: 0,
      generation: 0 
    })
  },

  randomizeCells: () => {
    const cells = new Map<string, number>()
    const { worldBounds } = get()
    const density = 0.15 // 15% 的密度
    
    for (let x = worldBounds.minX; x < worldBounds.maxX; x += 2) {
      for (let y = worldBounds.minY; y < worldBounds.maxY; y += 2) {
        if (Math.random() < density) {
          cells.set(`${x},${y}`, 1)
        }
      }
    }
    
    set({ 
      cells,
      trails: new Map(),
      population: cells.size,
      generation: 0 
    })
  },
}))
