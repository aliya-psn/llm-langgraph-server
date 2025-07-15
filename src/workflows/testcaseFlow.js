const { StateGraph, END } = require('@langchain/langgraph');
const pdfParser = require('../services/parsePDF');
const llmService = require('../services/callLLM');
const streamOutputService = require('../services/streamOutput');

/**
 * 测试用例生成工作流
 * 基于LangGraph实现的工作流控制
 */
class TestcaseWorkflow {
  constructor() {
    this.workflow = this.createWorkflow();
  }

  /**
   * 创建工作流图
   * @returns {Graph} LangGraph工作流实例
   */
  createWorkflow() {
    const workflow = new StateGraph({
      channels: {
        filePath: { value: null },
        streamFn: { value: null },
        pdfContent: { value: null },
        pdfInfo: { value: null },
        keyPoints: { value: null },
        testCases: { value: null },
        testReport: { value: null },
        result: { value: null }
      }
    });

    // 步骤1: 解析PDF文件
    workflow.addNode('ParsePDF', async (state) => {
      try {
        const { filePath, streamFn } = state;
        
        streamOutputService.streamStatus('ParsePDF', '正在解析PDF文件...', streamFn);
        
        const pdfResult = await pdfParser.parsePDF(filePath);
        
        streamOutputService.streamProgress(25, 'PDF解析完成', streamFn);
        
        return {
          ...state,
          pdfContent: pdfResult.text,
          pdfInfo: {
            fileName: pdfResult.fileName,
            pageCount: pdfResult.pageCount,
            fileSize: pdfResult.fileSize
          }
        };
      } catch (error) {
        streamOutputService.streamError(`PDF解析失败: ${error.message}`, streamFn);
        throw error;
      }
    });

    // 步骤2: 提取测试要点
    workflow.addNode('ExtractKeyPoints', async (state) => {
      try {
        const { pdfContent, streamFn } = state;
        
        streamOutputService.streamStatus('ExtractKeyPoints', '正在提取测试要点...', streamFn);
        
        const keyPoints = await llmService.generateTestKeyPoints(pdfContent, {
          model: 'qwen2.5-32b',
          temperature: 0.0
        });
        
        streamOutputService.streamProgress(50, '测试要点提取完成', streamFn);
        
        // 流式输出测试要点
        await streamOutputService.streamKeyPoints(keyPoints, streamFn);
        
        return {
          ...state,
          keyPoints: keyPoints
        };
      } catch (error) {
        streamOutputService.streamError(`测试要点提取失败: ${error.message}`, streamFn);
        throw error;
      }
    });

    // 步骤3: 生成测试用例
    workflow.addNode('GenerateTestCases', async (state) => {
      try {
        const { keyPoints, pdfContent, streamFn } = state;
        
        streamOutputService.streamStatus('GenerateTestCases', '正在生成测试用例...', streamFn);
        
        const testCases = await llmService.generateTestCases(keyPoints, pdfContent, {
          model: 'qwen2.5-32b',
          temperature: 0.0
        });
        
        streamOutputService.streamProgress(75, '测试用例生成完成', streamFn);
        
        // 流式输出测试用例
        await streamOutputService.streamTestCases(testCases, streamFn);
        
        return {
          ...state,
          testCases: testCases
        };
      } catch (error) {
        streamOutputService.streamError(`测试用例生成失败: ${error.message}`, streamFn);
        throw error;
      }
    });

    // 步骤4: 生成测试报告
    workflow.addNode('GenerateTestReport', async (state) => {
      try {
        const { keyPoints, testCases, streamFn } = state;
        
        streamOutputService.streamStatus('GenerateTestReport', '正在生成测试报告...', streamFn);
        
        const testReport = await llmService.generateTestReport(testCases, keyPoints, {
          model: 'qwen2.5-32b',
          temperature: 0.0
        });
        
        streamOutputService.streamProgress(90, '测试报告生成完成', streamFn);
        
        // 流式输出测试报告
        await streamOutputService.streamTestReport(testReport, streamFn);
        
        return {
          ...state,
          testReport: testReport
        };
      } catch (error) {
        streamOutputService.streamError(`测试报告生成失败: ${error.message}`, streamFn);
        throw error;
      }
    });

    // 步骤5: 完成工作流
    workflow.addNode('Finalize', async (state) => {
      try {
        const { streamFn, pdfInfo } = state;
        
        streamOutputService.streamStatus('Finalize', '正在完成工作流...', streamFn);
        
        // 输出完整结果
        const completeResult = {
          keyPoints: state.keyPoints,
          testCases: state.testCases,
          testReport: state.testReport,
          metadata: {
            fileName: pdfInfo.fileName,
            pageCount: pdfInfo.pageCount,
            fileSize: pdfInfo.fileSize,
            generatedAt: new Date().toISOString()
          }
        };
        
        await streamOutputService.streamCompleteResult(completeResult, streamFn);
        
        streamOutputService.streamProgress(100, '工作流执行完成', streamFn);
        
        return {
          ...state,
          result: completeResult
        };
      } catch (error) {
        streamOutputService.streamError(`工作流完成失败: ${error.message}`, streamFn);
        throw error;
      }
    });

    // 设置工作流边
    workflow.addEdge('ParsePDF', 'ExtractKeyPoints');
    workflow.addEdge('ExtractKeyPoints', 'GenerateTestCases');
    workflow.addEdge('GenerateTestCases', 'GenerateTestReport');
    workflow.addEdge('GenerateTestReport', 'Finalize');
    workflow.addEdge('Finalize', END);

    // 设置入口节点
    workflow.setEntryPoint('ParsePDF');

    // 编译工作流
    return workflow.compile();
  }

  /**
   * 运行测试用例生成工作流
   * @param {string} filePath - PDF文件路径
   * @param {Function} streamFn - 流式输出回调函数
   * @returns {Promise<Object>} 工作流执行结果
   */
  async runTestcaseWorkflow(filePath, streamFn) {
    try {
      // 初始化状态
      const initialState = {
        filePath: filePath,
        streamFn: streamFn,
        startTime: new Date().toISOString()
      };

      // 运行工作流
      const result = await this.workflow.invoke(initialState);

      console.log('✅ 工作流执行完成');
      return result;

    } catch (error) {
      console.error('❌ 工作流执行失败:', error);
      streamOutputService.streamError(`工作流执行失败: ${error.message}`, streamFn);
      throw error;
    }
  }

  /**
   * 获取工作流状态
   * @returns {Object} 工作流状态信息
   */
  getWorkflowStatus() {
    return {
      name: 'TestcaseWorkflow',
      version: '1.0.0',
      steps: [
        'ParsePDF',
        'ExtractKeyPoints', 
        'GenerateTestCases',
        'GenerateTestReport',
        'Finalize'
      ],
      description: '基于LangGraph的测试用例生成工作流'
    };
  }
}

// 创建工作流实例
const testcaseWorkflow = new TestcaseWorkflow();

// 导出工作流运行函数
async function runTestcaseWorkflow(filePath, streamFn) {
  return await testcaseWorkflow.runTestcaseWorkflow(filePath, streamFn);
}

module.exports = { 
  runTestcaseWorkflow,
  TestcaseWorkflow: testcaseWorkflow
}; 