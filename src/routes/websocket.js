const express = require('express');
const websocketService = require('../servers/websocketServer');

const router = express.Router();

/**
 * @swagger
 * /api/websocket/status:
 *   get:
 *     summary: 获取WebSocket连接状态
 *     description: 获取当前WebSocket服务器的连接状态和统计信息
 *     tags: [WebSocket]
 *     responses:
 *       200:
 *         description: 成功获取WebSocket状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connections:
 *                   type: integer
 *                   description: 当前连接数
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: 查询时间戳
 *             examples:
 *               status:
 *                 summary: WebSocket状态示例
 *                 value:
 *                   connections: 5
 *                   timestamp: "2024-01-01T12:00:00Z"
 */
// 获取WebSocket连接状态
router.get('/status', (req, res) => {
  const status = websocketService.getConnectionStatus();
  res.json(status);
});

/**
 * @swagger
 * /api/websocket/info:
 *   get:
 *     summary: 获取WebSocket服务器信息
 *     description: 获取WebSocket服务器的配置信息和连接地址
 *     tags: [WebSocket]
 *     responses:
 *       200:
 *         description: 成功获取WebSocket服务器信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wsPort:
 *                   type: integer
 *                   description: WebSocket端口
 *                 wsUrl:
 *                   type: string
 *                   description: WebSocket连接地址
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: 查询时间戳
 *             examples:
 *               info:
 *                 summary: WebSocket服务器信息示例
 *                 value:
 *                   wsPort: 3001
 *                   wsUrl: "ws://localhost:3001"
 *                   timestamp: "2024-01-01T12:00:00Z"
 */
// 获取WebSocket服务器信息
router.get('/info', (req, res) => {
  res.json({
    wsPort: process.env.WS_PORT || 3001,
    wsUrl: `ws://localhost:${process.env.WS_PORT || 3001}`,
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 