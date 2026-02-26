import { create } from 'zustand'
import type { Player, Coord } from '../types'
import { generatePlayerColor } from '../utils/math'

interface PlayerStore {
  players: Map<string, Player>
  localPlayerId: string | null
  localPlayerName: string
  setLocalPlayerId: (id: string) => void
  setLocalPlayerName: (name: string) => void
  updatePlayer: (player: Player) => void
  updatePlayerCursor: (playerId: string, cursor: Coord) => void
  removePlayer: (playerId: string) => void
  clearPlayers: () => void
}

// 生成随机玩家ID
const generatePlayerId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

// 生成随机玩家名
const generatePlayerName = () => {
  const adjectives = ['Cyber', 'Neon', 'Digital', 'Quantum', 'Neural', 'Hyper', 'Meta', 'Nano']
  const nouns = ['Walker', 'Runner', 'Ghost', 'Shadow', 'Specter', 'Entity', 'Mind', 'Soul']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj}_${noun}_${Math.floor(Math.random() * 999)}`
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  players: new Map(),
  localPlayerId: null,
  localPlayerName: generatePlayerName(),

  setLocalPlayerId: (id) => set({ localPlayerId: id }),

  setLocalPlayerName: (name) => set({ localPlayerName: name }),

  updatePlayer: (player) => {
    const players = new Map(get().players)
    players.set(player.id, {
      ...player,
      lastSeen: Date.now(),
    })
    set({ players })
  },

  updatePlayerCursor: (playerId, cursor) => {
    if (playerId === get().localPlayerId) return

    const players = new Map(get().players)
    const existing = players.get(playerId)
    
    if (existing) {
      players.set(playerId, { 
        ...existing, 
        cursor,
        lastSeen: Date.now(),
      })
    } else {
      players.set(playerId, { 
        id: playerId, 
        name: `User_${playerId.slice(0, 6)}`,
        cursor, 
        color: generatePlayerColor(),
        isOnline: true,
        lastSeen: Date.now(),
      })
    }
    set({ players })
  },

  removePlayer: (playerId) => {
    const players = new Map(get().players)
    players.delete(playerId)
    set({ players })
  },

  clearPlayers: () => set({ players: new Map() }),
}))

// 初始化本地玩家ID
export const initLocalPlayer = () => {
  const store = usePlayerStore.getState()
  if (!store.localPlayerId) {
    const id = generatePlayerId()
    store.setLocalPlayerId(id)
  }
  return store.localPlayerId
}
