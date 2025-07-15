const express = require('express');
const fetch = require('node-fetch');

// 确保环境变量已加载
require('dotenv').config();

const router = express.Router();

// API配置
const API_URLS = {
  LANGCHAIN_CHAT: '/open-api/langchain-chat/chat/chat',
  OPENAPI_CHAT: '/open-api/oneapi/v1/chat/completions'
};

const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;

// 打印配置信息
console.log('🔧 API路由配置:');
console.log(`  - API_KEY: ${API_KEY ? '已配置' : '未配置'}`);
console.log(`  - BASE_URL: ${BASE_URL}`);

/**
 * @swagger
 * /api/langchain-chat:
 *   post:
 *     summary: 代理LangChain聊天接口
 *     description: 转发请求到LangChain聊天API
 *     tags: [API代理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: LangChain聊天请求参数
 *     responses:
 *       200:
 *         description: 成功调用LangChain API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: LangChain API响应
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 代理请求失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * 代理LangChain聊天接口
 */
router.post('/langchain-chat', async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}${API_URLS.LANGCHAIN_CHAT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (response.status !== 200) {
      return res.status(response.status).json({
        error: `请求失败，状态码: ${response.status}`
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('LangChain代理错误:', error);
    res.status(500).json({
      error: '代理请求失败',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/openapi-chat:
 *   post:
 *     summary: 代理OpenAPI聊天接口
 *     description: 转发请求到OpenAPI聊天接口，需要API密钥认证
 *     tags: [API代理]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: OpenAPI聊天请求参数
 *     responses:
 *       200:
 *         description: 成功调用OpenAPI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: OpenAPI响应
 *       401:
 *         description: API密钥无效
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 代理请求失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * 代理OpenAPI聊天接口
 */
router.post('/openapi-chat', async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}${API_URLS.OPENAPI_CHAT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY
      },
      body: JSON.stringify(req.body)
    });

    if (response.status !== 200) {
      return res.status(response.status).json({
        error: `请求失败，状态码: ${response.status}`
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('OpenAPI代理错误:', error);
    res.status(500).json({
      error: '代理请求失败',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: API代理健康检查
 *     description: 检查API代理服务的状态和配置信息
 *     tags: [API代理]
 *     responses:
 *       200:
 *         description: API代理服务正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: 服务状态
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: 检查时间
 *                 services:
 *                   type: object
 *                   properties:
 *                     langchain:
 *                       type: string
 *                       description: LangChain服务地址
 *                     openapi:
 *                       type: string
 *                       description: OpenAPI服务地址
 */
/**
 * 健康检查
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      langchain: `${BASE_URL}${API_URLS.LANGCHAIN_CHAT}`,
      openapi: `${BASE_URL}${API_URLS.OPENAPI_CHAT}`,
    }
  });
});

module.exports = router; 