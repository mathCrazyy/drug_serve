import { useState } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { DrugList } from './components/DrugList';
import { analyzeBatchImages } from './services/drugService';

function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'list'>('upload');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUploadSuccess = async (imageIds: string[]) => {
    setMessage({ type: 'success', text: `成功上传 ${imageIds.length} 张图片，正在分析...` });
    
    try {
      // 使用批量分析接口，将多张图片作为同一药品一起分析
      await analyzeBatchImages(imageIds);
      setMessage({ type: 'success', text: '分析完成！' });
      setTimeout(() => {
        setActiveTab('list');
        setMessage(null);
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || '分析失败，请重试' });
    }
  };

  const handleError = (error: string) => {
    setMessage({ type: 'error', text: error });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">药品识别与提醒系统</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'upload'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              上传图片
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'list'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              药品列表
            </button>
          </nav>
        </div>

        {activeTab === 'upload' ? (
          <ImageUpload onUploadSuccess={handleUploadSuccess} onError={handleError} />
        ) : (
          <DrugList />
        )}
      </main>
    </div>
  );
}

export default App;

