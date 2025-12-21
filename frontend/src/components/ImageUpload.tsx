import { useState, useRef } from 'react';
import { uploadImages } from '../services/drugService';
import { compressImages, formatFileSize } from '../utils/imageCompress';

interface ImageUploadProps {
  onUploadSuccess: (imageIds: string[]) => void;
  onError: (error: string) => void;
}

export const ImageUpload = ({ onUploadSuccess, onError }: ImageUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      
      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
      
      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setCompressing(true);
    setUploading(true);
    
    try {
      // 压缩图片，确保总大小小于 6MB
      const compressedFiles = await compressImages(files, 6 * 1024 * 1024);
      
      // 计算压缩后的总大小
      const totalSize = compressedFiles.reduce((sum, file) => sum + file.size, 0);
      console.log(`压缩完成，总大小: ${formatFileSize(totalSize)}`);
      
      setCompressing(false);
      
      // 上传压缩后的图片
      const responses = await uploadImages(compressedFiles);
      const imageIds = responses.map((r) => r.image_id);
      onUploadSuccess(imageIds);
      setFiles([]);
      setPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('上传错误详情:', error);
      setCompressing(false);
      let errorMessage = '上传失败，请重试';
      
      if (error.response) {
        // 服务器返回了错误响应
        errorMessage = error.response.data?.detail || error.response.data?.message || `服务器错误: ${error.response.status}`;
      } else if (error.request) {
        // 请求已发出但没有收到响应
        errorMessage = '无法连接到服务器，请检查网络连接或确认后端服务是否运行';
      } else {
        // 其他错误（包括压缩错误）
        errorMessage = error.message || '上传失败，请重试';
      }
      
      onError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-gray-600 mb-2">点击或拖拽图片到此处上传</p>
        <p className="text-sm text-gray-400">支持手机拍照或本地上传多张图片</p>
      </div>

      {previews.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`预览 ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || compressing}
            className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {compressing 
              ? '压缩中...' 
              : uploading 
                ? '上传中...' 
                : `上传 ${files.length} 张图片`}
          </button>
          {files.length > 0 && (
            <div className="mt-2 text-sm text-gray-500 text-center">
              总大小: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))} 
              {files.reduce((sum, file) => sum + file.size, 0) > 6 * 1024 * 1024 && (
                <span className="text-orange-600 ml-2">(将自动压缩至 6MB 以内)</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

