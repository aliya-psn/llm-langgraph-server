require('dotenv').config();
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const workflowRoutes = require('./routes/workflow');
const websocketRoutes = require('./routes/websocket');
const apiRoutes = require('./routes/api');
const websocketService = require('./servers/websocketServer');

const app = express();
const port = process.env.PORT || 3000;

// 创建上传目录
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 文件上传配置
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  abortOnLimit: true,
  responseOnLimit: '文件大小超过限制',
  uploadTimeout: 0,
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../temp')
}));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '测试用例生成系统 API 文档',
  customfavIcon: '/favicon.ico'
}));

// 路由
app.use('/api/workflow', workflowRoutes);
app.use('/api/websocket', websocketRoutes);
app.use('/api', apiRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 系统健康检查
 *     description: 检查系统整体运行状态
 *     tags: [系统]
 *     responses:
 *       200:
 *         description: 系统运行正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: 系统状态
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: 检查时间
 *                 version:
 *                   type: string
 *                   description: 系统版本
 *             examples:
 *               health:
 *                 summary: 健康检查示例
 *                 value:
 *                   status: "ok"
 *                   timestamp: "2024-01-01T12:00:00Z"
 *                   version: "1.0.0"
 */
// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(port, () => {
  console.log(`🚀 服务器运行在 http://localhost:${port}`);
  console.log(`📁 上传目录: ${uploadDir}`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  
  // 启动WebSocket服务器
  websocketService.startWebSocketServer();
}); 