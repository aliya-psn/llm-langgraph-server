const { StateGraph, END } = require('@langchain/langgraph');

async function testWorkflow() {
  console.log('🧪 测试LangGraph工作流创建...');

  try {
    // 创建简单的工作流进行测试
    const workflow = new StateGraph({
      channels: {
        input: { value: null },
        output: { value: null }
      }
    });

    // 添加测试节点
    workflow.addNode('TestNode', async (state) => {
      console.log('✅ 测试节点执行成功');
      return {
        ...state,
        output: '测试成功'
      };
    });

    // 设置边和入口点
    workflow.addEdge('TestNode', END);
    workflow.setEntryPoint('TestNode');

    // 编译工作流
    const compiledWorkflow = workflow.compile();
    console.log('✅ 工作流编译成功');

    // 测试运行
    const result = await compiledWorkflow.invoke({
      input: 'test'
    });

    console.log('✅ 工作流运行成功:', result);

  } catch (error) {
    console.error('❌ 工作流测试失败:', error);
    console.error('错误详情:', error.stack);
  }

  console.log('🏁 测试完成');
}

testWorkflow(); 