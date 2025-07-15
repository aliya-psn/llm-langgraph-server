const express = require('express');
const fs = require('fs');
const path = require('path');
const { runTestcaseWorkflow } = require('../workflows/testcaseFlow');
const { validateFile } = require('../utils/fileValidator');

const router = express.Router();

/**
 * @swagger
 * /api/workflow/start:
 *   post:
 *     summary: 启动测试用例生成工作流
 *     description: 上传PDF文件并启动测试用例生成工作流，返回流式响应
 *     tags: [工作流]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF文件
 *     responses:
 *       200:
 *         description: 工作流启动成功，返回Server-Sent Events流
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *             examples:
 *               start:
 *                 summary: 开始消息
 *                 value: 'data: {"type":"start","message":"开始处理文件...","fileName":"document.pdf"}\n\n'
 *               progress:
 *                 summary: 进度消息
 *                 value: 'data: {"type":"progress","percentage":25,"message":"PDF解析完成"}\n\n'
 *               complete:
 *                 summary: 完成消息
 *                 value: 'data: {"type":"complete","message":"处理完成","result":{...}}\n\n'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noFile:
 *                 summary: 未上传文件
 *                 value:
 *                   error: '请上传文件'
 *                   message: '请选择要处理的PDF文件'
 *               invalidFile:
 *                 summary: 文件格式错误
 *                 value:
 *                   error: '文件验证失败'
 *                   message: '只支持PDF格式文件'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 启动测试用例生成工作流
router.post('/start', async (req, res) => {
  try {
    // 检查文件上传
    if (!req.files || !req.files.file) {
      return res.status(400).json({ 
        error: '请上传文件',
        message: '请选择要处理的PDF文件' 
      });
    }

    const uploadedFile = req.files.file;
    
    // 验证文件
    const validationResult = validateFile(uploadedFile);
    if (!validationResult.valid) {
      return res.status(400).json({ 
        error: '文件验证失败',
        message: validationResult.message 
      });
    }

    // 保存文件
    const uploadDir = path.join(__dirname, '../../uploads');
    const fileName = `${Date.now()}_${uploadedFile.name}`;
    const filePath = path.join(uploadDir, fileName);

    await uploadedFile.mv(filePath);

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    res.flushHeaders();

    // 发送开始消息
    res.write(`data: ${JSON.stringify({
      type: 'start',
      message: '开始处理文件...',
      fileName: uploadedFile.name
    })}\n\n`);

    // 运行工作流
    await runTestcaseWorkflow(filePath, (chunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });

    // 发送完成消息
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      message: '处理完成',
      fileName: uploadedFile.name
    })}\n\n`);

    res.end();

  } catch (error) {
    console.error('工作流执行错误:', error);
    
    // 如果响应头还没发送，返回JSON错误
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: '工作流执行失败',
        message: error.message 
      });
    }
    
    // 如果已经开始流式响应，发送错误消息
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: '处理过程中发生错误',
      error: error.message
    })}\n\n`);
    res.end();
  }
});

/**
 * @swagger
 * /api/workflow/status/{workflowId}:
 *   get:
 *     summary: 获取工作流状态
 *     description: 根据工作流ID获取当前状态和进度
 *     tags: [工作流]
 *     parameters:
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *         description: 工作流ID
 *     responses:
 *       200:
 *         description: 成功获取工作流状态
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkflowStatus'
 *             examples:
 *               running:
 *                 summary: 运行中状态
 *                 value:
 *                   workflowId: "workflow_123"
 *                   status: "running"
 *                   progress: 50
 *                   timestamp: "2024-01-01T12:00:00Z"
 *               completed:
 *                 summary: 已完成状态
 *                 value:
 *                   workflowId: "workflow_123"
 *                   status: "completed"
 *                   progress: 100
 *                   timestamp: "2024-01-01T12:05:00Z"
 *       404:
 *         description: 工作流不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 获取工作流状态
router.get('/status/:workflowId', (req, res) => {
  const { workflowId } = req.params;
  
  // TODO: 实现工作流状态查询
  res.json({
    workflowId,
    status: 'completed',
    progress: 100,
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/workflow/history:
 *   get:
 *     summary: 获取历史记录
 *     description: 获取工作流执行历史记录，支持分页
 *     tags: [工作流]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页记录数
 *     responses:
 *       200:
 *         description: 成功获取历史记录
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 records:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkflowStatus'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *             examples:
 *               history:
 *                 summary: 历史记录示例
 *                 value:
 *                   records: [
 *                     {
 *                       workflowId: "workflow_123",
 *                       status: "completed",
 *                       progress: 100,
 *                       timestamp: "2024-01-01T12:00:00Z"
 *                     }
 *                   ]
 *                   pagination:
 *                     page: 1
 *                     limit: 10
 *                     total: 1
 */
// 获取历史记录
router.get('/history', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  // TODO: 实现历史记录查询
  res.json({
    records: [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 0
    }
  });
});

module.exports = router; 