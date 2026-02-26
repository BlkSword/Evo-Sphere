import { Activity, Users, Zap, Grid3X3, Clock } from 'lucide-react'
import { useCellStore } from '../../stores/cellStore'
import { usePlayerStore } from '../../stores/playerStore'
import { formatNumber } from '../../utils/math'

interface StatsOverlayProps {
  generation: number
  population: number
  isConnected: boolean
  fps?: number
}

export function StatsOverlay({ generation, population, isConnected, fps = 60 }: StatsOverlayProps) {
  const { viewport, zoomLevel } = useCellStore()
  const { players } = usePlayerStore()

  // 视野中心 (细胞坐标)
  const centerX = Math.floor((viewport.x1 + viewport.x2) / 2)
  const centerY = Math.floor((viewport.y1 + viewport.y2) / 2)

  return (
    <div className="absolute top-4 left-4 z-20">
      <div className="cyber-panel p-4 min-w-[260px]">
        {/* 角标 */}
        <div className="cyber-corner-tl" />
        <div className="cyber-corner-tr" />
        <div className="cyber-corner-bl" />
        <div className="cyber-corner-br" />

        {/* 标题 */}
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 cyber-text-green" />
          <span
            className="text-sm font-bold tracking-wider cyber-text"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            系统状态
          </span>
        </div>

        {/* 连接状态 */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs text-cyan-400/60"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            连接状态
          </span>
          <div className="flex items-center gap-2">
            <span className={`cyber-indicator ${isConnected ? 'online' : 'offline'}`} />
            <span
              className={`text-xs ${isConnected ? 'cyber-text-green' : 'cyber-text-pink'}`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {isConnected ? '在线' : '离线'}
            </span>
          </div>
        </div>

        <div className="cyber-divider" />

        {/* 统计数据 */}
        <div className="space-y-3">
          {/* 世代 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400/60" />
              <span
                className="text-xs text-cyan-400/60"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                当前世代
              </span>
            </div>
            <span
              className="text-sm font-bold cyber-text"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {formatNumber(generation)}
            </span>
          </div>

          {/* 人口 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-3.5 h-3.5 text-cyan-400/60" />
              <span
                className="text-xs text-cyan-400/60"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                存活细胞
              </span>
            </div>
            <span
              className="text-sm font-bold cyber-text-green"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {formatNumber(population)}
            </span>
          </div>

          {/* 在线玩家 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-cyan-400/60" />
              <span
                className="text-xs text-cyan-400/60"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                在线观测者
              </span>
            </div>
            <span
              className="text-sm font-bold cyber-text"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {players.size + 1}
            </span>
          </div>

          {/* FPS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400/60" />
              <span
                className="text-xs text-cyan-400/60"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                帧率
              </span>
            </div>
            <span
              className={`text-sm font-bold ${fps >= 55 ? 'cyber-text-green' : fps >= 30 ? 'text-yellow-400' : 'cyber-text-pink'}`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {fps}
            </span>
          </div>
        </div>

        <div className="cyber-divider" />

        {/* 坐标信息 (细胞坐标) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span
              className="text-xs text-cyan-400/60"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              视野中心 X
            </span>
            <span
              className="text-xs font-mono cyber-text"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {centerX}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span
              className="text-xs text-cyan-400/60"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              视野中心 Y
            </span>
            <span
              className="text-xs font-mono cyber-text"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {centerY}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span
              className="text-xs text-cyan-400/60"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              缩放级别
            </span>
            <span
              className="text-xs font-mono cyber-text"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {zoomLevel.toFixed(1)}x
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
