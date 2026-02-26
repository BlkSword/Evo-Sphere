import { useState, useEffect, useCallback } from 'react'

export interface MobileState {
  isMobile: boolean
  isTablet: boolean
  isPortrait: boolean
  isLandscape: boolean
  width: number
  height: number
}

export function useMobile(): MobileState {
  const [state, setState] = useState<MobileState>({
    isMobile: false,
    isTablet: false,
    isPortrait: true,
    isLandscape: false,
    width: window.innerWidth,
    height: window.innerHeight,
  })

  const updateState = useCallback(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const isMobile = width < 768
    const isTablet = width >= 768 && width < 1024
    const isPortrait = height > width
    const isLandscape = width > height

    setState({
      isMobile,
      isTablet,
      isPortrait,
      isLandscape,
      width,
      height,
    })
  }, [])

  useEffect(() => {
    updateState()
    window.addEventListener('resize', updateState)
    window.addEventListener('orientationchange', updateState)
    
    return () => {
      window.removeEventListener('resize', updateState)
      window.removeEventListener('orientationchange', updateState)
    }
  }, [updateState])

  return state
}

// 检测是否为触摸设备
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        (window.DocumentTouch && document instanceof window.DocumentTouch)
      )
    }
    checkTouch()
  }, [])

  return isTouch
}
