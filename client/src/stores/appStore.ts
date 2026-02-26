import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, ThemeConfig } from '../types'
import { THEMES } from '../types'

interface AppStore extends AppState {
  // 主题
  theme: ThemeConfig
  
  // Actions
  setLoading: (loading: boolean) => void
  setPaused: (paused: boolean) => void
  togglePause: () => void
  setShowGrid: (show: boolean) => void
  toggleGrid: () => void
  setShowTrails: (show: boolean) => void
  toggleTrails: () => void
  setShowMinimap: (show: boolean) => void
  toggleMinimap: () => void
  setShowPlayers: (show: boolean) => void
  togglePlayers: () => void
  setTheme: (themeName: string) => void
  setSimulationSpeed: (speed: number) => void
  setZoomLevel: (zoom: number) => void
  resetSettings: () => void
}

const defaultState: AppState = {
  isLoading: true,
  isPaused: false,
  showGrid: true,
  showTrails: true,
  showMinimap: true,
  showPlayers: true,
  currentTheme: 'cyber',
  simulationSpeed: 10,
  zoomLevel: 1,
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...defaultState,
      theme: THEMES.cyber,

      setLoading: (loading) => set({ isLoading: loading }),
      
      setPaused: (paused) => set({ isPaused: paused }),
      
      togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
      
      setShowGrid: (show) => set({ showGrid: show }),
      
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      
      setShowTrails: (show) => set({ showTrails: show }),
      
      toggleTrails: () => set((state) => ({ showTrails: !state.showTrails })),
      
      setShowMinimap: (show) => set({ showMinimap: show }),
      
      toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
      
      setShowPlayers: (show) => set({ showPlayers: show }),
      
      togglePlayers: () => set((state) => ({ showPlayers: !state.showPlayers })),
      
      setTheme: (themeName) => {
        const theme = THEMES[themeName] || THEMES.cyber
        set({ currentTheme: themeName, theme })
        
        // 应用CSS变量
        const root = document.documentElement
        root.style.setProperty('--cell-alive', theme.cellAlive)
        root.style.setProperty('--cell-trail', theme.cellTrail)
        root.style.setProperty('--grid-glow', theme.glowColor)
      },
      
      setSimulationSpeed: (speed) => set({ simulationSpeed: Math.max(1, Math.min(60, speed)) }),
      
      setZoomLevel: (zoom) => set({ zoomLevel: Math.max(0.1, Math.min(5, zoom)) }),
      
      resetSettings: () => set({ ...defaultState, theme: THEMES.cyber }),
    }),
    {
      name: 'evo-sphere-settings',
      partialize: (state) => ({
        showGrid: state.showGrid,
        showTrails: state.showTrails,
        showMinimap: state.showMinimap,
        showPlayers: state.showPlayers,
        currentTheme: state.currentTheme,
        simulationSpeed: state.simulationSpeed,
      }),
    }
  )
)
