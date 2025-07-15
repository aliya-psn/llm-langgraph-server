const { StateGraph, END } = require('@langchain/langgraph');
const llmService = require('../src/services/callLLM');

async function main(input, onlyReturn = false) {
  console.log('🧩 使用LangGraph实现LLM服务流程...');

  // 定义工作流
  const workflow = new StateGraph({
    channels: {
      input: { value: null },
      keyPoints: { value: null },
      testCases: { value: null },
      testReport: { value: null },
      output: { value: null }
    }
  });

  // 节点1：生成测试要点
  workflow.addNode('GenerateKeyPoints', async (state) => {
    const documentContent = state.input;
    const keyPoints = await llmService.generateTestKeyPoints(documentContent, {
      model: 'qwen2.5-32b',
      temperature: 0.0
    });
    if (!onlyReturn) console.log('【测试要点】\n', keyPoints);
    return { ...state, keyPoints };
  });

  // 节点2：生成测试用例
  workflow.addNode('GenerateTestCases', async (state) => {
    const testCases = await llmService.generateTestCases(state.keyPoints, state.input, {
      model: 'qwen2.5-32b',
      temperature: 0.0
    });
    if (!onlyReturn) console.log('【测试用例】\n', testCases);
    return { ...state, testCases };
  });

  // 节点3：生成测试报告
  workflow.addNode('GenerateTestReport', async (state) => {
    const testReport = await llmService.generateTestReport(state.testCases, state.keyPoints, {
      model: 'qwen2.5-32b',
      temperature: 0.0
    });
    if (!onlyReturn) console.log('【测试报告】\n', testReport);
    return { ...state, testReport };
  });

  // 节点4：输出最终结果
  workflow.addNode('Output', async (state) => {
    return { ...state, output: {
      keyPoints: state.keyPoints,
      testCases: state.testCases,
      testReport: state.testReport
    }};
  });

  // 设置节点连接
  workflow.addEdge('GenerateKeyPoints', 'GenerateTestCases');
  workflow.addEdge('GenerateTestCases', 'GenerateTestReport');
  workflow.addEdge('GenerateTestReport', 'Output');
  workflow.addEdge('Output', END);
  workflow.setEntryPoint('GenerateKeyPoints');

  // 编译并运行
  const compiled = workflow.compile();
  const documentContent = input || `
    用户登录功能需求：
    1. 用户输入用户名和密码
    2. 系统验证用户凭据
    3. 登录成功后跳转到主页
    4. 登录失败显示错误信息
  `;
  const result = await compiled.invoke({ input: documentContent });
  if (!onlyReturn) {
    console.log('\n🎉 LangGraph LLM流程执行完成，最终输出：');
    console.log(result.output);
  }
  return result.output;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 