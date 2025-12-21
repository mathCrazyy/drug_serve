/**
 * 图片压缩工具
 * 确保压缩后的图片总大小小于指定限制
 */

const MAX_TOTAL_SIZE = 6 * 1024 * 1024; // 6MB
const MAX_WIDTH = 1920; // 最大宽度
const MAX_HEIGHT = 1920; // 最大高度
const DEFAULT_QUALITY = 0.8; // 默认压缩质量

/**
 * 压缩单张图片
 */
export const compressImage = (
  file: File,
  maxWidth: number = MAX_WIDTH,
  maxHeight: number = MAX_HEIGHT,
  quality: number = DEFAULT_QUALITY
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 计算压缩后的尺寸
        let width = img.width;
        let height = img.height;
        
        // 如果图片尺寸超过限制，按比例缩放
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // 创建 canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // 绘制图片
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas 上下文'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为 blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type || 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          file.type || 'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * 批量压缩图片，确保总大小小于限制
 */
export const compressImages = async (
  files: File[],
  maxTotalSize: number = MAX_TOTAL_SIZE
): Promise<File[]> => {
  if (files.length === 0) {
    return [];
  }
  
  // 先尝试压缩所有图片
  const compressedFiles: File[] = [];
  let totalSize = 0;
  let quality = DEFAULT_QUALITY;
  
  // 第一轮：使用默认质量压缩
  for (const file of files) {
    try {
      const compressed = await compressImage(file, MAX_WIDTH, MAX_HEIGHT, quality);
      compressedFiles.push(compressed);
      totalSize += compressed.size;
    } catch (error) {
      console.error('压缩图片失败:', error);
      // 如果压缩失败，使用原文件
      compressedFiles.push(file);
      totalSize += file.size;
    }
  }
  
  // 如果总大小仍然超过限制，需要进一步压缩
  if (totalSize > maxTotalSize) {
    // 计算需要压缩的比例
    const targetRatio = maxTotalSize / totalSize;
    
    // 降低质量，重新压缩
    quality = Math.max(0.3, quality * targetRatio * 0.9); // 最低质量 0.3
    
    compressedFiles.length = 0;
    totalSize = 0;
    
    for (const file of files) {
      try {
        const compressed = await compressImage(file, MAX_WIDTH, MAX_HEIGHT, quality);
        compressedFiles.push(compressed);
        totalSize += compressed.size;
      } catch (error) {
        console.error('压缩图片失败:', error);
        compressedFiles.push(file);
        totalSize += file.size;
      }
    }
    
    // 如果还是超过限制，进一步缩小尺寸
    if (totalSize > maxTotalSize) {
      const sizeRatio = Math.sqrt(maxTotalSize / totalSize);
      const newMaxWidth = Math.floor(MAX_WIDTH * sizeRatio);
      const newMaxHeight = Math.floor(MAX_HEIGHT * sizeRatio);
      
      compressedFiles.length = 0;
      totalSize = 0;
      
      for (const file of files) {
        try {
          const compressed = await compressImage(file, newMaxWidth, newMaxHeight, quality);
          compressedFiles.push(compressed);
          totalSize += compressed.size;
        } catch (error) {
          console.error('压缩图片失败:', error);
          compressedFiles.push(file);
          totalSize += file.size;
        }
      }
    }
  }
  
  // 如果仍然超过限制，按比例分配每张图片的大小
  if (totalSize > maxTotalSize) {
    const maxSizePerFile = Math.floor(maxTotalSize / files.length);
    
    compressedFiles.length = 0;
    
    for (const file of files) {
      try {
        // 根据每张图片的最大大小，计算合适的质量
        const fileSize = file.size;
        const targetSize = maxSizePerFile;
        
        if (fileSize <= targetSize) {
          compressedFiles.push(file);
        } else {
          // 计算需要的压缩比例
          const compressionRatio = targetSize / fileSize;
          const newQuality = Math.max(0.2, quality * compressionRatio);
          
          // 估算需要的尺寸
          const estimatedSizeRatio = Math.sqrt(compressionRatio);
          const newWidth = Math.floor(MAX_WIDTH * estimatedSizeRatio);
          const newHeight = Math.floor(MAX_HEIGHT * estimatedSizeRatio);
          
          const compressed = await compressImage(file, newWidth, newHeight, newQuality);
          compressedFiles.push(compressed);
        }
      } catch (error) {
        console.error('压缩图片失败:', error);
        compressedFiles.push(file);
      }
    }
  }
  
  return compressedFiles;
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

