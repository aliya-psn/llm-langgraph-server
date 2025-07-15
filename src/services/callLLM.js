const fetch = require('node-fetch');
require('dotenv').config();
const readline = require('readline');

/**
 * LLM调用服务（多模型/多模态/流式输出）
 */
class LLMService {
  constructor() {
    this.API_URLS = {
      LANGCHAIN_CHAT: '/open-api/langchain-chat/chat/chat',
      OPENAPI_CHAT: '/open-api/oneapi/v1/chat/completions'
    };
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
    this.defaultModel = process.env.DEFAULT_MODEL;
    this.apiKey = process.env.API_KEY;
    this.baseUrl = process.env.BASE_URL;
    this.defaultValues = {
      temperature: 0.0,
      max_tokens: 20000
    };
  }

  isOpenApi(model) {
    const m = Object.values(this.LLM_MODEL_MAP).find(x => x.name === model);
    return m ? m.isOpenApi : false;
  }

  // 统一多模态消息生成
  createMessage(model, role, text, images = [], files = []) {
    const m = Object.values(this.LLM_MODEL_MAP).find(x => x.name === model);
    if (m && m.multimodal) {
      let content = [];
      if (text) content.push({ type: 'text', text });
      (images || []).forEach(url => content.push({ type: 'image_url', image_url: { url } }));
      (files || []).forEach(file => {
        (file.base64List || []).forEach(item => content.push({ type: 'image_url', image_url: { url: item } }));
      });
      return { role, content };
    } else {
      return { role, content: text };
    }
  }

  // 统一历史消息处理
  async createHistory(model, history = []) {
    const m = Object.values(this.LLM_MODEL_MAP).find(x => x.name === model);
    if (m && m.multimodal) {
      return history.filter(i => i.content).map(i => this.createMessage(model, i.role, i.content, i.images, i.files));
    } else {
      return history.filter(i => i.content).map(i => ({ role: i.role, content: i.content }));
    }
  }

  /**
   * 主调用，默认支持分流（onChunk 存在则流式，否则普通）
   * @param {string} content - 查询内容
   * @param {Object} options - 配置项
   * @param {string} [options.model] - 模型名称
   * @param {number} [options.temperature] - 温度
   * @param {Array} [options.history] - 历史消息
   * @param {Array} [options.base64ImageList] - 图片base64数组
   * @param {Array} [options.fileImageList] - 文件数组
   * @param {function} [options.onChunk] - 流式分流回调函数，若传递则以流式方式返回内容，回调参数为chunk对象
   * @returns {Promise<string|void>} - 若onChunk为空，返回完整字符串，否则无返回值，内容通过onChunk分流
   */
  async callLLM(content, options = {}) {
    const {
      model = this.defaultModel,
      temperature = this.defaultValues.temperature,
      history = [],
      base64ImageList = [],
      fileImageList = [],
      onChunk = null
    } = options;
    const stream = !!onChunk;
    if (this.isOpenApi(model)) {
      return await this.openChatRequest(content, model, temperature, stream, history, base64ImageList, fileImageList, onChunk);
    } else {
      return await this.llmRequest(content, model, temperature, stream, history, onChunk);
    }
  }

  // LangChain接口
  async llmRequest(content, model, temperature, stream = false, history = [], onChunk = null) {
    const historyList = await this.createHistory(model, history);
    const response = await fetch(`${this.baseUrl}${this.API_URLS.LANGCHAIN_CHAT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stream,
        query: content,
        model_name: model,
        temperature,
        max_tokens: this.defaultValues.max_tokens,
        history: historyList
      })
    });
    if (response.status !== 200) throw new Error(`请求失败，状态码: ${response.status}`);
    if (stream && onChunk) return await this.handleStreamResponse(response, onChunk);
    // 非流式兼容 data: ... 格式
    return await this.parseNonStreamResponse(response);
  }

  // OpenAPI接口
  async openChatRequest(content, model, temperature, stream = false, history = [], base64ImageList = [], fileImageList = [], onChunk = null) {
    let historyList = await this.createHistory(model, history);
    if (historyList.length === 0) {
      historyList.push(this.createMessage(model, 'user', content, base64ImageList, fileImageList));
    }
    const response = await fetch(`${this.baseUrl}${this.API_URLS.OPENAPI_CHAT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey
      },
      body: JSON.stringify({
        stream,
        model,
        messages: historyList,
        temperature
      })
    });
    if (response.status !== 200) throw new Error(`请求失败，状态码: ${response.status}`);
    if (stream && onChunk) return await this.handleStreamResponse(response, onChunk);
    // 非流式兼容 data: ... 格式
    return await this.parseNonStreamResponse(response);
  }

  // 处理流式响应（兼容 node-fetch 的 Node.js Readable 流）
  async handleStreamResponse(response, onChunk) {
    const rl = readline.createInterface({
      input: response.body,
      crlfDelay: Infinity
    });
    let fullContent = '';
    rl.on('line', (line) => {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          onChunk({ type: 'complete', content: '', fullContent });
          rl.close();
          return;
        }
        try {
          const parsed = JSON.parse(data);
           // 兼容两种格式
          let content = '';
          if (parsed.choices && parsed.choices[0]?.delta?.content !== undefined) {
            // OpenAI/OneAPI风格（如Qwen3-32B）
            content = parsed.choices[0].delta.content;
          } else if (parsed.text !== undefined) {
            // 自定义/简化风格（如 data: {"text": "--", ...}）
            content = parsed.text;
          }

          if (content) {
            fullContent += content;
            onChunk({ type: 'chunk', content, fullContent });
          }
        } catch {}
      }
    });
    rl.on('error', (error) => {
      onChunk({ type: 'error', error: error.message });
    });
    await new Promise((resolve) => rl.on('close', resolve));
  }

  // 兼容非流式 data: ... 格式的解析
  async parseNonStreamResponse(response) {
    const contentType = response.headers.get('content-type');
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      let text = await response.text();
      text = text.trim();
      if (text.startsWith('data: ')) {
        text = text.slice(6);
      }
      try {
        result = JSON.parse(text);
      } catch {
        result = {};
      }
    }
    return (
      result.choices?.[0]?.message?.content ||
      result.content ||
      result.text ||
      ''
    );
  }

  // 生成测试要点
  async generateTestKeyPoints(content, options = {}) {
    const prompt = `请从以下文档内容中提取关键的测试要点，重点关注：\n1. 功能需求\n2. 边界条件\n3. 异常情况\n4. 性能要求\n5. 安全要求\n\n文档内容：\n${content}\n\n请以结构化的方式输出测试要点：`;
    return await this.callLLM(prompt, options);
  }

  // 生成测试用例
  async generateTestCases(keyPoints, originalContent, options = {}) {
    const prompt = `基于以下测试要点和原始文档，生成详细的测试用例：\n\n测试要点：\n${keyPoints}\n\n原始文档内容：\n${originalContent}\n\n请生成包含以下内容的测试用例：\n1. 测试用例ID和标题\n2. 前置条件\n3. 测试步骤\n4. 预期结果\n5. 测试数据\n6. 优先级\n\n请以表格或列表的形式输出：`;
    return await this.callLLM(prompt, options);
  }

  // 生成测试报告
  async generateTestReport(testCases, keyPoints, options = {}) {
    const prompt = `基于以下测试用例和测试要点，生成测试报告：\n\n测试要点：\n${keyPoints}\n\n测试用例：\n${testCases}\n\n请生成包含以下内容的测试报告：\n1. 测试概述\n2. 测试范围\n3. 测试策略\n4. 风险评估\n5. 测试建议`;
    return await this.callLLM(prompt, options);
  }
}

module.exports = new LLMService(); 