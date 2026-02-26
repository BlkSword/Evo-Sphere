import { MessageType, type CellDiff, type Viewport } from '../types'

export function encodeCellPlace(x: number, y: number): ArrayBuffer {
  const buffer = new ArrayBuffer(9)
  const view = new DataView(buffer)
  view.setUint8(0, MessageType.CELL_PLACE)
  view.setInt32(1, x, true)
  view.setInt32(5, y, true)
  return buffer
}

export function encodeViewportSub(viewport: Viewport): ArrayBuffer {
  const buffer = new ArrayBuffer(17)
  const view = new DataView(buffer)
  view.setUint8(0, MessageType.VIEWPORT_SUB)
  view.setInt32(1, viewport.x1, true)
  view.setInt32(5, viewport.y1, true)
  view.setInt32(9, viewport.x2, true)
  view.setInt32(13, viewport.y2, true)
  return buffer
}

export function encodePlayerCursor(x: number, y: number): ArrayBuffer {
  const buffer = new ArrayBuffer(9)
  const view = new DataView(buffer)
  view.setUint8(0, MessageType.PLAYER_CURSOR)
  view.setInt32(1, x, true)
  view.setInt32(5, y, true)
  return buffer
}

export function decodeCellUpdate(buffer: ArrayBuffer): CellDiff[] {
  const view = new DataView(buffer)
  const count = view.getUint16(1, true)
  const diffs: CellDiff[] = []

  for (let i = 0; i < count; i++) {
    const offset = 3 + i * 9
    const x = view.getInt32(offset, true)
    const y = view.getInt32(offset + 4, true)
    const state = view.getUint8(offset + 8) as 0 | 1
    diffs.push({ x, y, state })
  }

  return diffs
}

export function decodeSnapshot(buffer: ArrayBuffer): {
  cells: CellDiff[]
  generation: number
  population: number
} {
  const view = new DataView(buffer)
  const generation = view.getUint32(1, true)
  const population = view.getUint32(5, true)
  const count = view.getUint16(9, true)
  const cells: CellDiff[] = []

  for (let i = 0; i < count; i++) {
    const offset = 11 + i * 8
    const x = view.getInt32(offset, true)
    const y = view.getInt32(offset + 4, true)
    cells.push({ x, y, state: 1 })
  }

  return { cells, generation, population }
}
