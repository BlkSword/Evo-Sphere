import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

// 应用初始化
const initApp = () => {
  // 设置CSS变量
  const root = document.documentElement
  
  // 设置默认主题色
  root.style.setProperty('--cyber-cyan', '#00f0ff')
  root.style.setProperty('--cyber-pink', '#ff00a0')
  root.style.setProperty('--cyber-purple', '#8b5cf6')
  root.style.setProperty('--cyber-green', '#00ff88')
  root.style.setProperty('--cyber-yellow', '#ffd700')
  root.style.setProperty('--cyber-orange', '#ff6b35')
  
  // 渲染应用
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', initApp)

// 如果DOM已经加载完成，直接初始化
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initApp()
}
