import { useState } from 'react'
import { 
  Play, 
  Pause, 
  Trash2, 
  Shuffle, 
  Grid3X3, 
  Footprints, 
  Map, 
  Settings,
  X,
  ZoomIn,
  ZoomOut,
  Home
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useCellStore } from '../../stores/cellStore'
import { clamp } from '../../utils/math'

const ZOOM_STEP = 0.3

interface MobileControlsProps {
  onClear?: () => void
  onRandomize?: () => void
}

export function MobileControls({ onClear, onRandomize }: MobileControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const {
    isPaused,
    togglePause,
    showGrid,
    toggleGrid,
    showTrails,
    toggleTrails,
    showMinimap,
    toggleMinimap,
    simulationSpeed,
    setSimulationSpeed,
  } = useAppStore()

  const { 
    zoomLevel, 
    setZoomLevel, 
    setViewport, 
    viewport, 
    worldBounds 
  } = useCellStore()

  const handleZoomIn = () => {
    const newZoom = clamp(zoomLevel + ZOOM_STEP, 0.5, 3)
    handleZoom(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = clamp(zoomLevel - ZOOM_STEP, 0.5, 3)
    handleZoom(newZoom)
  }

  const handleZoom = (newZoom: number) => {
    const vpWidth = viewport.x2 - viewport.x1
    const vpHeight = viewport.y2 - viewport.y1
    const centerX = (viewport.x1 + viewport.x2) / 2
    const centerY = (viewport.y1 + viewport.y2) / 2
    
    const newVpWidth = (vpWidth * zoomLevel) / newZoom
    const newVpHeight = (vpHeight * zoomLevel) / newZoom
    
    let newX1 = centerX - newVpWidth / 2
    let newY1 = centerY - newVpHeight / 2
    
    newX1 = clamp(newX1, worldBounds.minX, worldBounds.maxX - newVpWidth)
    newY1 = clamp(newY1, worldBounds.minY, worldBounds.maxY - newVpHeight)
    
    setViewport({
      x1: newX1,
      y1: newY1,
      x2: newX1 + newVpWidth,
      y2: newY1 + newVpHeight,
    })
    setZoomLevel(newZoom)
  }

  const handleGoHome = () => {
    const vpWidth = viewport.x2 - viewport.x1
    const vpHeight = viewport.y2 - viewport.y1
    
    setViewport({
      x1: 500 - vpWidth / 2,
      y1: 500 - vpHeight / 2,
      x2: 500 + vpWidth / 2,
      y2: 500 + vpHeight / 2,
    })
  }

  return (
    <>
      {/* 浮动操作按钮组 - 左侧 */}
      <div className="fixed left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        {/* 主页按钮 */}
        <button
          onClick={handleGoHome}
          className="w-10 h-10 rounded-full cyber-panel flex items-center justify-center"
          style={{ touchAction: 'manipulation' }}
        >
          <Home className="w-4 h-4 cyber-text" />
        </button>
        
        {/* 缩放控制 */}
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-full cyber-panel flex items-center justify-center"
          style={{ touchAction: 'manipulation' }}
        >
          <ZoomIn className="w-4 h-4 cyber-text" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-full cyber-panel flex items-center justify-center"
          style={{ touchAction: 'manipulation' }}
        >
          <ZoomOut className="w-4 h-4 cyber-text" />
        </button>
      </div>

      {/* 底部控制栏 */}
      <div className="fixed bottom-3 left-3 right-3 z-20">
        <div className="cyber-panel p-2 flex items-center justify-between gap-2">
          {/* 播放/暂停 */}
          <button
            onClick={togglePause}
            className={`flex-1 h-10 rounded flex items-center justify-center gap-1.5 ${
              isPaused 
                ? 'bg-cyan-500/20 border border-cyan-500/50' 
                : 'bg-black/20 border border-transparent'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {isPaused ? (
              <Play className="w-4 h-4 cyber-text-green" />
            ) : (
              <Pause className="w-4 h-4 cyber-text" />
            )}
            <span className="text-xs cyber-text">{isPaused ? '继续' : '暂停'}</span>
          </button>

          {/* 速度滑块 */}
          <div className="flex-1 flex items-center gap-2 px-2">
            <span className="text-[10px] text-cyan-400/60">{simulationSpeed}x</span>
            <input
              type="range"
              min="1"
              max="60"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: 'linear-gradient(90deg, rgba(0,240,255,0.2), rgba(0,255,136,0.2))',
              }}
            />
          </div>

          {/* 设置按钮 - 打开更多选项 */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-10 h-10 rounded flex items-center justify-center ${
              isOpen 
                ? 'bg-cyan-500/20 border border-cyan-500/50' 
                : 'bg-black/20 border border-transparent'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {isOpen ? (
              <X className="w-4 h-4 cyber-text" />
            ) : (
              <Settings className="w-4 h-4 cyber-text" />
            )}
          </button>
        </div>

        {/* 展开的更多选项 */}
        {isOpen && (
          <div className="cyber-panel p-2 mt-2 grid grid-cols-4 gap-2">
            {/* 网格开关 */}
            <button
              onClick={toggleGrid}
              className={`h-10 rounded flex flex-col items-center justify-center gap-0.5 ${
                showGrid 
                  ? 'bg-cyan-500/20 border border-cyan-500/50' 
                  : 'bg-black/20 border border-transparent'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <Grid3X3 className={`w-3.5 h-3.5 ${showGrid ? 'cyber-text' : 'text-cyan-400/40'}`} />
              <span className={`text-[9px] ${showGrid ? 'cyber-text' : 'text-cyan-400/40'}`}>网格</span>
            </button>

            {/* 拖尾开关 */}
            <button
              onClick={toggleTrails}
              className={`h-10 rounded flex flex-col items-center justify-center gap-0.5 ${
                showTrails 
                  ? 'bg-cyan-500/20 border border-cyan-500/50' 
                  : 'bg-black/20 border border-transparent'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <Footprints className={`w-3.5 h-3.5 ${showTrails ? 'cyber-text' : 'text-cyan-400/40'}`} />
              <span className={`text-[9px] ${showTrails ? 'cyber-text' : 'text-cyan-400/40'}`}>拖尾</span>
            </button>

            {/* 小地图开关 */}
            <button
              onClick={toggleMinimap}
              className={`h-10 rounded flex flex-col items-center justify-center gap-0.5 ${
                showMinimap 
                  ? 'bg-cyan-500/20 border border-cyan-500/50' 
                  : 'bg-black/20 border border-transparent'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <Map className={`w-3.5 h-3.5 ${showMinimap ? 'cyber-text' : 'text-cyan-400/40'}`} />
              <span className={`text-[9px] ${showMinimap ? 'cyber-text' : 'text-cyan-400/40'}`}>地图</span>
            </button>

            {/* 随机生成 */}
            <button
              onClick={onRandomize}
              className="h-10 rounded flex flex-col items-center justify-center gap-0.5 bg-black/20 border border-transparent active:bg-cyan-500/20"
              style={{ touchAction: 'manipulation' }}
            >
              <Shuffle className="w-3.5 h-3.5 text-cyan-400/60" />
              <span className="text-[9px] text-cyan-400/60">随机</span>
            </button>

            {/* 清空 */}
            <button
              onClick={onClear}
              className="h-10 rounded flex flex-col items-center justify-center gap-0.5 bg-black/20 border border-transparent active:bg-pink-500/20 col-span-2"
              style={{ touchAction: 'manipulation' }}
            >
              <Trash2 className="w-3.5 h-3.5 text-pink-400/60" />
              <span className="text-[9px] text-pink-400/60">清空所有细胞</span>
            </button>

            {/* 速度快捷设置 */}
            {[1, 10, 30, 60].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimulationSpeed(speed)}
                className={`h-10 rounded flex items-center justify-center text-[10px] ${
                  simulationSpeed === speed
                    ? 'bg-cyan-500/30 border border-cyan-500 cyber-text'
                    : 'bg-black/20 border border-transparent text-cyan-400/60'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                {speed}x
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
