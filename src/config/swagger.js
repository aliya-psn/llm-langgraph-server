const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '测试用例生成系统 API',
      version: '1.0.0',
      description: '基于LangGraph的智能测试用例生成工作流系统API文档',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发服务器'
      },
      {
        url: 'https://api.example.com',
        description: '生产服务器'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: '错误类型'
            },
            message: {
              type: 'string',
              description: '错误消息'
            }
          }
        },
        WorkflowStatus: {
          type: 'object',
          properties: {
            workflowId: {
              type: 'string',
              description: '工作流ID'
            },
            status: {
              type: 'string',
              enum: ['running', 'completed', 'failed'],
              description: '工作流状态'
            },
            progress: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: '进度百分比'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '时间戳'
            }
          }
        },
        TestResult: {
          type: 'object',
          properties: {
            keyPoints: {
              type: 'string',
              description: '测试要点'
            },
            testCases: {
              type: 'string',
              description: '测试用例'
            },
            testReport: {
              type: 'string',
              description: '测试报告'
            },
            metadata: {
              type: 'object',
              properties: {
                fileName: {
                  type: 'string',
                  description: '文件名'
                },
                pageCount: {
                  type: 'number',
                  description: '页数'
                },
                fileSize: {
                  type: 'number',
                  description: '文件大小'
                },
                generatedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: '生成时间'
                }
              }
            }
          }
        },
        WebSocketMessage: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: '消息类型'
            },
            message: {
              type: 'string',
              description: '消息内容'
            },
            data: {
              type: 'object',
              description: '消息数据'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '时间戳'
            }
          }
        }
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization'
        }
      }
    },
    tags: [
      {
        name: '工作流',
        description: '测试用例生成工作流相关接口'
      },
      {
        name: 'WebSocket',
        description: 'WebSocket连接和状态接口'
      },
      {
        name: 'API代理',
        description: 'LLM API代理接口'
      },
      {
        name: '系统',
        description: '系统健康检查和状态接口'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/app.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 