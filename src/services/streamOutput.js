/**
 * 流式输出服务
 * 支持多种输出格式和流式传输
 */
class StreamOutputService {
  constructor() {
    this.chunkDelay = 50; // 每个chunk之间的延迟（毫秒）
  }

  /**
   * 流式输出文本
   * @param {string} text - 要输出的文本
   * @param {Function} streamFn - 流式输出回调函数
   * @param {Object} options - 配置选项
   * @returns {Promise<void>}
   */
  async streamOutput(text, streamFn, options = {}) {
    const {
      chunkDelay = this.chunkDelay,
      chunkSize = 10, // 每次输出的字符数
      includeProgress = true
    } = options;

    try {
      const lines = text.split('\n');
      let totalLines = lines.length;
      let currentLine = 0;

      for (const line of lines) {
        currentLine++;
        
        // 逐字符输出
        for (let i = 0; i < line.length; i += chunkSize) {
          const chunk = line.slice(i, i + chunkSize);
          
          const output = {
            type: 'content',
            content: chunk,
            progress: includeProgress ? Math.round((currentLine / totalLines) * 100) : null,
            currentLine: currentLine,
            totalLines: totalLines
          };

          streamFn(output);
          
          // 添加延迟
          if (chunkDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, chunkDelay));
          }
        }

        // 输出换行符
        streamFn({
          type: 'content',
          content: '\n',
          progress: includeProgress ? Math.round((currentLine / totalLines) * 100) : null,
          currentLine: currentLine,
          totalLines: totalLines
        });
      }

      // 输出完成信号
      streamFn({
        type: 'complete',
        message: '输出完成',
        totalLines: totalLines
      });

    } catch (error) {
      console.error('流式输出错误:', error);
      streamFn({
        type: 'error',
        error: error.message
      });
    }
  }

  /**
   * 格式化输出测试要点
   * @param {string} keyPoints - 测试要点
   * @param {Function} streamFn - 流式输出回调函数
   * @returns {Promise<void>}
   */
  async streamKeyPoints(keyPoints, streamFn) {
    streamFn({
      type: 'section',
      title: '📋 测试要点',
      message: '正在生成测试要点...'
    });

    await this.streamOutput(keyPoints, streamFn, {
      chunkDelay: 30,
      includeProgress: true
    });
  }

  /**
   * 格式化输出测试用例
   * @param {string} testCases - 测试用例
   * @param {Function} streamFn - 流式输出回调函数
   * @returns {Promise<void>}
   */
  async streamTestCases(testCases, streamFn) {
    streamFn({
      type: 'section',
      title: '🧪 测试用例',
      message: '正在生成测试用例...'
    });

    await this.streamOutput(testCases, streamFn, {
      chunkDelay: 40,
      includeProgress: true
    });
  }

  /**
   * 格式化输出测试报告
   * @param {string} testReport - 测试报告
   * @param {Function} streamFn - 流式输出回调函数
   * @returns {Promise<void>}
   */
  async streamTestReport(testReport, streamFn) {
    streamFn({
      type: 'section',
      title: '📊 测试报告',
      message: '正在生成测试报告...'
    });

    await this.streamOutput(testReport, streamFn, {
      chunkDelay: 50,
      includeProgress: true
    });
  }

  /**
   * 输出工作流状态
   * @param {string} step - 当前步骤
   * @param {string} message - 状态消息
   * @param {Function} streamFn - 流式输出回调函数
   */
  streamStatus(step, message, streamFn) {
    streamFn({
      type: 'status',
      step: step,
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 输出错误信息
   * @param {string} error - 错误信息
   * @param {Function} streamFn - 流式输出回调函数
   */
  streamError(error, streamFn) {
    streamFn({
      type: 'error',
      error: error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 输出进度信息
   * @param {number} progress - 进度百分比
   * @param {string} message - 进度消息
   * @param {Function} streamFn - 流式输出回调函数
   */
  streamProgress(progress, message, streamFn) {
    streamFn({
      type: 'progress',
      progress: progress,
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 格式化输出完整结果
   * @param {Object} result - 完整结果对象
   * @param {Function} streamFn - 流式输出回调函数
   * @returns {Promise<void>}
   */
  async streamCompleteResult(result, streamFn) {
    const { keyPoints, testCases, testReport, metadata } = result;

    // 输出元数据
    if (metadata) {
      streamFn({
        type: 'metadata',
        data: metadata
      });
    }

    // 输出测试要点
    if (keyPoints) {
      await this.streamKeyPoints(keyPoints, streamFn);
    }

    // 输出测试用例
    if (testCases) {
      await this.streamTestCases(testCases, streamFn);
    }

    // 输出测试报告
    if (testReport) {
      await this.streamTestReport(testReport, streamFn);
    }

    // 输出完成消息
    streamFn({
      type: 'complete',
      message: '所有内容生成完成',
      timestamp: new Date().toISOString()
    });
  }
}

// 创建单例实例
const streamOutputService = new StreamOutputService();

module.exports = streamOutputService; 