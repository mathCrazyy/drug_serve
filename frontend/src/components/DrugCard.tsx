import { useState } from 'react';
import { DrugInfo } from '../types';
import { getExpiryStatus, formatDate, calculateDaysUntilExpiry } from '../utils/dateUtils';
import { updateDrug } from '../services/drugService';

interface DrugCardProps {
  drug: DrugInfo;
  onDelete: (id: string) => void;
  onUpdate?: () => void;
}

export const DrugCard = ({ drug, onDelete, onUpdate }: DrugCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDrug, setEditedDrug] = useState<DrugInfo>(drug);
  const [saving, setSaving] = useState(false);

  const status = getExpiryStatus(editedDrug.expiry_date);
  const daysUntilExpiry = calculateDaysUntilExpiry(editedDrug.expiry_date);

  const statusColors = {
    normal: 'bg-green-100 text-green-800 border-green-300',
    expiring: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    expired: 'bg-red-100 text-red-800 border-red-300',
  };

  const statusText = {
    normal: '正常',
    expiring: '即将过期',
    expired: '已过期',
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateDrug(editedDrug.id, {
        name: editedDrug.name,
        production_date: editedDrug.production_date || null,
        expiry_date: editedDrug.expiry_date || null,
      });
      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedDrug(drug);
    setIsEditing(false);
  };

  const getImageUrls = (): string[] => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const urls: string[] = [];
    
    // 处理 image_urls（可能是JSON字符串或数组）
    if (editedDrug.image_urls) {
      let urlList: string[] = [];
      if (typeof editedDrug.image_urls === 'string') {
        try {
          urlList = JSON.parse(editedDrug.image_urls);
        } catch {
          // 如果不是JSON，可能是单个URL
          urlList = [editedDrug.image_urls];
        }
      } else if (Array.isArray(editedDrug.image_urls)) {
        urlList = editedDrug.image_urls;
      }
      
      for (const url of urlList) {
        if (url) {
          if (url.startsWith('/')) {
            urls.push(`${apiBase}${url}`);
          } else {
            urls.push(url);
          }
        }
      }
    }
    
    // 兼容旧数据：如果有 image_url 但没有 image_urls
    if (urls.length === 0 && editedDrug.image_url) {
      if (editedDrug.image_url.startsWith('/')) {
        urls.push(`${apiBase}${editedDrug.image_url}`);
      } else {
        urls.push(editedDrug.image_url);
      }
    }
    
    return urls;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-3">
        {isEditing ? (
          <input
            type="text"
            value={editedDrug.name}
            onChange={(e) => setEditedDrug({ ...editedDrug, name: e.target.value })}
            className="flex-1 text-lg font-semibold text-gray-800 border border-gray-300 rounded px-2 py-1 mr-2"
            placeholder="药品名称"
          />
        ) : (
          <h3 className="text-lg font-semibold text-gray-800">{editedDrug.name || '未知药品'}</h3>
        )}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-blue-500 hover:text-blue-700 text-sm disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                取消
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                编辑
              </button>
              <button
                onClick={() => onDelete(editedDrug.id)}
                className="text-red-500 hover:text-red-700 text-xl"
              >
                ×
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div>
          <span className="font-medium">生产日期：</span>
          {isEditing ? (
            <input
              type="date"
              value={editedDrug.production_date || ''}
              onChange={(e) => setEditedDrug({ ...editedDrug, production_date: e.target.value })}
              className="ml-2 border border-gray-300 rounded px-2 py-1"
            />
          ) : (
            <span>{formatDate(editedDrug.production_date) || '未获取到'}</span>
          )}
        </div>
        <div>
          <span className="font-medium">有效期至：</span>
          {isEditing ? (
            <input
              type="date"
              value={editedDrug.expiry_date || ''}
              onChange={(e) => setEditedDrug({ ...editedDrug, expiry_date: e.target.value })}
              className="ml-2 border border-gray-300 rounded px-2 py-1"
            />
          ) : (
            <span>{formatDate(editedDrug.expiry_date) || '未获取到'}</span>
          )}
        </div>
        
        {/* 图片缩略图 - 支持多张图片 */}
        {getImageUrls().length > 0 && (
          <div className="mt-3">
            <div className="grid grid-cols-2 gap-2">
              {getImageUrls().map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`${editedDrug.name} - 图片 ${index + 1}`}
                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.open(url, '_blank')}
                  onError={(e) => {
                    // 图片加载失败时隐藏
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ))}
            </div>
            {getImageUrls().length > 1 && (
              <p className="text-xs text-gray-500 mt-1 text-center">
                共 {getImageUrls().length} 张图片，点击查看大图
              </p>
            )}
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="mt-3 pt-3 border-t">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}
          >
            {statusText[status]}
            {status === 'expiring' && ` (${daysUntilExpiry} 天后过期)`}
            {status === 'expired' && ` (已过期 ${Math.abs(daysUntilExpiry)} 天)`}
          </span>
        </div>
      )}
    </div>
  );
};
