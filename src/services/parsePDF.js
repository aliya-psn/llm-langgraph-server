const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');

/**
 * PDF解析服务
 * 支持文本提取、页面信息获取等功能
 */
class PDFParser {
  constructor() {
    this.supportedFormats = ['.pdf'];
  }

  /**
   * 解析PDF文件
   * @param {string} filePath - PDF文件路径
   * @returns {Promise<Object>} 解析结果
   */
  async parsePDF(filePath) {
    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error('文件不存在');
      }

      // 检查文件格式
      const ext = path.extname(filePath).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        throw new Error('不支持的文件格式，仅支持PDF文件');
      }

      // 读取文件
      const dataBuffer = fs.readFileSync(filePath);
      
      // 解析PDF
      const data = await pdfParse(dataBuffer);
      
      // 提取有用信息
      const result = {
        text: data.text,
        pageCount: data.numpages,
        info: data.info,
        metadata: data.metadata,
        version: data.version,
        fileName: path.basename(filePath),
        fileSize: dataBuffer.length,
        parsedAt: new Date().toISOString()
      };

      console.log(`📄 PDF解析完成: ${result.fileName}, 页数: ${result.pageCount}`);
      
      return result;
    } catch (error) {
      console.error('PDF解析错误:', error);
      throw new Error(`PDF解析失败: ${error.message}`);
    }
  }

  /**
   * 提取PDF文本内容
   * @param {string} filePath - PDF文件路径
   * @returns {Promise<string>} 文本内容
   */
  async extractText(filePath) {
    const result = await this.parsePDF(filePath);
    return result.text;
  }

  /**
   * 获取PDF基本信息
   * @param {string} filePath - PDF文件路径
   * @returns {Promise<Object>} 基本信息
   */
  async getInfo(filePath) {
    const result = await this.parsePDF(filePath);
    return {
      fileName: result.fileName,
      pageCount: result.pageCount,
      fileSize: result.fileSize,
      info: result.info
    };
  }

  /**
   * 验证PDF文件
   * @param {string} filePath - PDF文件路径
   * @returns {Promise<boolean>} 是否有效
   */
  async validatePDF(filePath) {
    try {
      await this.parsePDF(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 清理临时文件
   * @param {string} filePath - 文件路径
   */
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ 已清理临时文件: ${filePath}`);
      }
    } catch (error) {
      console.error('清理文件失败:', error);
    }
  }
}

// 创建单例实例
const pdfParser = new PDFParser();

module.exports = pdfParser; 