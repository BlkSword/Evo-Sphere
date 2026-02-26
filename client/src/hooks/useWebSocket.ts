import { useEffect, useRef, useCallback, useState } from 'react'
import { useCellStore } from '../stores/cellStore'
import { usePlayerStore, initLocalPlayer } from '../stores/playerStore'
import { useAppStore } from '../stores/appStore'
import { MessageType, type CellDiff } from '../types'

// 动态获取 WebSocket URL
const getWebSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    // 如果不是 localhost，说明是生产环境，使用相对路径
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      return `${protocol}//${host}/ws`
    }
    // 开发环境直接连接后端
    return `${protocol}//localhost:8080/ws`
  }
  return 'ws://localhost:8080/ws'
}

const RECONNECT_DELAY = 1000
const MAX_RECONNECT_ATTEMPTS = 10

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const { 
    applyDiffs, 
    setCells, 
    setGeneration, 
    setPopulation,
    viewport,
  } = useCellStore()
  
  const { 
    updatePlayerCursor, 
    removePlayer,
    setLocalPlayerId,
    localPlayerId,
  } = usePlayerStore()
  
  const { setLoading } = useAppStore()

  // 发送视野订阅
  const subscribeViewport = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return

    const buffer = new ArrayBuffer(17)
    const view = new DataView(buffer)
    view.setUint8(0, MessageType.VIEWPORT_SUB)
    view.setInt32(1, viewport.x1, true)
    view.setInt32(5, viewport.y1, true)
    view.setInt32(9, viewport.x2, true)
    view.setInt32(13, viewport.y2, true)
    wsRef.current.send(buffer)
  }, [viewport])

  // 连接WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const wsUrl = getWebSocketUrl()
      const ws = new WebSocket(wsUrl)
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        setIsConnected(true)
        reconnectAttempts.current = 0
        
        // 初始化本地玩家
        const playerId = initLocalPlayer()
        if (playerId) {
          setLocalPlayerId(playerId)
        }

        // 发送初始视野订阅
        subscribeViewport()

        // 启动心跳
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const buffer = new ArrayBuffer(1)
            const view = new DataView(buffer)
            view.setUint8(0, 0x00) // HEARTBEAT
            ws.send(buffer)
          }
        }, 30000)
      }

      ws.onclose = () => {
        setIsConnected(false)
        
        // 清除心跳
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }

        // 重连逻辑
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY)
        }
      }

      ws.onerror = () => {
        ws.close()
      }

      ws.onmessage = (event) => {
        if (!(event.data instanceof ArrayBuffer)) return

        const buffer = event.data as ArrayBuffer
        const view = new DataView(buffer)
        const msgType = view.getUint8(0)

        switch (msgType) {
          case MessageType.CELL_UPDATE: {
            const count = view.getUint16(1, true)
            const diffs: CellDiff[] = []

            for (let i = 0; i < count; i++) {
              const offset = 3 + i * 9
              const x = view.getInt32(offset, true)
              const y = view.getInt32(offset + 4, true)
              const state = view.getUint8(offset + 8) as 0 | 1
              const age = view.getUint8(offset + 9)
              diffs.push({ x, y, state, age })
            }

            applyDiffs(diffs)
            break
          }

          case MessageType.SNAPSHOT: {
            const generation = view.getUint32(1, true)
            const population = view.getUint32(5, true)
            const count = view.getUint16(9, true)
            const cells = new Map<string, number>()

            for (let i = 0; i < count; i++) {
              const offset = 11 + i * 9
              const x = view.getInt32(offset, true)
              const y = view.getInt32(offset + 4, true)
              const age = view.getUint8(offset + 8)
              cells.set(`${x},${y}`, age)
            }

            setCells(cells)
            setGeneration(generation)
            setPopulation(population)
            
            // 加载完成后关闭加载屏幕
            setTimeout(() => setLoading(false), 500)
            break
          }

          case MessageType.PLAYER_CURSOR: {
            const playerIdLen = view.getUint8(1)
            const playerIdBytes = new Uint8Array(buffer, 2, playerIdLen)
            const playerId = new TextDecoder().decode(playerIdBytes)
            
            const cursorX = view.getInt32(2 + playerIdLen, true)
            const cursorY = view.getInt32(6 + playerIdLen, true)
            
            if (playerId !== localPlayerId) {
              updatePlayerCursor(playerId, { x: cursorX, y: cursorY })
            }
            break
          }

          case MessageType.PLAYER_JOIN: {
            // 处理玩家加入
            break
          }

          case MessageType.PLAYER_LEAVE: {
            const playerIdLen = view.getUint8(1)
            const playerIdBytes = new Uint8Array(buffer, 2, playerIdLen)
            const playerId = new TextDecoder().decode(playerIdBytes)
            removePlayer(playerId)
            break
          }

          case MessageType.WORLD_CONFIG: {
            // 处理世界配置
            break
          }
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('WebSocket connection error:', error)
    }
  }, [applyDiffs, setCells, setGeneration, setPopulation, updatePlayerCursor, removePlayer, localPlayerId, setLocalPlayerId, subscribeViewport, setLoading])

  // 发送消息
  const sendMessage = useCallback((data: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data)
    }
  }, [])

  // 监听视野变化，发送订阅更新
  useEffect(() => {
    if (isConnected) {
      subscribeViewport()
    }
  }, [viewport, isConnected, subscribeViewport])

  // 初始化连接
  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      wsRef.current?.close()
    }
  }, [connect])

  return { isConnected, sendMessage }
}
