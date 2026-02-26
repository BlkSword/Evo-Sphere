import { create } from 'zustand'

interface CameraStore {
  position: { x: number; y: number; z: number }
  zoom: number
  setPosition: (position: { x: number; y: number; z: number }) => void
  setZoom: (zoom: number) => void
}

export const useCameraStore = create<CameraStore>((set) => ({
  position: { x: 0, y: 0, z: 100 },
  zoom: 1,

  setPosition: (position) => set({ position }),
  setZoom: (zoom) => set({ zoom }),
}))
