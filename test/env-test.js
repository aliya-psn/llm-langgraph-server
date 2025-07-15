/**
 * 环境变量测试脚本
 * 验证.env文件是否正确读取
 */

require('dotenv').config();

console.log('🔧 环境变量测试');
console.log('='.repeat(50));

// 测试必要的环境变量
const requiredEnvVars = [
  'API_KEY',
  'DEFAULT_MODEL', 
  'BASE_URL',
  'PORT',
  'NODE_ENV'
];

console.log('📋 环境变量检查:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = varName === 'API_KEY' ? 
    (value ? `${value.substring(0, 10)}...` : '未设置') : 
    (value || '未设置');
  
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n🔍 详细配置:');
console.log(`  - API_KEY: ${process.env.API_KEY ? '已配置' : '未配置'}`);
console.log(`  - DEFAULT_MODEL: ${process.env.DEFAULT_MODEL}`);
console.log(`  - BASE_URL: ${process.env.BASE_URL}`);
console.log(`  - PORT: ${process.env.PORT}`);
console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// 测试LLM服务配置
console.log('\n🤖 LLM服务配置测试:');
try {
  const llmService = require('../src/services/callLLM');
  console.log(`  - 默认模型: ${llmService.defaultModel}`);
  console.log(`  - API密钥: ${llmService.apiKey ? '已配置' : '未配置'}`);
  console.log(`  - 基础URL: ${llmService.baseUrl}`);
} catch (error) {
  console.error('❌ LLM服务加载失败:', error.message);
}

console.log('\n✅ 环境变量测试完成'); 