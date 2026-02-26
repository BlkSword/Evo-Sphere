import { useEffect, useRef, useCallback, useState } from 'react'
import { useCellStore } from './stores/cellStore'
import { useAppStore } from './stores/appStore'
import { useWebSocket } from './hooks/useWebSocket'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { StatsOverlay } from './components/ui/StatsOverlay'
import { CoordinateNavigator } from './components/ui/CoordinateNavigator'
import { Minimap } from './components/ui/Minimap'
import { clamp } from './utils/math'

// 配置参数
const CELL_SIZE_BASE = 8  // 基础细胞大小（像素）
const ZOOM_SPEED = 0.002
const TRAIL_UPDATE_INTERVAL = 50 // 拖尾更新间隔(ms)

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const lastTrailUpdate = useRef<number>(0)
  const dragState = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
  })
  const [fps, setFps] = useState(60)
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() })

  const {
    cells,
    trails,
    viewport,
    zoomLevel,
    setZoomLevel,
    generation,
    population,
    updateTrails,
    worldBounds,
    setViewport,
  } = useCellStore()

  const {
    isLoading,
    isPaused,
    showGrid,
    showTrails,
    theme,
  } = useAppStore()

  const { isConnected } = useWebSocket()

  // 计算实际细胞大小（像素）
  const cellSize = CELL_SIZE_BASE * zoomLevel

  // 细胞坐标转屏幕坐标
  const cellToScreen = useCallback((cellX: number, cellY: number) => {
    return {
      x: (cellX - viewport.x1) * cellSize,
      y: (cellY - viewport.y1) * cellSize,
    }
  }, [viewport, cellSize])

  // 屏幕坐标转细胞坐标
  const screenToCell = useCallback((screenX: number, screenY: number) => {
    return {
      x: viewport.x1 + screenX / cellSize,
      y: viewport.y1 + screenY / cellSize,
    }
  }, [viewport, cellSize])

  // 主动画循环
  const animate = useCallback((currentTime: number) => {
    // 计算FPS
    fpsRef.current.frames++
    if (currentTime - fpsRef.current.lastTime >= 1000) {
      setFps(fpsRef.current.frames)
      fpsRef.current.frames = 0
      fpsRef.current.lastTime = currentTime
    }

    // 更新拖尾
    if (showTrails && currentTime - lastTrailUpdate.current > TRAIL_UPDATE_INTERVAL) {
      updateTrails()
      lastTrailUpdate.current = currentTime
    }

    // 渲染画布
    renderCanvas()

    animationRef.current = requestAnimationFrame(animate)
  }, [showTrails, updateTrails])

  // 渲染画布
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // 清空画布
    ctx.fillStyle = theme.background
    ctx.fillRect(0, 0, width, height)

    // 绘制网格
    if (showGrid) {
      drawGrid(ctx, width, height)
    }

    // 绘制拖尾
    if (showTrails) {
      drawTrails(ctx)
    }

    // 绘制细胞
    drawCells(ctx)
  }, [cells, trails, viewport, cellSize, showGrid, showTrails, theme])

  // 绘制网格
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = theme.gridColor
    ctx.lineWidth = 0.5

    // 计算可见的细胞范围
    const startCellX = Math.floor(viewport.x1)
    const startCellY = Math.floor(viewport.y1)
    const endCellX = Math.ceil(viewport.x1 + width / cellSize)
    const endCellY = Math.ceil(viewport.y1 + height / cellSize)

    // 垂直线
    for (let cellX = startCellX; cellX <= endCellX; cellX++) {
      const { x: screenX } = cellToScreen(cellX, 0)
      ctx.beginPath()
      ctx.moveTo(screenX, 0)
      ctx.lineTo(screenX, height)
      ctx.stroke()
    }

    // 水平线
    for (let cellY = startCellY; cellY <= endCellY; cellY++) {
      const { y: screenY } = cellToScreen(0, cellY)
      ctx.beginPath()
      ctx.moveTo(0, screenY)
      ctx.lineTo(width, screenY)
      ctx.stroke()
    }

    // 绘制原点坐标轴 (细胞坐标 0,0)
    const { x: originScreenX, y: originScreenY } = cellToScreen(0, 0)
    if (originScreenX >= 0 && originScreenX <= width) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(originScreenX, 0)
      ctx.lineTo(originScreenX, height)
      ctx.stroke()
    }

    if (originScreenY >= 0 && originScreenY <= height) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, originScreenY)
      ctx.lineTo(width, originScreenY)
      ctx.stroke()
    }
  }

  // 绘制拖尾
  const drawTrails = (ctx: CanvasRenderingContext2D) => {
    trails.forEach((trail) => {
      const { x: screenX, y: screenY } = cellToScreen(trail.x, trail.y)
      const trailY = screenY + trail.depth

      // 视野裁剪
      if (screenX < -cellSize || screenX > ctx.canvas.width ||
          trailY < -cellSize || trailY > ctx.canvas.height) {
        return
      }

      const alpha = trail.opacity * 0.6
      ctx.fillStyle = theme.cellTrail.replace(/[\d.]+%?\)$/g, `${alpha})`)
      ctx.fillRect(screenX, trailY, cellSize - 1, cellSize - 1)
    })
  }

  // 绘制细胞
  const drawCells = (ctx: CanvasRenderingContext2D) => {
    cells.forEach((age, key) => {
      const [x, y] = key.split(',').map(Number)
      const { x: screenX, y: screenY } = cellToScreen(x, y)

      // 视野裁剪
      if (screenX < -cellSize || screenX > ctx.canvas.width ||
          screenY < -cellSize || screenY > ctx.canvas.height) {
        return
      }

      // 根据细胞年龄调整颜色
      const intensity = Math.min(age / 20, 1)

      // 解析基础颜色
      const match = theme.cellAlive.match(/#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/)
      if (match) {
        const r = parseInt(match[1], 16)
        const g = parseInt(match[2], 16)
        const b = parseInt(match[3], 16)

        // 随着年龄变得更亮
        const brightR = Math.min(255, r + intensity * 50)
        const brightG = Math.min(255, g + intensity * 50)
        const brightB = Math.min(255, b + intensity * 50)

        ctx.fillStyle = `rgb(${brightR}, ${brightG}, ${brightB})`
      } else {
        ctx.fillStyle = theme.cellAlive
      }

      // 发光效果
      if (age > 5) {
        ctx.shadowColor = theme.cellAlive
        ctx.shadowBlur = age > 10 ? 15 : 8
      } else {
        ctx.shadowBlur = 0
      }

      ctx.fillRect(screenX + 0.5, screenY + 0.5, cellSize - 1, cellSize - 1)
      ctx.shadowBlur = 0
    })
  }

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const container = containerRef.current
      if (!container) return

      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      canvas.width = newWidth
      canvas.height = newHeight

      // 更新视野以保持中心点不变
      const centerX = (viewport.x1 + viewport.x2) / 2
      const centerY = (viewport.y1 + viewport.y2) / 2

      // 计算新的视野范围（细胞坐标）
      const viewWidthCells = newWidth / cellSize
      const viewHeightCells = newHeight / cellSize

      setViewport({
        x1: centerX - viewWidthCells / 2,
        y1: centerY - viewHeightCells / 2,
        x2: centerX + viewWidthCells / 2,
        y2: centerY + viewHeightCells / 2,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [cellSize])

  // 启动动画循环
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [animate])

  // 处理鼠标事件 - 拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    dragState.current = {
      isDragging: true,
      lastX: e.clientX,
      lastY: e.clientY,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current.isDragging) return

    const dx = e.clientX - dragState.current.lastX
    const dy = e.clientY - dragState.current.lastY

    // 像素移动转换为细胞坐标移动
    const cellDx = -dx / cellSize
    const cellDy = -dy / cellSize

    const viewWidth = viewport.x2 - viewport.x1
    const viewHeight = viewport.y2 - viewport.y1

    let newX1 = viewport.x1 + cellDx
    let newY1 = viewport.y1 + cellDy

    // 边界限制
    newX1 = clamp(newX1, worldBounds.minX, worldBounds.maxX - viewWidth)
    newY1 = clamp(newY1, worldBounds.minY, worldBounds.maxY - viewHeight)

    setViewport({
      x1: newX1,
      y1: newY1,
      x2: newX1 + viewWidth,
      y2: newY1 + viewHeight,
    })

    dragState.current.lastX = e.clientX
    dragState.current.lastY = e.clientY
  }

  const handleMouseUp = () => {
    dragState.current.isDragging = false
  }

  const handleMouseLeave = () => {
    dragState.current.isDragging = false
  }

  // 处理滚轮缩放 - 使用非被动事件监听器
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // 鼠标位置的细胞坐标
      const { x: worldCellX, y: worldCellY } = screenToCell(mouseX, mouseY)

      // 计算缩放因子
      const delta = -e.deltaY * ZOOM_SPEED
      const newZoom = clamp(zoomLevel * (1 + delta), 0.5, 3)
      const zoomFactor = newZoom / zoomLevel

      if (zoomFactor === 1) return

      const newCellSize = CELL_SIZE_BASE * newZoom

      // 计算新的视野范围
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const newViewWidth = canvasWidth / newCellSize
      const newViewHeight = canvasHeight / newCellSize

      // 以鼠标位置为中心进行缩放
      const newX1 = worldCellX - (worldCellX - viewport.x1) / zoomFactor
      const newY1 = worldCellY - (worldCellY - viewport.y1) / zoomFactor

      // 边界限制
      let finalX1 = clamp(newX1, worldBounds.minX, worldBounds.maxX - newViewWidth)
      let finalY1 = clamp(newY1, worldBounds.minY, worldBounds.maxY - newViewHeight)

      setViewport({
        x1: finalX1,
        y1: finalY1,
        x2: finalX1 + newViewWidth,
        y2: finalY1 + newViewHeight,
      })

      setZoomLevel(newZoom)
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [viewport, zoomLevel, worldBounds, screenToCell, setViewport, setZoomLevel])

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#050510]">
      {/* 加载屏幕 */}
      <LoadingScreen />

      {/* 扫描线效果 */}
      <div className="scanlines" />

      {/* 噪点纹理 */}
      <div className="noise" />

      {/* 主画布 */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="absolute inset-0"
        style={{
          cursor: dragState.current.isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      />

      {/* UI 层 */}
      {!isLoading && (
        <>
          {/* 统计浮层 */}
          <StatsOverlay
            generation={generation}
            population={population}
            isConnected={isConnected}
            fps={fps}
          />

          {/* 坐标定位器 */}
          <CoordinateNavigator />

          {/* 小地图 */}
          <Minimap />

          {/* 暂停指示器 */}
          {isPaused && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <div className="cyber-panel px-8 py-4">
                <div className="cyber-corner-tl" />
                <div className="cyber-corner-tr" />
                <div className="cyber-corner-bl" />
                <div className="cyber-corner-br" />
                <span
                  className="text-2xl font-bold tracking-[0.5em] cyber-text-pink"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  已暂停
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
