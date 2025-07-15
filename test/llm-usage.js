/**
 * LLM服务使用示例
 * 演示如何使用新的LLM服务进行测试用例生成
 */

const llmService = require('../src/services/callLLM');

async function exampleUsage() {
  console.log('🚀 LLM服务使用示例\n');

  try {
    // 示例1: 基本文本生成
    console.log('📝 示例1: 基本文本生成');
    const content = '请介绍一下测试用例的重要性';
    const result = await llmService.callLLM(content, {
      model: 'qwen2.5-32b',
      temperature: 0.0
    });
    console.log('结果:', result);
    console.log('');

    // 示例2: 生成测试要点
    console.log('📋 示例2: 生成测试要点');
    const documentContent = `
    用户登录功能需求：
    1. 用户输入用户名和密码
    2. 系统验证用户凭据
    3. 登录成功后跳转到主页
    4. 登录失败显示错误信息
    `;
    
    const keyPoints = await llmService.generateTestKeyPoints(documentContent, {
      model: 'qwen2.5-32b',
      temperature: 0.0
    });
    console.log('测试要点:', keyPoints);
    console.log('');

    // 示例3: 生成测试用例
    console.log('🧪 示例3: 生成测试用例');
    const testCases = await llmService.generateTestCases(keyPoints, documentContent, {
      model: 'qwen2.5-32b',
      temperature: 0.0
    });
    console.log('测试用例:', testCases);
    console.log('');

    // 示例4: 生成测试报告
    console.log('📊 示例4: 生成测试报告');
    const testReport = await llmService.generateTestReport(testCases, keyPoints, {
      model: 'qwen2.5-32b',
      temperature: 0.0
    });
    console.log('测试报告:', testReport);
    console.log('');

    // 示例5: 流式输出
    console.log('🌊 示例5: 流式输出');
    await llmService.callLLMStream('请写一个简单的测试用例', (chunk) => {
      if (chunk.type === 'chunk') {
        process.stdout.write(chunk.content);
      } else if (chunk.type === 'complete') {
        console.log('\n✅ 流式输出完成');
      } else if (chunk.type === 'error') {
        console.error('❌ 流式输出错误:', chunk.error);
      }
    }, {
      model: 'qwen2.5-32b',
      temperature: 0.0
    });
  } catch (error) {
    console.error('❌ 示例执行失败:', error.message);
  }
}

// 多模态示例
async function multimodalExample() {
  console.log('\n🖼️ 多模态示例');
  
  try {
    // 模拟图片base64数据
    const base64ImageList = [
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
    ];

    const content = '请分析这张图片中的内容';
    
    const result = await llmService.callLLM(content, {
      model: 'Qwen2.5-VL-72B', // 多模态模型
      base64ImageList: base64ImageList
    });
    
    console.log('多模态分析结果:', result);
    
  } catch (error) {
    console.error('多模态示例失败:', error.message);
  }
}

// 运行示例
async function runExamples() {
  console.log('🎯 开始运行LLM服务示例...\n');
  
  await exampleUsage();
  await multimodalExample();
  
  console.log('\n✅ 所有示例执行完成');
}

// 如果直接运行此文件
if (require.main === module) {
  runExamples().catch(console.error);
}

module.exports = {
  exampleUsage,
  multimodalExample,
  runExamples
}; 