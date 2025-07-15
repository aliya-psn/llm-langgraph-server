#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 系统启动脚本
 * 帮助用户快速配置和启动系统
 */
class StartupScript {
  constructor() {
    this.projectRoot = __dirname;
    this.envFile = path.join(this.projectRoot, '.env');
    this.envExample = path.join(this.projectRoot, 'env.example');
  }

  /**
   * 运行启动流程
   */
  async run() {
    console.log('🚀 欢迎使用测试用例生成系统！\n');
    
    try {
      // 检查环境配置
      await this.checkEnvironment();
      
      // 安装依赖
      await this.installDependencies();
      
      // 运行系统测试
      await this.runSystemTests();
      
      // 启动服务
      await this.startServices();
      
    } catch (error) {
      console.error('❌ 启动失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 检查环境配置
   */
  async checkEnvironment() {
    console.log('🔧 检查环境配置...');
    
    // 检查Node.js版本
    const nodeVersion = process.version;
    console.log(`📦 Node.js版本: ${nodeVersion}`);
    
    // 检查npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`📦 npm版本: ${npmVersion}`);
    } catch (error) {
      throw new Error('npm未安装或无法访问');
    }
    
    // 检查环境变量文件
    if (!fs.existsSync(this.envFile)) {
      console.log('📝 创建环境配置文件...');
      await this.createEnvFile();
    } else {
      console.log('✅ 环境配置文件已存在');
    }
    
    // 检查API密钥
    await this.checkAPIKey();
  }

  /**
   * 创建环境配置文件
   */
  async createEnvFile() {
    try {
      if (fs.existsSync(this.envExample)) {
        fs.copyFileSync(this.envExample, this.envFile);
        console.log('✅ 环境配置文件已创建');
        console.log('⚠️ 请编辑 .env 文件，配置您的OpenAI API密钥');
      } else {
        throw new Error('env.example 文件不存在');
      }
    } catch (error) {
      throw new Error(`创建环境配置文件失败: ${error.message}`);
    }
  }

  /**
   * 检查API密钥
   */
  async checkAPIKey() {
    const envContent = fs.readFileSync(this.envFile, 'utf8');
    const apiKeyMatch = envContent.match(/API_KEY=(.+)/);
    
    if (!apiKeyMatch || apiKeyMatch[1] === 'your_api_key_here') {
      console.log('⚠️ 请配置API密钥:');
      console.log('1. 获取您的API密钥');
      console.log('2. 编辑 .env 文件，将密钥填入 API_KEY=');
      console.log('3. 确保 BASE_URL 指向正确的服务器地址');
      console.log('');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      return new Promise((resolve) => {
        rl.question('是否继续启动系统？(y/n): ', (answer) => {
          rl.close();
          if (answer.toLowerCase() !== 'y') {
            process.exit(0);
          }
          resolve();
        });
      });
    } else {
      console.log('✅ API密钥已配置');
    }
  }

  /**
   * 安装依赖
   */
  async installDependencies() {
    console.log('\n📦 安装项目依赖...');
    
    try {
      execSync('npm install', { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      console.log('✅ 依赖安装完成');
    } catch (error) {
      throw new Error('依赖安装失败，请检查网络连接和npm配置');
    }
  }

  /**
   * 运行系统测试
   */
  async runSystemTests() {
    console.log('\n🧪 运行系统测试...');
    
    try {
      execSync('npm run test:system', { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      console.log('✅ 系统测试完成');
    } catch (error) {
      console.log('⚠️ 系统测试失败，但可以继续启动服务');
    }
  }

  /**
   * 启动服务
   */
  async startServices() {
    console.log('\n🚀 启动服务...');
    console.log('📋 服务信息:');
    console.log('   - API文档: http://localhost:3000/health');
    console.log('   - WebSocket: ws://localhost:3001');
    console.log('');
    console.log('按 Ctrl+C 停止服务');
    console.log('');
    
    try {
      execSync('npm run dev', { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
    } catch (error) {
      if (error.signal === 'SIGINT') {
        console.log('\n👋 服务已停止');
      } else {
        throw new Error(`服务启动失败: ${error.message}`);
      }
    }
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log('📖 使用说明:');
    console.log('');
    console.log('1. 配置环境:');
    console.log('   - 复制 env.example 为 .env');
    console.log('   - 编辑 .env 文件，配置OpenAI API密钥');
    console.log('');
    console.log('2. 安装依赖:');
    console.log('   npm install');
    console.log('');
    console.log('3. 启动服务:');
    console.log('   npm run dev');
    console.log('');
    console.log('4. 访问系统:');
    console.log('   http://localhost:3000');
    console.log('');
    console.log('5. 运行测试:');
    console.log('   npm run test:system');
    console.log('');
  }
}

// 主函数
async function main() {
  const startup = new StartupScript();
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    startup.showHelp();
    return;
  }
  
  await startup.run();
}

// 运行启动脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = StartupScript; 