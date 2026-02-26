import { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/appStore'

const LOADING_TEXTS = [
  '正在初始化神经网络...',
  '正在连接进化球...',
  '正在同步全局意识...',
  '正在加载细胞矩阵...',
  '正在建立量子纠缠...',
  '正在校准空间坐标...',
  '欢迎来到进化世界',
]

export function LoadingScreen() {
  const { isLoading, setLoading } = useAppStore()
  const [progress, setProgress] = useState(0)
  const [textIndex, setTextIndex] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isLoading) return

    // 进度条动画
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setTimeout(() => setLoading(false), 500)
          return 100
        }
        return prev + Math.random() * 3 + 0.5
      })
    }, 100)

    // 文本切换
    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length)
    }, 800)

    // 加载点动画
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 300)

    return () => {
      clearInterval(progressInterval)
      clearInterval(textInterval)
      clearInterval(dotsInterval)
    }
  }, [isLoading, setLoading])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050510]">
      {/* 背景网格 */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* 发光装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(0, 255, 136, 0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="relative">
          <h1
            className="text-6xl md:text-8xl font-bold tracking-wider"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--cyber-cyan)',
              textShadow: '0 0 30px rgba(0, 240, 255, 0.5), 0 0 60px rgba(0, 240, 255, 0.3)',
            }}
          >
            进化
          </h1>
          <h1
            className="text-6xl md:text-8xl font-bold tracking-wider -mt-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--cyber-green)',
              textShadow: '0 0 30px rgba(0, 255, 136, 0.5), 0 0 60px rgba(0, 255, 136, 0.3)',
            }}
          >
            球体
          </h1>

          {/* 装饰线 */}
          <div
            className="absolute -bottom-2 left-0 right-0 h-0.5"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--cyber-cyan), var(--cyber-green), transparent)',
            }}
          />
        </div>

        {/* 副标题 */}
        <p
          className="text-lg tracking-[0.3em] text-cyan-400/70"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          多人生命游戏模拟器
        </p>

        {/* 加载动画 */}
        <div className="cyber-loader mt-8" />

        {/* 状态文本 */}
        <div className="h-8 flex items-center justify-center">
          <p
            className="text-sm tracking-wider cyber-text-dim"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {LOADING_TEXTS[textIndex]}{dots}
          </p>
        </div>

        {/* 进度条 */}
        <div className="w-80 relative">
          {/* 背景 */}
          <div
            className="h-1 w-full rounded-full overflow-hidden"
            style={{ background: 'rgba(0, 240, 255, 0.1)' }}
          >
            {/* 进度 */}
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: 'linear-gradient(90deg, var(--cyber-cyan), var(--cyber-green))',
                boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
              }}
            />
          </div>

          {/* 百分比 */}
          <p
            className="absolute -bottom-6 right-0 text-xs cyber-text"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {Math.floor(Math.min(progress, 100))}%
          </p>
        </div>

        {/* 版本信息 */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 text-xs text-cyan-600/50" style={{ fontFamily: 'var(--font-mono)' }}>
          <span>版本 1.0.0</span>
          <span>构建 2024.02.26</span>
          <span>第三阶段</span>
        </div>

        {/* 角标装饰 */}
        <div className="cyber-corner-tl top-8 left-8" />
        <div className="cyber-corner-tr top-8 right-8" />
        <div className="cyber-corner-bl bottom-8 left-8" />
        <div className="cyber-corner-br bottom-8 right-8" />
      </div>
    </div>
  )
}
