import { useState, useEffect } from 'react';
import { DrugInfo } from '../types';
import { DrugCard } from './DrugCard';
import { getDrugs, deleteDrug, searchDrugs } from '../services/drugService';
import { getExpiryStatus } from '../utils/dateUtils';

type FilterType = 'all' | 'expiring' | 'expired';

export const DrugList = () => {
  const [drugs, setDrugs] = useState<DrugInfo[]>([]);
  const [filteredDrugs, setFilteredDrugs] = useState<DrugInfo[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDrugs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDrugs();
      setDrugs(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrugs();
  }, []);

  // 搜索和筛选逻辑
  useEffect(() => {
    let result = [...drugs];

    // 应用筛选
    if (filter !== 'all') {
      result = result.filter((drug) => {
        const status = getExpiryStatus(drug.expiry_date);
        if (filter === 'expiring') return status === 'expiring' || status === 'expired';
        if (filter === 'expired') return status === 'expired';
        return true;
      });
    }

    // 应用搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((drug) => {
        const name = (drug.name || '').toLowerCase();
        return name.includes(query);
      });
    }

    // 按过期时间排序
    result.sort((a, b) => {
      const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : 0;
      const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : 0;
      return dateA - dateB;
    });

    setFilteredDrugs(result);
  }, [drugs, filter, searchQuery]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDrug(id);
      setDrugs((prev) => prev.filter((drug) => drug.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || '删除失败，请重试');
    }
  };

  const handleUpdate = () => {
    loadDrugs();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadDrugs}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* 搜索框 */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索药品名称..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 筛选按钮 */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          全部 ({drugs.length})
        </button>
        <button
          onClick={() => setFilter('expiring')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'expiring'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          即将过期
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'expired'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          已过期
        </button>
      </div>

      {filteredDrugs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {searchQuery ? `未找到包含"${searchQuery}"的药品` : '暂无药品记录'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDrugs.map((drug) => (
            <DrugCard
              key={drug.id}
              drug={drug}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
