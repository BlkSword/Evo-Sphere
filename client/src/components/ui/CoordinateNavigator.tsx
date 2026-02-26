import { useState } from 'react'
import { Crosshair, Navigation, Home } from 'lucide-react'
import { useCellStore } from '../../stores/cellStore'

export function CoordinateNavigator() {
  const { viewport, setViewport, worldBounds } = useCellStore()
  const [inputX, setInputX] = useState('')
  const [inputY, setInputY] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  // 当前视野中心 (细胞坐标)
  const centerX = Math.floor((viewport.x1 + viewport.x2) / 2)
  const centerY = Math.floor((viewport.y1 + viewport.y2) / 2)

  const handleNavigate = () => {
    const x = parseInt(inputX)
    const y = parseInt(inputY)

    if (isNaN(x) || isNaN(y)) return

    const vpWidth = viewport.x2 - viewport.x1
    const vpHeight = viewport.y2 - viewport.y1

    // 限制在世界范围内
    const clampedX = Math.max(vpWidth / 2, Math.min(x, worldBounds.maxX - vpWidth / 2))
    const clampedY = Math.max(vpHeight / 2, Math.min(y, worldBounds.maxY - vpHeight / 2))

    setViewport({
      x1: clampedX - vpWidth / 2,
      y1: clampedY - vpHeight / 2,
      x2: clampedX + vpWidth / 2,
      y2: clampedY + vpHeight / 2,
    })
  }

  const handleGoHome = () => {
    const vpWidth = viewport.x2 - viewport.x1
    const vpHeight = viewport.y2 - viewport.y1

    // 回到世界中心 (500, 500)
    setViewport({
      x1: 500 - vpWidth / 2,
      y1: 500 - vpHeight / 2,
      x2: 500 + vpWidth / 2,
      y2: 500 + vpHeight / 2,
    })

    setInputX('')
    setInputY('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNavigate()
    }
  }

  // 快速跳转位置 (细胞坐标)
  const quickPositions = [
    { label: '东北', x: 750, y: 250 },
    { label: '北', x: 500, y: 250 },
    { label: '西北', x: 250, y: 250 },
    { label: '东', x: 750, y: 500 },
    { label: '中心', x: 500, y: 500 },
    { label: '西', x: 250, y: 500 },
    { label: '东南', x: 750, y: 750 },
    { label: '南', x: 500, y: 750 },
    { label: '西南', x: 250, y: 750 },
  ]

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="cyber-panel p-3">
        {/* 角标 */}
        <div className="cyber-corner-tl" />
        <div className="cyber-corner-tr" />
        <div className="cyber-corner-bl" />
        <div className="cyber-corner-br" />

        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 cyber-text" />
            <span
              className="text-xs font-bold tracking-wider cyber-text"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              坐标导航
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-cyan-400/60 hover:text-cyan-400 transition-colors"
          >
            {isExpanded ? (
              <span className="text-xs">[-]</span>
            ) : (
              <span className="text-xs">[+]</span>
            )}
          </button>
        </div>

        {/* 当前坐标显示 */}
        <div className="flex items-center gap-4 mb-3 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
          <div className="flex items-center gap-1">
            <span className="text-cyan-400/40">X:</span>
            <span className="cyber-text">{centerX}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-cyan-400/40">Y:</span>
            <span className="cyber-text">{centerY}</span>
          </div>
        </div>

        {/* 展开时的输入控件 */}
        {isExpanded && (
          <>
            <div className="cyber-divider" />

            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs text-cyan-400/60 w-4"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  X
                </span>
                <input
                  type="number"
                  value={inputX}
                  onChange={(e) => setInputX(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={centerX.toString()}
                  className="cyber-input flex-1 text-xs"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="text-xs text-cyan-400/60 w-4"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Y
                </span>
                <input
                  type="number"
                  value={inputY}
                  onChange={(e) => setInputY(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={centerY.toString()}
                  className="cyber-input flex-1 text-xs"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleNavigate}
                  className="cyber-btn cyber-btn-primary flex-1 flex items-center justify-center gap-2 text-xs py-1.5"
                >
                  <Navigation className="w-3 h-3" />
                  <span>跳转</span>
                </button>

                <button
                  onClick={handleGoHome}
                  className="cyber-btn flex items-center justify-center gap-2 text-xs py-1.5 px-3"
                  title="回到中心"
                >
                  <Home className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 快速跳转 */}
            <div className="mt-3 pt-3 border-t border-cyan-500/20">
              <span
                className="text-xs text-cyan-400/40 block mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                快速跳转
              </span>
              <div className="grid grid-cols-3 gap-1">
                {quickPositions.map((pos) => (
                  <button
                    key={pos.label}
                    onClick={() => {
                      const vpWidth = viewport.x2 - viewport.x1
                      const vpHeight = viewport.y2 - viewport.y1
                      setViewport({
                        x1: pos.x - vpWidth / 2,
                        y1: pos.y - vpHeight / 2,
                        x2: pos.x + vpWidth / 2,
                        y2: pos.y + vpHeight / 2,
                      })
                    }}
                    className="px-1 py-1 text-xs rounded bg-black/20 hover:bg-cyan-500/20
                               border border-transparent hover:border-cyan-500/30
                               text-cyan-400/60 hover:text-cyan-400 transition-all duration-200"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
