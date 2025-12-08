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

### 1. 启动项目 (全栈 Docker)

只需一条命令即可启动前后端：

```bash
docker-compose up --build
```
- **前端**：`http://localhost` (端口 80)
- **后端**：`http://localhost:3000` (API 也通过前端代理访问)

### 2. 本地开发模式

如果你想单独运行前端进行开发：

1. **启动后端**：`docker-compose up backend`
2. **启动前端**：
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   访问 `http://localhost:5173`。已配置代理转发到后端。


---

## 部署指南

本项目支持使用 Docker Compose 进行一键部署。

1.  **上传代码**：将整个 `Word Duel` 文件夹上传到服务器。
2.  **运行容器**：
    ```bash
    docker-compose up -d --build
    ```
3.  **访问**：直接访问服务器 IP (端口 80)。

### 注意事项

*   **端口映射**：确保服务器开放 80 端口 (Web) 和 3000 端口 (可选，用于调试，生产环境已通过内部网络通信)。


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
