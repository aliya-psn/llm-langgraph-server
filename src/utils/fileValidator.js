const path = require('path');
const fs = require('fs');

require('dotenv').config();

/**
 * 文件验证工具
 * 用于验证上传文件的格式、大小等
 */
class FileValidator {
  constructor() {
    this.supportedFormats = ['.pdf'];
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'application/pdf',
      'application/octet-stream'
    ];
  }

  /**
   * 验证上传的文件
   * @param {Object} file - 上传的文件对象
   * @returns {Object} 验证结果
   */
  validateFile(file) {
    try {
      // 检查文件是否存在
      if (!file) {
        return {
          valid: false,
          message: '没有上传文件'
        };
      }

      // 检查文件大小
      if (file.size > this.maxFileSize) {
        return {
          valid: false,
          message: `文件大小超过限制 (最大 ${this.formatFileSize(this.maxFileSize)})`
        };
      }

      // 检查文件扩展名
      const ext = path.extname(file.name).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        return {
          valid: false,
          message: `不支持的文件格式，仅支持: ${this.supportedFormats.join(', ')}`
        };
      }

      // 检查MIME类型
      if (file.mimetype && !this.allowedMimeTypes.includes(file.mimetype)) {
        return {
          valid: false,
          message: `不支持的文件类型: ${file.mimetype}`
        };
      }

      // 检查文件名
      if (!file.name || file.name.trim().length === 0) {
        return {
          valid: false,
          message: '文件名不能为空'
        };
      }

      // 检查文件名长度
      if (file.name.length > 255) {
        return {
          valid: false,
          message: '文件名过长'
        };
      }

      // 检查文件名中的特殊字符
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(file.name)) {
        return {
          valid: false,
          message: '文件名包含无效字符'
        };
      }

      return {
        valid: true,
        message: '文件验证通过'
      };

    } catch (error) {
      console.error('文件验证错误:', error);
      return {
        valid: false,
        message: '文件验证过程中发生错误'
      };
    }
  }

  /**
   * 验证文件路径
   * @param {string} filePath - 文件路径
   * @returns {Object} 验证结果
   */
  validateFilePath(filePath) {
    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return {
          valid: false,
          message: '文件不存在'
        };
      }

      // 检查文件大小
      const stats = fs.statSync(filePath);
      if (stats.size > this.maxFileSize) {
        return {
          valid: false,
          message: `文件大小超过限制 (最大 ${this.formatFileSize(this.maxFileSize)})`
        };
      }

      // 检查文件扩展名
      const ext = path.extname(filePath).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        return {
          valid: false,
          message: `不支持的文件格式，仅支持: ${this.supportedFormats.join(', ')}`
        };
      }

      return {
        valid: true,
        message: '文件路径验证通过'
      };

    } catch (error) {
      console.error('文件路径验证错误:', error);
      return {
        valid: false,
        message: '文件路径验证过程中发生错误'
      };
    }
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取文件信息
   * @param {Object} file - 文件对象
   * @returns {Object} 文件信息
   */
  getFileInfo(file) {
    return {
      name: file.name,
      size: file.size,
      sizeFormatted: this.formatFileSize(file.size),
      mimetype: file.mimetype,
      extension: path.extname(file.name).toLowerCase(),
      uploadTime: new Date().toISOString()
    };
  }

  /**
   * 清理临时文件
   * @param {string} filePath - 文件路径
   */
  cleanupTempFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ 已清理临时文件: ${filePath}`);
      }
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }
  }
}

// 创建单例实例
const fileValidator = new FileValidator();

module.exports = fileValidator; 