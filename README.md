# 单词大乱斗 (Word Duel)

这是一个基于 Web 的 1v1 即时对战教育游戏。玩家通过回答单词问题来消除己方的“压力”，并获得攻击对手的机会。

## 核心玩法

1.  **准备阶段**：房主创建房间并上传 CSV 词库（格式：`Word,Definition`）。客人通过房间码加入。
2.  **对战阶段**：
    *   **防守**：答对屏幕中央的单词以消除压力。
    *   **攻击**：答对后获得攻击权，点击手牌中的单词攻击对手。
    *   **胜负**：当一方的待答题目（压力）堆积达到 10 个时，该方判负。

## 技术栈

*   **后端**：Node.js, Express, Socket.IO
*   **前端**：React, Vite
*   **部署**：Docker, Docker Compose

---

## 快速开始 (本地开发)

### 1. 启动后端

你需要安装 Node.js 或者使用 Docker。

**使用 Docker (推荐):**
在项目根目录下运行：
```bash
docker-compose up --build
```
后端服务将在 `http://localhost:3000` 启动。

**或者本地运行 Node.js:**
```bash
cd backend
npm install
npm start
```

### 2. 启动前端

打开一个新的终端窗口：
```bash
cd frontend
npm install
npm run dev
```
前端页面可以通过 `http://localhost:5173` 访问。

---

## 部署指南

本项目支持使用 Docker Compose 进行一键部署。

### 部署步骤

1.  **确保环境**：服务器上安装了 Docker 和 Docker Compose。
2.  **上传代码**：将整个 `Word Duel` 文件夹上传到服务器。
3.  **运行容器**：
    在项目根目录执行：
    ```bash
    docker-compose up -d --build
    ```
    这将以后台模式启动后端服务。

### 注意事项

*   **端口映射**：默认配置下，后端使用 3000 端口。如果你在云服务器部署，请确保安全组/防火墙开放了 3000 端口（用于 WebSocket 连接）。
*   **前端构建**：
    目前的 `docker-compose.yml` 仅包含后端。要部署前端，你可以：
    1.  **构建静态文件**：在 `frontend` 目录下运行 `npm run build`。
    2.  **部署静态文件**：将 `frontend/dist` 目录下的内容部署到 Nginx 或其他 Web 服务器。
    3.  **集成到 Docker**：也可以修改 `docker-compose.yml` 来通过 Nginx 容器服务前端文件。

    *简单的生产环境 Docker Compose 示例（包含前端）:*
    如果是为了简单演示，你可以继续使用 `npm run dev` 或者将前端也加入 Docker。

---

## 词库格式示例 (CSV)

请创建一个 `.csv` 文件，包含表头 `Word` 和 `Definition`：

```csv
Word,Definition
Apple,苹果
Banana,香蕉
Computer,计算机
Docker,容器化平台
```
