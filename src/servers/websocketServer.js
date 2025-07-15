const WebSocket = require('ws');
const http = require('http');

// 创建WebSocket服务器
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// 存储连接的客户端
const clients = new Map();

// WebSocket连接处理
wss.on('connection', (ws, req) => {
  const clientId = Date.now().toString();
  clients.set(clientId, ws);

  console.log(`🔌 WebSocket客户端连接: ${clientId}`);

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'WebSocket连接成功',
    clientId: clientId,
    timestamp: new Date().toISOString()
  }));

  // 处理消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 收到WebSocket消息:', data);

      // 根据消息类型处理
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
          break;

        case 'subscribe':
          // 订阅特定工作流
          ws.workflowId = data.workflowId;
          ws.send(JSON.stringify({
            type: 'subscribed',
            workflowId: data.workflowId,
            message: '已订阅工作流更新'
          }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: '未知的消息类型'
          }));
      }
    } catch (error) {
      console.error('WebSocket消息解析错误:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: '消息格式错误'
      }));
    }
  });

  // 处理连接关闭
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`🔌 WebSocket客户端断开: ${clientId}`);
  });

  // 处理错误
  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
    clients.delete(clientId);
  });
});

// 广播消息到所有客户端
function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// 发送消息到特定工作流的订阅者
function sendToWorkflow(workflowId, message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.workflowId === workflowId) {
      client.send(JSON.stringify({
        ...message,
        workflowId: workflowId,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

// 启动WebSocket服务器
function startWebSocketServer() {
  const wsPort = process.env.WS_PORT || 3001;
  server.listen(wsPort, () => {
    console.log(`🔌 WebSocket服务器运行在 ws://localhost:${wsPort}`);
  });
}

// 获取连接状态
function getConnectionStatus() {
  return {
    connections: wss.clients.size,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  broadcast,
  sendToWorkflow,
  startWebSocketServer,
  getConnectionStatus,
  wss
}; 