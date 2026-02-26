import { useState } from 'react'
import { Users, User, Eye, EyeOff } from 'lucide-react'
import { usePlayerStore } from '../../stores/playerStore'

export function PlayerList() {
  const { players } = usePlayerStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [showCursors, setShowCursors] = useState(true)

  const playerList = Array.from(players.values())
  const totalPlayers = playerList.length + 1 // +1 for local player

  return (
    <div className="absolute top-4 right-4 z-20 mt-0" style={{ marginTop: '140px' }}>
      <div className="cyber-panel p-3 min-w-[180px]">
        {/* 角标 */}
        <div className="cyber-corner-tl" />
        <div className="cyber-corner-tr" />
        <div className="cyber-corner-bl" />
        <div className="cyber-corner-br" />

        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 cyber-text" />
            <span 
              className="text-xs font-bold tracking-wider cyber-text"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              OPERATORS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCursors(!showCursors)}
              className="text-cyan-400/60 hover:text-cyan-400 transition-colors"
              title={showCursors ? 'Hide cursors' : 'Show cursors'}
            >
              {showCursors ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
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
        </div>

        {/* 在线人数 */}
        <div className="flex items-center justify-between mb-2">
          <span 
            className="text-xs text-cyan-400/60"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            ONLINE
          </span>
          <span 
            className="text-sm font-bold cyber-text-green"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {totalPlayers}
          </span>
        </div>

        {/* 玩家列表 */}
        {isExpanded && (
          <>
            <div className="cyber-divider" />
            
            <div className="space-y-2 mt-3 max-h-[200px] overflow-y-auto">
              {/* 本地玩家 */}
              <div 
                className="flex items-center gap-2 p-2 rounded bg-cyan-500/10 border border-cyan-500/30"
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    background: '#00ff88',
                    boxShadow: '0 0 8px #00ff88'
                  }}
                />
                <User className="w-3.5 h-3.5 cyber-text-green" />
                <span 
                  className="text-xs cyber-text-green flex-1 truncate"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  YOU
                </span>
                <span className="cyber-tag text-[10px]">LOCAL</span>
              </div>

              {/* 其他玩家 */}
              {playerList.map((player) => (
                <div 
                  key={player.id}
                  className="flex items-center gap-2 p-2 rounded bg-black/20 
                             border border-transparent hover:border-cyan-500/20
                             transition-all duration-200"
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      background: player.color,
                      boxShadow: `0 0 8px ${player.color}`
                    }}
                  />
                  <User className="w-3.5 h-3.5 text-cyan-400/60" />
                  <span 
                    className="text-xs text-cyan-400/80 flex-1 truncate"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {player.name || `User_${player.id.slice(0, 6)}`}
                  </span>
                  {showCursors && (
                    <span 
                      className="text-[10px] text-cyan-400/40"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {Math.floor(player.cursor.x)},{Math.floor(player.cursor.y)}
                    </span>
                  )}
                </div>
              ))}

              {playerList.length === 0 && (
                <div 
                  className="text-center py-4 text-xs text-cyan-400/30"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  NO OTHER OPERATORS
                </div>
              )}
            </div>
          </>
        )}

        {/* 提示信息 */}
        {isExpanded && playerList.length > 0 && (
          <div className="mt-3 pt-3 border-t border-cyan-500/20">
            <p 
              className="text-[10px] text-cyan-400/40 text-center"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              PLAYERS CAN INTERACT IN REAL-TIME
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
