import { useState } from 'react'
import { 
  Play, 
  Pause, 
  Trash2, 
  Shuffle, 
  Grid3X3, 
  Footprints, 
  Map, 
  Users,
  Settings2,
  ChevronUp,
  ChevronDown,
  Zap
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { THEMES } from '../../types'

interface ControlPanelProps {
  onClear?: () => void
  onRandomize?: () => void
  onSpeedChange?: (speed: number) => void
}

export function ControlPanel({ onClear, onRandomize, onSpeedChange }: ControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const {
    isPaused,
    togglePause,
    showGrid,
    toggleGrid,
    showTrails,
    toggleTrails,
    showMinimap,
    toggleMinimap,
    showPlayers,
    togglePlayers,
    simulationSpeed,
    setSimulationSpeed,
    currentTheme,
    setTheme,
  } = useAppStore()

  const handleSpeedChange = (newSpeed: number) => {
    setSimulationSpeed(newSpeed)
    onSpeedChange?.(newSpeed)
  }

  const themes = Object.entries(THEMES)

  return (
    <div className="absolute bottom-4 left-4 z-20">
      <div className="cyber-panel p-4">
        {/* 角标 */}
        <div className="cyber-corner-tl" />
        <div className="cyber-corner-tr" />
        <div className="cyber-corner-bl" />
        <div className="cyber-corner-br" />

        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 cyber-text" />
            <span 
              className="text-sm font-bold tracking-wider cyber-text"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              CONTROL_PANEL
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-cyan-400/60 hover:text-cyan-400 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* 主要控制按钮 */}
        <div className="flex items-center gap-3 mb-4">
          {/* 暂停/继续 */}
          <button
            onClick={togglePause}
            className={`cyber-btn flex items-center gap-2 ${isPaused ? 'cyber-btn-primary' : ''}`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>

          {/* 清空 */}
          <button
            onClick={() => onClear?.()}
            className="cyber-btn cyber-btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>CLEAR</span>
          </button>

          {/* 随机 */}
          <button
            onClick={() => onRandomize?.()}
            className="cyber-btn flex items-center gap-2"
          >
            <Shuffle className="w-4 h-4" />
            <span>RANDOM</span>
          </button>
        </div>

        {/* 速度控制 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400/60" />
              <span 
                className="text-xs text-cyan-400/60"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                SIM_SPEED
              </span>
            </div>
            <span 
              className="text-xs cyber-text w-8 text-right"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {simulationSpeed}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="60"
            value={simulationSpeed}
            onChange={(e) => handleSpeedChange(Number(e.target.value))}
            className="cyber-slider"
          />
        </div>

        <div className="cyber-divider" />

        {/* 显示选项 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={toggleGrid}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 ${
              showGrid 
                ? 'bg-cyan-500/20 border border-cyan-500/50' 
                : 'bg-black/20 border border-transparent hover:border-cyan-500/30'
            }`}
          >
            <Grid3X3 className={`w-4 h-4 ${showGrid ? 'cyber-text' : 'text-cyan-400/40'}`} />
            <span 
              className={`text-xs ${showGrid ? 'cyber-text' : 'text-cyan-400/40'}`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              GRID
            </span>
          </button>

          <button
            onClick={toggleTrails}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 ${
              showTrails 
                ? 'bg-cyan-500/20 border border-cyan-500/50' 
                : 'bg-black/20 border border-transparent hover:border-cyan-500/30'
            }`}
          >
            <Footprints className={`w-4 h-4 ${showTrails ? 'cyber-text' : 'text-cyan-400/40'}`} />
            <span 
              className={`text-xs ${showTrails ? 'cyber-text' : 'text-cyan-400/40'}`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              TRAILS
            </span>
          </button>

          <button
            onClick={toggleMinimap}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 ${
              showMinimap 
                ? 'bg-cyan-500/20 border border-cyan-500/50' 
                : 'bg-black/20 border border-transparent hover:border-cyan-500/30'
            }`}
          >
            <Map className={`w-4 h-4 ${showMinimap ? 'cyber-text' : 'text-cyan-400/40'}`} />
            <span 
              className={`text-xs ${showMinimap ? 'cyber-text' : 'text-cyan-400/40'}`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              MINIMAP
            </span>
          </button>

          <button
            onClick={togglePlayers}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 ${
              showPlayers 
                ? 'bg-cyan-500/20 border border-cyan-500/50' 
                : 'bg-black/20 border border-transparent hover:border-cyan-500/30'
            }`}
          >
            <Users className={`w-4 h-4 ${showPlayers ? 'cyber-text' : 'text-cyan-400/40'}`} />
            <span 
              className={`text-xs ${showPlayers ? 'cyber-text' : 'text-cyan-400/40'}`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              PLAYERS
            </span>
          </button>
        </div>

        {/* 展开的高级选项 */}
        {isExpanded && (
          <>
            <div className="cyber-divider" />
            
            {/* 主题选择 */}
            <div className="mb-4">
              <span 
                className="text-xs text-cyan-400/60 block mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                THEME
              </span>
              <div className="grid grid-cols-2 gap-2">
                {themes.map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`px-3 py-2 rounded text-xs transition-all duration-200 ${
                      currentTheme === key
                        ? 'bg-cyan-500/30 border border-cyan-500 cyber-text'
                        : 'bg-black/20 border border-transparent hover:border-cyan-500/30 text-cyan-400/60'
                    }`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 操作提示 */}
            <div className="cyber-divider" />
            <div className="space-y-1">
              <span 
                className="text-xs text-cyan-400/40 block mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                CONTROLS
              </span>
              <div className="flex justify-between text-xs text-cyan-400/40" style={{ fontFamily: 'var(--font-mono)' }}>
                <span>DRAG</span>
                <span>MOVE VIEW</span>
              </div>
              <div className="flex justify-between text-xs text-cyan-400/40" style={{ fontFamily: 'var(--font-mono)' }}>
                <span>SCROLL</span>
                <span>ZOOM</span>
              </div>
              <div className="flex justify-between text-xs text-cyan-400/40" style={{ fontFamily: 'var(--font-mono)' }}>
                <span>CLICK</span>
                <span>PLACE CELL</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
