import { useEffect, useCallback } from 'react'
import { useCellStore } from '../stores/cellStore'

export function useViewport() {
  const { viewport, setViewport, moveViewport, zoomViewport } = useCellStore()

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      const centerX = (viewport.x1 + viewport.x2) / 2
      const centerY = (viewport.y1 + viewport.y2) / 2
      
      setViewport({
        x1: centerX - width / 2,
        y1: centerY - height / 2,
        x2: centerX + width / 2,
        y2: centerY + height / 2,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [viewport.x1, viewport.x2, viewport.y1, viewport.y2, setViewport])

  // 导航到指定坐标
  const navigateTo = useCallback((x: number, y: number) => {
    const width = viewport.x2 - viewport.x1
    const height = viewport.y2 - viewport.y1
    
    setViewport({
      x1: x - width / 2,
      y1: y - height / 2,
      x2: x + width / 2,
      y2: y + height / 2,
    })
  }, [viewport, setViewport])

  // 重置视野到原点
  const resetViewport = useCallback(() => {
    const width = viewport.x2 - viewport.x1
    const height = viewport.y2 - viewport.y1
    
    setViewport({
      x1: -width / 2,
      y1: -height / 2,
      x2: width / 2,
      y2: height / 2,
    })
  }, [viewport, setViewport])

  return {
    viewport,
    setViewport,
    moveViewport,
    zoomViewport,
    navigateTo,
    resetViewport,
  }
}
