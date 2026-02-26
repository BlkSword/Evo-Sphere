// ========================================
// 数学工具函数
// ========================================

import type { Coord, Viewport } from '../types'

/**
 * 坐标转换: 世界坐标 -> 屏幕坐标
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: Viewport,
  cellSize: number
): { x: number; y: number } {
  return {
    x: worldX * cellSize - viewport.x1,
    y: worldY * cellSize - viewport.y1,
  }
}

/**
 * 坐标转换: 屏幕坐标 -> 世界坐标
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: Viewport,
  cellSize: number
): { x: number; y: number } {
  return {
    x: Math.floor((screenX + viewport.x1) / cellSize),
    y: Math.floor((screenY + viewport.y1) / cellSize),
  }
}

/**
 * 限制数值在范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 线性插值
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1)
}

/**
 * 计算两点距离
 */
export function distance(a: Coord, b: Coord): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 计算视野中心点
 */
export function getViewportCenter(viewport: Viewport): Coord {
  return {
    x: (viewport.x1 + viewport.x2) / 2,
    y: (viewport.y1 + viewport.y2) / 2,
  }
}

/**
 * 移动视野
 */
export function moveViewport(
  viewport: Viewport,
  dx: number,
  dy: number,
  worldBounds?: { minX: number; minY: number; maxX: number; maxY: number }
): Viewport {
  let newX1 = viewport.x1 + dx
  let newY1 = viewport.y1 + dy
  let newX2 = viewport.x2 + dx
  let newY2 = viewport.y2 + dy

  // 应用边界限制
  if (worldBounds) {
    const width = viewport.x2 - viewport.x1
    const height = viewport.y2 - viewport.y1
    
    newX1 = clamp(newX1, worldBounds.minX, worldBounds.maxX - width)
    newY1 = clamp(newY1, worldBounds.minY, worldBounds.maxY - height)
    newX2 = newX1 + width
    newY2 = newY1 + height
  }

  return { x1: newX1, y1: newY1, x2: newX2, y2: newY2 }
}

/**
 * 缩放视野
 */
export function zoomViewport(
  viewport: Viewport,
  zoomFactor: number,
  center?: Coord
): Viewport {
  const cx = center?.x ?? (viewport.x1 + viewport.x2) / 2
  const cy = center?.y ?? (viewport.y1 + viewport.y2) / 2

  const halfWidth = ((viewport.x2 - viewport.x1) / 2) / zoomFactor
  const halfHeight = ((viewport.y2 - viewport.y1) / 2) / zoomFactor

  return {
    x1: cx - halfWidth,
    y1: cy - halfHeight,
    x2: cx + halfWidth,
    y2: cy + halfHeight,
  }
}

/**
 * 格式化大数字
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B'
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * 格式化坐标
 */
export function formatCoord(coord: number): string {
  if (coord >= 0) {
    return `+${coord.toLocaleString()}`
  }
  return coord.toLocaleString()
}

/**
 * 生成随机颜色 (HSL)
 */
export function randomColor(hueMin = 0, hueMax = 360): string {
  const hue = Math.random() * (hueMax - hueMin) + hueMin
  const sat = 70 + Math.random() * 30
  const light = 50 + Math.random() * 20
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

/**
 * 生成玩家颜色
 */
export function generatePlayerColor(): string {
  // 使用赛博朋克色调
  const hues = [170, 180, 280, 300, 320, 30, 50] // 青色、紫色、粉色、橙色、黄色
  const hue = hues[Math.floor(Math.random() * hues.length)]
  const sat = 80 + Math.random() * 20
  const light = 55 + Math.random() * 15
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

/**
 * 颜色转换: HSL to RGB string
 */
export function hslToRgb(hsl: string): { r: number; g: number; b: number } {
  const match = hsl.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/)
  if (!match) return { r: 0, g: 255, b: 136 }

  let h = parseFloat(match[1]) / 360
  let s = parseFloat(match[2]) / 100
  let l = parseFloat(match[3]) / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

/**
 * 解析 rgba 颜色
 */
export function parseRgba(rgba: string): { r: number; g: number; b: number; a: number } {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (!match) return { r: 0, g: 0, b: 0, a: 1 }
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1,
  }
}

/**
 * 调整颜色透明度
 */
export function setAlpha(color: string, alpha: number): string {
  const rgb = parseRgba(color)
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}
