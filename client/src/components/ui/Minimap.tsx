import { useRef, useEffect, useState } from 'react'
import { Map, Maximize2, Minimize2 } from 'lucide-react'
import { useCellStore } from '../../stores/cellStore'
import { useAppStore } from '../../stores/appStore'
import { useMobile } from '../../hooks'

const UPDATE_INTERVAL = 500 // 更新间隔(ms)

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { cells, viewport, worldBounds, setViewport } = useCellStore()
  const { showMinimap } = useAppStore()
  const { isMobile } = useMobile()
  const [isExpanded, setIsExpanded] = useState(false)
  const [cellPoints, setCellPoints] = useState<{ x: number; y: number; age: number }[]>([])
  
  // 移动端使用更小的尺寸
  const MOBILE_MINIMAP_SIZE = 120
  const DESKTOP_MINIMAP_SIZE = 180
  const MINIMAP_SIZE = isMobile ? MOBILE_MINIMAP_SIZE : DESKTOP_MINIMAP_SIZE

  const displaySize = isExpanded ? Math.floor(MINIMAP_SIZE * 1.5) : MINIMAP_SIZE
  const worldWidth = worldBounds.maxX - worldBounds.minX
  const worldHeight = worldBounds.maxY - worldBounds.minY

  // 优化：节流更新细胞点
  useEffect(() => {
    const interval = setInterval(() => {
      const points: { x: number; y: number; age: number }[] = []
      cells.forEach((age, key) => {
        const [x, y] = key.split(',').map(Number)
        points.push({ x, y, age })
      })
      setCellPoints(points)
    }, UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [cells])

  // 渲染小地图
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !showMinimap) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布大小
    canvas.width = displaySize
    canvas.height = displaySize

    // 清空背景
    ctx.fillStyle = 'rgba(10, 10, 26, 0.9)'
    ctx.fillRect(0, 0, displaySize, displaySize)

    // 绘制世界边界
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, displaySize, displaySize)

    // 绘制网格
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)'
    ctx.lineWidth = 0.5
    const gridSize = displaySize / 10
    for (let i = 0; i <= 10; i++) {
      const pos = i * gridSize
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, displaySize)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(displaySize, pos)
      ctx.stroke()
    }

    // 绘制中心点 (世界中心 500, 500)
    const centerX = (500 / worldWidth) * displaySize
    const centerY = (500 / worldHeight) * displaySize
    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 2, 0, Math.PI * 2)
    ctx.fill()

    // 绘制细胞点
    cellPoints.forEach((point) => {
      const screenX = ((point.x - worldBounds.minX) / worldWidth) * displaySize
      const screenY = ((point.y - worldBounds.minY) / worldHeight) * displaySize

      // 根据细胞年龄调整颜色
      const intensity = Math.min(point.age / 10, 1)
      const r = Math.floor(0 * (1 - intensity) + 0 * intensity)
      const g = Math.floor(255 * (1 - intensity) + 136 * intensity)
      const b = Math.floor(136 * (1 - intensity) + 255 * intensity)

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`
      ctx.fillRect(screenX - 1, screenY - 1, 2, 2)
    })

    // 绘制视野框
    const vpX = ((viewport.x1 - worldBounds.minX) / worldWidth) * displaySize
    const vpY = ((viewport.y1 - worldBounds.minY) / worldHeight) * displaySize
    const vpW = ((viewport.x2 - viewport.x1) / worldWidth) * displaySize
    const vpH = ((viewport.y2 - viewport.y1) / worldHeight) * displaySize

    ctx.strokeStyle = '#00f0ff'
    ctx.lineWidth = 1.5
    ctx.strokeRect(vpX, vpY, vpW, vpH)

    // 视野框发光效果
    ctx.shadowColor = '#00f0ff'
    ctx.shadowBlur = 10
    ctx.strokeRect(vpX, vpY, vpW, vpH)
    ctx.shadowBlur = 0

    // 填充视野区域
    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)'
    ctx.fillRect(vpX, vpY, vpW, vpH)
  }, [cellPoints, viewport, displaySize, worldBounds, showMinimap, worldWidth, worldHeight])

  // 点击小地图跳转
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // 转换回世界坐标 (细胞坐标)
    const worldX = (clickX / displaySize) * worldWidth + worldBounds.minX
    const worldY = (clickY / displaySize) * worldHeight + worldBounds.minY

    // 更新视野（以点击点为中心）
    const vpWidth = viewport.x2 - viewport.x1
    const vpHeight = viewport.y2 - viewport.y1

    setViewport({
      x1: worldX - vpWidth / 2,
      y1: worldY - vpHeight / 2,
      x2: worldX + vpWidth / 2,
      y2: worldY + vpHeight / 2,
    })
  }

  if (!showMinimap) return null

  return (
    <div className={`absolute z-20 ${isMobile ? 'bottom-2 right-2' : 'bottom-4 right-4'}`}>
      <div className={`cyber-panel ${isMobile ? 'p-2' : 'p-3'}`}>
        {/* 角标 */}
        <div className="cyber-corner-tl" />
        <div className="cyber-corner-tr" />
        <div className="cyber-corner-bl" />
        <div className="cyber-corner-br" />

        {/* 标题栏 */}
        <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
          <div className="flex items-center gap-2">
            <Map className={`cyber-text ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            {!isMobile && (
              <span
                className="text-xs font-bold tracking-wider cyber-text"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                世界概览
              </span>
            )}
          </div>
          {!isMobile && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-cyan-400/60 hover:text-cyan-400 transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* 小地图画布 */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="cursor-crosshair rounded bg-black/50"
          style={{
            width: displaySize,
            height: displaySize,
            imageRendering: 'pixelated'
          }}
        />

        {/* 提示 */}
        {!isMobile && (
          <p
            className="text-[10px] text-cyan-400/40 text-center mt-2"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            点击跳转
          </p>
        )}
      </div>
    </div>
  )
}
