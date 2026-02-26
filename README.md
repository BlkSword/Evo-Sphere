# Evo-Sphere

多人在线实时协作的 Conway's Game of Life 实现。

## 技术栈

### 前端
- React 18 + TypeScript
- Vite (构建工具)
- Zustand (状态管理)
- TailwindCSS (样式)

### 后端
- Go 1.22+
- gorilla/websocket
- Redis 7 (缓存)
- PostgreSQL 16 (持久化)

## 项目结构

```
Evo-Sphere/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── stores/         # Zustand 状态管理
│   │   ├── utils/          # 工具函数
│   │   └── types/          # TypeScript 类型
│   └── package.json
│
├── server/                 # 后端项目
│   ├── cmd/server/         # 入口
│   ├── internal/
│   │   ├── engine/         # 生命游戏引擎
│   │   ├── network/        # WebSocket 网络层
│   │   ├── storage/        # 存储层
│   │   └── config/         # 配置管理
│   └── go.mod
│
├── docker-compose.yml      # Docker 开发环境
└── .env.example            # 环境变量示例
```

## 快速开始

### 1. 启动基础设施

```bash
docker-compose up -d
```

### 2. 启动后端

```bash
cd server
go run cmd/server/main.go
```

### 3. 启动前端

```bash
cd client
npm install
npm run dev
```

### 4. 访问应用

打开浏览器访问 http://localhost:3000

## 二进制协议

| 消息类型 | 代码 | 说明 |
|---------|------|------|
| CELL_UPDATE | 0x01 | 细胞状态更新 |
| VIEWPORT_SUB | 0x02 | 订阅视野 |
| CELL_PLACE | 0x03 | 放置细胞 |
| PLAYER_CURSOR | 0x04 | 玩家光标 |
| SNAPSHOT | 0x05 | 完整快照 |

## 开发说明

### 前端开发

```bash
cd client
npm run dev      # 开发模式
npm run build    # 生产构建
```

### 后端开发

```bash
cd server
go run cmd/server/main.go    # 运行
go build -o server ./cmd/server  # 构建
```

## 环境变量

复制 `.env.example` 到 `.env` 并根据需要修改：

```bash
cp .env.example .env
```
