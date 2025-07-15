# 🧪 测试用例生成系统

基于LangGraph的智能测试用例生成工作流系统，支持PDF文档解析、测试要点提取、测试用例生成和流式输出。

## ✨ 功能特性

- 📄 **PDF文档解析**: 支持PDF文件上传和文本提取
- 🤖 **AI驱动**: 基于多种LLM模型生成高质量测试用例
- 🔄 **工作流控制**: 使用LangGraph实现可配置的工作流
- 📊 **流式输出**: 实时显示处理进度和生成结果
- 🌐 **WebSocket支持**: 实时通信和状态更新
- 🎨 **现代化UI**: 美观的前端界面，支持拖拽上传

## 🏗️ 系统架构

```
前端 (Vue/HTML)
  ↕ HTTP / WebSocket
Node.js 后端（Express + LangGraph + LLM API）
  └─ Workflow 控制器（LangGraph）
      ├─ Step 1: 文件解析（PDF to Text）
      ├─ Step 2: 生成测试要点（LLM调用）
      ├─ Step 3: 生成测试用例（LLM调用）
      ├─ Step 4: 生成测试报告（LLM调用）
      └─ Step 5: 流式响应输出
```

## 🛠️ 技术栈

| 模块 | 技术 |
|------|------|
| Web 服务 | Express |
| 工作流控制 | LangGraph (JavaScript SDK) |
| 大模型服务 | 多种LLM模型 (Qwen, DeepSeek等) |
| PDF解析 | pdf-parse |
| 流式传输 | Server-Sent Events (SSE) |
| 实时通信 | WebSocket |
| 前端 | HTML5 + CSS3 + JavaScript |

## 📦 安装和配置

### 1. 克隆项目

```bash
git clone <repository-url>
cd llm-langgraph-service
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量示例文件：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置以下参数：

```env
# LLM API配置
API_KEY=your_api_key_here
DEFAULT_MODEL=qwen2.5-32b
BASE_URL=http://192.168.24.137:30123

# 服务器配置
PORT=3000
NODE_ENV=development

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# WebSocket配置
WS_PORT=3001
```

### 4. 验证环境变量

```bash
npm run test:env
```

### 5. 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务启动后，访问：
- 前端界面: http://localhost:3000
- API文档: http://localhost:3000/api-docs
- 健康检查: http://localhost:3000/health
- WebSocket: ws://localhost:3001

## 🚀 使用方法

### 1. 通过API调用

#### 启动工作流

```bash
curl -X POST http://localhost:3000/api/workflow/start \
  -F "file=@your-document.pdf"
```

#### 获取工作流状态

```bash
curl http://localhost:3000/api/workflow/status/workflow-id
```

#### 获取历史记录

```bash
curl "http://localhost:3000/api/workflow/history?page=1&limit=10"
```

### 2. WebSocket连接

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = function() {
  console.log('WebSocket连接成功');
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
};
```

## 📁 项目结构

```
llm-langgraph-service/
├── src/
│   ├── app.js                 # 主应用文件
│   ├── config/
│   │   └── swagger.js         # Swagger配置
│   ├── routes/
│   │   ├── workflow.js        # 工作流路由
│   │   ├── websocket.js       # WebSocket路由
│   │   └── api.js             # API代理路由
│   ├── services/
│   │   ├── parsePDF.js        # PDF解析服务
│   │   ├── callLLM.js         # LLM调用服务
│   │   └── streamOutput.js    # 流式输出服务
│   ├── servers/
│   │   └── websocketServer.js # WebSocket服务器
│   ├── workflows/
│   │   └── testcaseFlow.js    # 测试用例生成工作流
│   └── utils/
│       └── fileValidator.js   # 文件验证工具
├── public/
│   └── index.html             # 前端界面
├── uploads/                   # 文件上传目录
├── test/                      # 测试文件
├── package.json
├── env.example
└── README.md
```

## 🔧 API接口文档

### 📖 Swagger文档

项目集成了完整的Swagger API文档，提供交互式的API测试界面。

**访问地址:** `http://localhost:3000/api-docs`

**特性:**
- 📋 完整的API接口描述
- 🧪 在线API测试功能
- 📝 详细的请求/响应示例
- 🔐 支持API密钥认证
- 📊 实时响应查看

### 🚀 主要接口

#### 工作流接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/workflow/start` | POST | 启动测试用例生成工作流 |
| `/api/workflow/status/{workflowId}` | GET | 获取工作流状态 |
| `/api/workflow/history` | GET | 获取历史记录 |

#### WebSocket接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/websocket/status` | GET | 获取WebSocket连接状态 |
| `/api/websocket/info` | GET | 获取WebSocket服务器信息 |

#### API代理接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/langchain-chat` | POST | 代理LangChain聊天接口 |
| `/api/openapi-chat` | POST | 代理OpenAPI聊天接口 |
| `/api/health` | GET | API代理健康检查 |

#### 系统接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 系统健康检查 |

### 🔌 WebSocket连接

**连接地址:** `ws://localhost:3001`

**消息格式:**
```json
{
  "type": "message_type",
  "data": "message_data",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**支持的消息类型:**
- `connection`: 连接成功
- `ping/pong`: 心跳检测
- `subscribe`: 订阅工作流
- `progress`: 进度更新
- `complete`: 处理完成
- `error`: 错误信息

## 🤖 支持的模型

| 模型名称 | 类型 | 说明 |
|----------|------|------|
| qwen2.5-32b | 默认模型 | 适合一般任务 |
| Qwen2.5-VL-72B | 多模态模型 | 支持图片分析 |
| deepseek-r1-distill | 思维链模型 | 适合复杂推理 |
| Qwen3-32B | 思维链模型 | 平衡性能和效果 |
| Qwen3-235B-A22B | 大参数模型 | 最高性能 |

## 🔄 工作流步骤

1. **PDF解析** - 提取文档文本内容
2. **测试要点提取** - 分析文档生成测试要点
3. **测试用例生成** - 基于要点生成详细测试用例
4. **测试报告生成** - 生成完整的测试报告
5. **流式输出** - 实时返回处理结果

## 🔍 故障排除

### 常见问题

1. **LLM API错误**
   - 检查API密钥是否正确
   - 确认模型服务是否可用
   - 验证网络连接

2. **文件上传失败**
   - 检查文件格式是否为PDF
   - 确认文件大小不超过限制
   - 验证文件完整性

3. **工作流执行失败**
   - 查看服务器日志
   - 检查环境变量配置
   - 确认依赖安装完整

4. **环境变量未读取**
   - 确保在项目根目录下运行命令
   - 确认 `.env` 文件存在且格式正确
   - 运行 `npm run test:env` 验证配置

5. **API连接失败**
   - 检查 `BASE_URL` 是否正确
   - 确保网络连接正常
   - 验证API服务是否启动

6. **模型调用失败**
   - 检查 `API_KEY` 是否有效
   - 确认模型服务是否可用
   - 验证模型名称是否正确

7. **Swagger文档无法访问**
   - 确认服务器已启动
   - 检查 `swagger-jsdoc` 和 `swagger-ui-express` 依赖是否安装
   - 验证 `src/config/swagger.js` 配置是否正确
   - 查看浏览器控制台是否有JavaScript错误

8. **API文档不完整**
   - 检查路由文件中的Swagger注释格式
   - 确认注释中的路径与实际路由匹配
   - 验证数据模型定义是否正确

### 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| API_KEY | API密钥 | sk-Y3AJ7WST2zXLKIEuA629459aE4244aA2A65627C6C95fAc24 |
| DEFAULT_MODEL | 默认模型 | qwen2.5-32b |
| BASE_URL | API基础URL | http://192.168.24.137:30123 |
| PORT | 服务器端口 | 3000 |
| NODE_ENV | 运行环境 | development |
| WS_PORT | WebSocket端口 | 3001 |
| MAX_FILE_SIZE | 最大文件大小 | 10485760 (10MB) |

## 🛠️ 开发指南

### 开发模式启动

```bash
# 使用启动脚本（推荐）
npm run setup

# 或手动启动
npm install
cp env.example .env
# 编辑 .env 文件
npm run dev
```

### 代码结构说明

- `src/app.js`: 主应用入口，配置Express服务器
- `src/config/`: 配置文件（Swagger等）
- `src/routes/`: 路由定义，处理HTTP请求
- `src/services/`: 业务逻辑服务
- `src/servers/`: 网络服务器（WebSocket等）
- `src/workflows/`: LangGraph工作流定义
- `src/utils/`: 工具函数

### 添加新功能

1. 在 `src/services/` 中添加业务逻辑
2. 在 `src/routes/` 中定义API接口
3. 在 `src/workflows/` 中创建工作流节点
4. 在 `src/servers/` 中添加网络服务器
5. 在 `src/config/` 中添加配置文件

### 📝 API文档维护

**添加新的API接口时，请按以下格式添加Swagger注释：**

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: 接口摘要
 *     description: 详细描述
 *     tags: [标签名]
 *     parameters:
 *       - in: path
 *         name: paramName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功响应
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
```

**更新Swagger配置：**
- 修改 `src/config/swagger.js` 中的全局配置
- 添加新的数据模型到 `components.schemas`
- 更新服务器地址和认证方式

---

**快速开始：**
```bash
git clone <repository-url>
cd llm-langgraph-service
npm run setup
npm run dev
```

**访问地址：**
- 🏠 前端界面: http://localhost:3000
- 📖 API文档: http://localhost:3000/api-docs
- 🔍 健康检查: http://localhost:3000/health
- 🔌 WebSocket: ws://localhost:3001 