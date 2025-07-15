const { OpenAI } = require('openai');

/**
 * LLM调用服务
 * 支持多种模型和流式输出
 */
class LLMService {
  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = 4000;
    this.temperature = 0.7;
  }

  /**
   * 调用LLM生成文本
   * @param {string} prompt - 提示词
   * @param {Object} options - 配置选项
   * @returns {Promise<string>} 生成的文本
   */
  async callLLM(prompt, options = {}) {
    try {
      const {
        model = this.defaultModel,
        temperature = this.temperature,
        maxTokens = this.maxTokens,
        systemPrompt = '你是一个专业的测试用例生成助手，能够根据文档内容生成高质量的测试用例。'
      } = options;

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false
      });

      const result = response.choices[0].message.content;
      console.log(`🤖 LLM调用完成: ${model}, 生成长度: ${result.length}`);
      
      return result;
    } catch (error) {
      console.error('LLM调用错误:', error);
      throw new Error(`LLM调用失败: ${error.message}`);
    }
  }

  /**
   * 流式调用LLM
   * @param {string} prompt - 提示词
   * @param {Function} onChunk - 处理每个chunk的回调
   * @param {Object} options - 配置选项
   * @returns {Promise<void>}
   */
  async callLLMStream(prompt, onChunk, options = {}) {
    try {
      const {
        model = this.defaultModel,
        temperature = this.temperature,
        maxTokens = this.maxTokens,
        systemPrompt = '你是一个专业的测试用例生成助手，能够根据文档内容生成高质量的测试用例。'
      } = options;

      const stream = await this.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        stream: true
      });

      let fullContent = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onChunk({
            type: 'chunk',
            content: content,
            fullContent: fullContent
          });
        }
      }

      onChunk({
        type: 'complete',
        content: '',
        fullContent: fullContent
      });

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
   * 生成测试要点
   * @param {string} content - 文档内容
   * @returns {Promise<string>} 测试要点
   */
  async generateTestKeyPoints(content) {
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
      systemPrompt: '你是一个专业的测试分析师，擅长从文档中提取测试要点。'
    });
  }

  /**
   * 生成测试用例
   * @param {string} keyPoints - 测试要点
   * @param {string} originalContent - 原始文档内容
   * @returns {Promise<string>} 测试用例
   */
  async generateTestCases(keyPoints, originalContent) {
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
      systemPrompt: '你是一个专业的测试工程师，擅长生成高质量的测试用例。'
    });
  }

  /**
   * 生成测试报告
   * @param {string} testCases - 测试用例
   * @param {string} keyPoints - 测试要点
   * @returns {Promise<string>} 测试报告
   */
  async generateTestReport(testCases, keyPoints) {
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
      systemPrompt: '你是一个专业的测试经理，擅长生成测试报告。'
    });
  }

  /**
   * 验证API密钥
   * @returns {Promise<boolean>} 是否有效
   */
  async validateAPIKey() {
    try {
      await this.openai.models.list();
      return true;
    } catch (error) {
      console.error('API密钥验证失败:', error);
      return false;
    }
  }
}

// 创建单例实例
const llmService = new LLMService();

module.exports = llmService; 