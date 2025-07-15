const fetch = require('node-fetch');

/**
 * LLM调用服务
 * 支持多种模型、多模态和流式输出
 */
class LLMService {
  constructor() {
    // 确保环境变量已加载
    require('dotenv').config();
    
    // API配置
    this.API_URLS = {
      LANGCHAIN_CHAT: '/open-api/langchain-chat/chat/chat',
      OPENAPI_CHAT: '/open-api/oneapi/v1/chat/completions'
    };

    // 支持的模型配置
    this.LLM_MODEL_MAP = {
      Qwen_2_72B: {
        name: 'Qwen2.5-VL-72B',
        label: 'qwen2.5-vl-72b',
        think: false,
        multimodal: true,
        isOpenApi: true
      },
      DEEPSEEK_R1_14B: {
        name: 'deepseek-r1-distill',
        label: 'deepseekR1-14b',
        think: true,
        multimodal: false,
        isOpenApi: false
      },
      QWEN_2_32B: {
        name: 'qwen2.5-32b',
        label: 'qwen2.5-32b',
        think: false,
        multimodal: false,
        isOpenApi: false
      },
      QWEN_3: {
        name: 'Qwen3-32B',
        label: 'qwen3-32b',
        think: true,
        multimodal: false,
        isOpenApi: true
      },
      Qwen_3_235B: {
        name: 'Qwen3-235B-A22B',
        label: 'qwen3-235b-a22b',
        think: true,
        multimodal: false,
        isOpenApi: true
      }
    };

    // 默认配置 - 添加默认值和验证
    this.defaultModel = process.env.DEFAULT_MODEL;
    this.apiKey = process.env.API_KEY;
    this.baseUrl = process.env.BASE_URL;
    
    // 默认参数
    this.defaultValues = {
      temperature: 0.0,
      score_threshold: 0.0,
      max_tokens: 20000
    };

    // 控制器用于中断请求
    this.controller = null;
    this.signal = null;
  }

  /**
   * 检查模型是否支持OpenAPI
   * @param {string} model - 模型名称
   * @returns {boolean} 是否支持OpenAPI
   */
  isOpenApi(model) {
    const modelEntry = Object.values(this.LLM_MODEL_MAP).find(m => m.name === model);
    return modelEntry ? modelEntry.isOpenApi : false;
  }

  /**
   * 创建多模态消息
   * @param {string} model - 模型名称
   * @param {string} role - 角色
   * @param {string} text - 文本内容
   * @param {Array<string>} images - 图片base64数组
   * @param {Array} files - 文件数组
   * @returns {Object} 消息对象
   */
  createMultimodalMessage(model, role, text, images = [], files = []) {
    let content = [];

    // 添加文本部分
    if (text) {
      content.push({ type: 'text', text });
    }

    const modelEntry = Object.values(this.LLM_MODEL_MAP).find(m => m.name === model);

    if (modelEntry && modelEntry.multimodal) {
      // 处理图片
      if (images && images.length > 0) {
        images.forEach(imageUrl => {
          content.push({ type: 'image_url', image_url: { url: imageUrl } });
        });
      } else if (files && files.length > 0) {
        // 处理文件
        files.forEach(file => {
          if (file.base64List) {
            file.base64List.forEach(item => {
              content.push({ type: 'image_url', image_url: { url: item } });
            });
          }
        });
      }
    }

    return { role, content };
  }

  /**
   * 创建历史消息记录
   * @param {string} model - 模型名称
   * @param {Array} history - 历史记录
   * @returns {Promise<Array>} 处理后的历史记录
   */
  async createHistory(model, history = []) {
    const modelEntry = Object.values(this.LLM_MODEL_MAP).find(m => m.name === model);

    if (modelEntry && modelEntry.multimodal) {
      // 多模态格式
      const processHistory = await Promise.all(
        history
          .filter(item => item.content)
          .map(async item => {
            const content = [{ type: 'text', text: item.content }];

            if (item.images && item.images.length > 0) {
              item.images.forEach(imageUrl => {
                content.push({ type: 'image_url', image_url: { url: imageUrl } });
              });
            } else if (item.files && item.files.length > 0) {
              item.files.forEach(file => {
                if (file.base64List) {
                  file.base64List.forEach(item => {
                    content.push({ type: 'image_url', image_url: { url: item } });
                  });
                }
              });
            }
            return { role: item.role, content };
          })
      );
      return processHistory;
    } else {
      // 文本格式
      return history.filter(item => item.content).map(item => ({ 
        role: item.role, 
        content: item.content 
      }));
    }
  }

  /**
   * 调用LLM生成文本
   * @param {string} content - 查询内容
   * @param {Object} options - 配置选项
   * @returns {Promise<string>} 生成的文本
   */
  async callLLM(content, options = {}) {
    try {
      const {
        model = this.defaultModel,
        temperature = this.defaultValues.temperature,
        score_threshold = this.defaultValues.score_threshold,
        history = [],
        base64ImageList = [],
        fileImageList = []
      } = options;

      if (this.isOpenApi(model)) {
        return await this.openChatRequest(
          content,
          model,
          temperature,
          score_threshold,
          false, // 非流式
          null,
          history,
          base64ImageList,
          fileImageList
        );
      } else {
        return await this.llmRequest(
          content,
          model,
          temperature,
          score_threshold,
          false, // 非流式
          null,
          history
        );
      }
    } catch (error) {
      console.error('LLM调用错误:', error);
      throw new Error(`LLM调用失败: ${error.message}`);
    }
  }

  /**
   * 流式调用LLM
   * @param {string} content - 查询内容
   * @param {Function} onChunk - 处理每个chunk的回调
   * @param {Object} options - 配置选项
   * @returns {Promise<void>}
   */
  async callLLMStream(content, onChunk, options = {}) {
    try {
      const {
        model = this.defaultModel,
        temperature = this.defaultValues.temperature,
        score_threshold = this.defaultValues.score_threshold,
        history = [],
        base64ImageList = [],
        fileImageList = []
      } = options;

      this.controller = new AbortController();
      this.signal = this.controller.signal;

      if (this.isOpenApi(model)) {
        return await this.openChatRequest(
          content,
          model,
          temperature,
          score_threshold,
          true, // 流式
          this.signal,
          history,
          base64ImageList,
          fileImageList,
          onChunk
        );
      } else {
        return await this.llmRequest(
          content,
          model,
          temperature,
          score_threshold,
          true, // 流式
          this.signal,
          history,
          onChunk
        );
      }
    } catch (error) {
      console.error('LLM流式调用错误:', error);
      onChunk({
        type: 'error',
        error: error.message
      });
      throw new Error(`LLM流式调用失败: ${error.message}`);
    }
  }

  /**
   * LangChain接口调用
   * @param {string} content - 查询内容
   * @param {string} model - 模型名称
   * @param {number} temperature - 温度
   * @param {number} score_threshold - 阈值
   * @param {boolean} stream - 是否流式
   * @param {AbortSignal} signal - 中断信号
   * @param {Array} history - 历史记录
   * @param {Function} onChunk - 流式回调
   * @returns {Promise<string|void>} 结果
   */
  async llmRequest(content, model, temperature, score_threshold, stream = false, signal = null, history = [], onChunk = null) {
    const historyList = await this.createHistory(model, history);

    try {
      console.log(`${this.baseUrl}${this.API_URLS.LANGCHAIN_CHAT}`);
      const response = await fetch(`${this.baseUrl}${this.API_URLS.LANGCHAIN_CHAT}`, {
        method: 'POST',
        signal: signal,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stream: stream,
          query: content,
          model_name: model,
          temperature: temperature,
          score_threshold: score_threshold,
          max_tokens: this.defaultValues.max_tokens,
          history: historyList
        })
      });

      if (response.status !== 200) {
        throw new Error(`请求失败，状态码: ${response.status}`);
      }

      if (stream && onChunk) {
        return await this.handleStreamResponse(response, onChunk);
      } else {
        const result = await response.json();
        return result.choices?.[0]?.message?.content || result.content || '';
      }
    } catch (error) {
      console.error('LangChain请求错误:', error);
      throw error;
    }
  }

  /**
   * OpenAPI接口调用
   * @param {string} content - 查询内容
   * @param {string} model - 模型名称
   * @param {number} temperature - 温度
   * @param {number} score_threshold - 阈值
   * @param {boolean} stream - 是否流式
   * @param {AbortSignal} signal - 中断信号
   * @param {Array} history - 历史记录
   * @param {Array} base64ImageList - 图片列表
   * @param {Array} fileImageList - 文件列表
   * @param {Function} onChunk - 流式回调
   * @returns {Promise<string|void>} 结果
   */
  async openChatRequest(content, model, temperature, score_threshold, stream = false, signal = null, history = [], base64ImageList = [], fileImageList = [], onChunk = null) {
    const historyList = await this.createHistory(model, history);

    // 如果历史记录为空，添加当前消息
    if (historyList.length === 0) {
      historyList.push(this.createMultimodalMessage(model, 'user', content, base64ImageList, fileImageList));
    }

    try {
      const response = await fetch(`${this.baseUrl}${this.API_URLS.OPENAPI_CHAT}`, {
        method: 'POST',
        signal: signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey
        },
        body: JSON.stringify({
          stream: stream,
          model: model,
          messages: historyList,
          temperature: temperature
        })
      });

      if (response.status !== 200) {
        throw new Error(`请求失败，状态码: ${response.status}`);
      }

      if (stream && onChunk) {
        return await this.handleStreamResponse(response, onChunk);
      } else {
        const result = await response.json();
        return result.choices?.[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('OpenAPI请求错误:', error);
      throw error;
    }
  }

  /**
   * 处理流式响应
   * @param {Response} response - 响应对象
   * @param {Function} onChunk - 回调函数
   * @returns {Promise<void>}
   */
  async handleStreamResponse(response, onChunk) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onChunk({
                type: 'complete',
                content: '',
                fullContent: fullContent
              });
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onChunk({
                  type: 'chunk',
                  content: content,
                  fullContent: fullContent
                });
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      onChunk({
        type: 'error',
        error: error.message
      });
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 中断当前请求
   */
  abortChat() {
    if (this.controller) {
      this.controller.abort();
    }
  }

  /**
   * 生成测试要点
   * @param {string} content - 文档内容
   * @param {Object} options - 配置选项
   * @returns {Promise<string>} 测试要点
   */
  async generateTestKeyPoints(content, options = {}) {
    const prompt = `请从以下文档内容中提取关键的测试要点，重点关注：
1. 功能需求
2. 边界条件
3. 异常情况
4. 性能要求
5. 安全要求

文档内容：
${content}

请以结构化的方式输出测试要点：`;

    return await this.callLLM(prompt, {
      ...options,
      systemPrompt: '你是一个专业的测试分析师，擅长从文档中提取测试要点。'
    });
  }

  /**
   * 生成测试用例
   * @param {string} keyPoints - 测试要点
   * @param {string} originalContent - 原始文档内容
   * @param {Object} options - 配置选项
   * @returns {Promise<string>} 测试用例
   */
  async generateTestCases(keyPoints, originalContent, options = {}) {
    const prompt = `基于以下测试要点和原始文档，生成详细的测试用例：

测试要点：
${keyPoints}

原始文档内容：
${originalContent}

请生成包含以下内容的测试用例：
1. 测试用例ID和标题
2. 前置条件
3. 测试步骤
4. 预期结果
5. 测试数据
6. 优先级

请以表格或列表的形式输出：`;

    return await this.callLLM(prompt, {
      ...options,
      systemPrompt: '你是一个专业的测试工程师，擅长生成高质量的测试用例。'
    });
  }

  /**
   * 生成测试报告
   * @param {string} testCases - 测试用例
   * @param {string} keyPoints - 测试要点
   * @param {Object} options - 配置选项
   * @returns {Promise<string>} 测试报告
   */
  async generateTestReport(testCases, keyPoints, options = {}) {
    const prompt = `基于以下测试用例和测试要点，生成测试报告：

测试要点：
${keyPoints}

测试用例：
${testCases}

请生成包含以下内容的测试报告：
1. 测试概述
2. 测试范围
3. 测试策略
4. 风险评估
5. 测试建议`;

    return await this.callLLM(prompt, {
      ...options,
      systemPrompt: '你是一个专业的测试经理，擅长生成测试报告。'
    });
  }
}

// 创建单例实例
const llmService = new LLMService();

module.exports = llmService; 