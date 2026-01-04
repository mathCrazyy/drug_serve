/**
 * ESA 边缘函数 - 药品识别与提醒系统 API（单文件版本）
 * 
 * 基于 Web Service Worker API 实现
 * 所有模块已合并到此文件中，可直接复制到 ESA 边缘函数编辑器
 */

// ============================================================================
// 1. 边缘存储配置和 OSS 服务类
// ============================================================================

const STORAGE_CONFIG = {
  region: typeof ENV !== 'undefined' ? ENV.ESA_STORAGE_REGION : 'cn-hangzhou',
  accessKeyId: typeof ENV !== 'undefined' ? ENV.ESA_STORAGE_ACCESS_KEY_ID : '',
  accessKeySecret: typeof ENV !== 'undefined' ? ENV.ESA_STORAGE_ACCESS_KEY_SECRET : '',
  bucket: typeof ENV !== 'undefined' ? ENV.ESA_STORAGE_BUCKET : '',
  endpoint: typeof ENV !== 'undefined' ? ENV.ESA_STORAGE_ENDPOINT : '',
};

const STORAGE_BASE_URL = STORAGE_CONFIG.endpoint 
  ? STORAGE_CONFIG.endpoint
  : `https://${STORAGE_CONFIG.bucket}.${STORAGE_CONFIG.region}.aliyuncs.com`;

/**
 * 生成 OSS 签名认证
 */
function generateOSSAuth(method, objectName, contentType = '') {
  const date = new Date().toUTCString();
  const stringToSign = `${method}\n\n${contentType}\n${date}\n/${STORAGE_CONFIG.bucket}/${objectName}`;
  // 注意：实际实现需要使用正确的 OSS 签名算法
  // 这里提供基本结构，实际使用时需要根据 ESA 边缘存储的认证方式调整
  return `OSS ${STORAGE_CONFIG.accessKeyId}:temp-signature`;
}

/**
 * ESA 边缘存储服务类
 */
class OSS {
  static async uploadFile(fileName, fileBuffer, contentType) {
    try {
      const url = `${STORAGE_BASE_URL}/${fileName}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'Authorization': generateOSSAuth('PUT', fileName, contentType),
        },
        body: fileBuffer,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      return url;
    } catch (error) {
      console.error('Error uploading file to OSS:', error);
      throw error;
    }
  }

  static async getImageData(imageId) {
    try {
      const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
      
      for (const ext of extensions) {
        const fileName = `uploads/${imageId}${ext}`;
        const url = `${STORAGE_BASE_URL}/${fileName}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': generateOSSAuth('GET', fileName),
          },
        });

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return {
            id: imageId,
            data: arrayBuffer,
            url: url,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting image data:', error);
      return null;
    }
  }

  static async getDrugs() {
    try {
      const fileName = 'data/drugs.json';
      const url = `${STORAGE_BASE_URL}/${fileName}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': generateOSSAuth('GET', fileName),
        },
      });

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to get drugs: ${response.statusText}`);
      }

      const drugs = await response.json();
      return Array.isArray(drugs) ? drugs : [];
    } catch (error) {
      console.error('Error getting drugs:', error);
      return [];
    }
  }

  static async getDrug(drugId) {
    try {
      const drugs = await this.getDrugs();
      return drugs.find(drug => drug.id === drugId) || null;
    } catch (error) {
      console.error('Error getting drug:', error);
      return null;
    }
  }

  static async saveDrug(drug) {
    try {
      const drugs = await this.getDrugs();
      drugs.push(drug);
      await this.saveDrugs(drugs);
      return drug;
    } catch (error) {
      console.error('Error saving drug:', error);
      throw error;
    }
  }

  static async updateDrug(drugId, updates) {
    try {
      const drugs = await this.getDrugs();
      const index = drugs.findIndex(drug => drug.id === drugId);
      
      if (index === -1) {
        throw new Error('Drug not found');
      }

      drugs[index] = { ...drugs[index], ...updates };
      await this.saveDrugs(drugs);
      return drugs[index];
    } catch (error) {
      console.error('Error updating drug:', error);
      throw error;
    }
  }

  static async deleteDrug(drugId) {
    try {
      const drugs = await this.getDrugs();
      const filteredDrugs = drugs.filter(drug => drug.id !== drugId);
      await this.saveDrugs(filteredDrugs);
    } catch (error) {
      console.error('Error deleting drug:', error);
      throw error;
    }
  }

  static async searchDrugs(query) {
    try {
      const drugs = await this.getDrugs();
      const lowerQuery = query.toLowerCase();
      return drugs.filter(drug => 
        drug.name && drug.name.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching drugs:', error);
      return [];
    }
  }

  static async saveDrugs(drugs) {
    try {
      const fileName = 'data/drugs.json';
      const url = `${STORAGE_BASE_URL}/${fileName}`;
      const content = JSON.stringify(drugs, null, 2);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': generateOSSAuth('PUT', fileName, 'application/json'),
        },
        body: content,
      });

      if (!response.ok) {
        throw new Error(`Failed to save drugs: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving drugs:', error);
      throw error;
    }
  }
}

// ============================================================================
// 2. 边缘缓存服务类
// ============================================================================

class Cache {
  static async get(key) {
    try {
      const cache = caches.default;
      const cacheKey = new Request(`https://cache.drug-serve.com/${key}`);
      const cached = await cache.match(cacheKey);
      
      if (cached) {
        const data = await cached.json();
        const expires = data.expires;
        if (expires && Date.now() > expires) {
          await cache.delete(cacheKey);
          return null;
        }
        return data.value;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  static async set(key, value, ttl = 300) {
    try {
      const cache = caches.default;
      const cacheKey = new Request(`https://cache.drug-serve.com/${key}`);
      
      const data = {
        value: value,
        expires: Date.now() + (ttl * 1000),
        cachedAt: Date.now(),
      };

      const response = new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `max-age=${ttl}`,
        },
      });

      await cache.put(cacheKey, response);
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  static async delete(key) {
    try {
      const cache = caches.default;
      const cacheKey = new Request(`https://cache.drug-serve.com/${key}`);
      await cache.delete(cacheKey);
    } catch (error) {
      console.error('Error deleting cache:', error);
    }
  }
}

// ============================================================================
// 3. 豆包 API 服务类
// ============================================================================

class DoubaoAPI {
  static get API_BASE_URL() {
    return typeof ENV !== 'undefined' && ENV.API_BASE_URL 
      ? ENV.API_BASE_URL 
      : 'https://ark.cn-beijing.volces.com/api/v3';
  }
  
  static get API_KEY() {
    return typeof ENV !== 'undefined' && ENV.API_KEY 
      ? ENV.API_KEY 
      : '';
  }
  
  static get MODEL_ID() {
    return typeof ENV !== 'undefined' && ENV.MODEL_ID 
      ? ENV.MODEL_ID 
      : 'doubao-1.5-vision-pro-250328';
  }

  static async analyzeDrugImages(imageDataList) {
    try {
      const prompt = `请识别这些药品图片中的所有文字信息，这些图片是同一个药品的不同角度或不同面。请综合分析所有图片，提取以下信息并以JSON格式返回：
{"name": "药品名称", "brand": "品牌", "manufacturer": "生产厂家", "production_date": "生产日期", "expiry_date": "有效期", "batch_number": "批号", "dosage_form": "剂型", "strength": "规格"}

如果没有则对应字段返回null。请确保日期格式为YYYY-MM-DD。`;

      const contentItems = [
        {
          type: 'text',
          text: prompt
        }
      ];

      for (const imageData of imageDataList) {
        const base64 = await arrayBufferToBase64(imageData.data);
        contentItems.push({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64}`
          }
        });
      }

      const response = await fetch(`${this.API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model: this.MODEL_ID,
          messages: [
            {
              role: 'user',
              content: contentItems
            }
          ],
          max_tokens: 2000,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error(`API认证失败 (401): 请检查 API_KEY 是否正确。错误详情: ${errorText}`);
        } else if (response.status === 404) {
          throw new Error(`API端点不存在 (404): 请检查 API_BASE_URL 和 MODEL_ID 是否正确。错误详情: ${errorText}`);
        } else {
          throw new Error(`API返回错误 (状态码: ${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      
      let result = {};
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        result = this.extractJSON(content);
      }

      return result;
    } catch (error) {
      console.error('Error analyzing drug images:', error);
      throw error;
    }
  }

  static extractJSON(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {
          // 忽略
        }
      }

      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try {
          return JSON.parse(braceMatch[0]);
        } catch (e3) {
          // 忽略
        }
      }

      return {};
    }
  }
}

/**
 * 将 ArrayBuffer 转换为 Base64
 */
async function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ============================================================================
// 4. 主 API 处理逻辑
// ============================================================================

// 处理请求
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // CORS 处理
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // 处理 OPTIONS 预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let response;

    // 路由处理
    if (path === '/' || path === '/api') {
      response = new Response(
        JSON.stringify({ 
          message: '药品识别与提醒系统 API',
          docs: '/docs'
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    } else if (path.startsWith('/api/drugs')) {
      response = await handleDrugsAPI(request, path, method);
    } else {
      response = new Response('Not Found', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    // 添加 CORS 头
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
}

/**
 * 处理药品相关 API
 */
async function handleDrugsAPI(request, path, method) {
  const url = new URL(request.url);

  // GET /api/drugs - 获取药品列表
  if (path === '/api/drugs' && method === 'GET') {
    return await getDrugs(request, url);
  }

  // POST /api/drugs/upload - 上传图片
  if (path === '/api/drugs/upload' && method === 'POST') {
    return await uploadImages(request);
  }

  // POST /api/drugs/analyze-batch - 批量分析图片
  if (path === '/api/drugs/analyze-batch' && method === 'POST') {
    return await analyzeBatchImages(request);
  }

  // GET /api/drugs/:id - 获取单个药品
  const drugIdMatch = path.match(/^\/api\/drugs\/([^\/]+)$/);
  if (drugIdMatch) {
    const drugId = drugIdMatch[1];
    if (method === 'GET') {
      return await getDrug(drugId);
    }
    if (method === 'PUT') {
      return await updateDrug(drugId, request);
    }
    if (method === 'DELETE') {
      return await deleteDrug(drugId);
    }
  }

  // GET /api/drugs/search?q=xxx - 搜索药品
  if (path === '/api/drugs/search' && method === 'GET') {
    return await searchDrugs(url);
  }

  return new Response('Not Found', { status: 404 });
}

/**
 * 获取药品列表
 */
async function getDrugs(request, url) {
  try {
    const cacheKey = 'drugs:list';
    const cached = await Cache.get(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const drugs = await OSS.getDrugs();
    await Cache.set(cacheKey, drugs, 300);

    return new Response(JSON.stringify(drugs), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting drugs:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get drugs', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 上传图片
 */
async function uploadImages(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    
    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No files uploaded' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const uploadedFiles = [];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ 
            error: `File ${file.name} exceeds size limit (10MB)` 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const fileId = generateFileId();
      const fileExt = getFileExtension(file.name);
      const fileName = `${fileId}${fileExt}`;
      
      const fileBuffer = await file.arrayBuffer();
      const fileUrl = await OSS.uploadFile(fileName, fileBuffer, file.type);

      uploadedFiles.push({
        image_id: fileId,
        image_url: fileUrl,
        message: '上传成功'
      });
    }

    return new Response(JSON.stringify(uploadedFiles), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload images', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 批量分析图片
 */
async function analyzeBatchImages(request) {
  try {
    const body = await request.json();
    const imageIds = body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid image IDs' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const imageDataList = [];
    for (const imageId of imageIds) {
      const imageData = await OSS.getImageData(imageId);
      if (imageData) {
        imageDataList.push(imageData);
      }
    }

    if (imageDataList.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const analysisResult = await DoubaoAPI.analyzeDrugImages(imageDataList);

    const imageUrls = [];
    for (const imageData of imageDataList) {
      if (imageData && imageData.url) {
        imageUrls.push(imageData.url);
      }
    }
    
    if (imageUrls.length === 0) {
      for (const imageId of imageIds) {
        imageUrls.push(`/uploads/${imageId}.jpg`);
      }
    }
    
    const drug = {
      id: generateFileId(),
      name: analysisResult.name || '未知药品',
      production_date: analysisResult.production_date || null,
      expiry_date: analysisResult.expiry_date || null,
      image_url: imageUrls[0] || null,
      image_urls: JSON.stringify(imageUrls),
      created_at: new Date().toISOString(),
      analysis_result: JSON.stringify(analysisResult)
    };

    await OSS.saveDrug(drug);
    await Cache.delete('drugs:list');

    return new Response(JSON.stringify(drug), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error analyzing images:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze images', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 获取单个药品
 */
async function getDrug(drugId) {
  try {
    const drug = await OSS.getDrug(drugId);
    if (!drug) {
      return new Response(
        JSON.stringify({ error: 'Drug not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify(drug), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting drug:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get drug', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 更新药品
 */
async function updateDrug(drugId, request) {
  try {
    const body = await request.json();
    const drug = await OSS.updateDrug(drugId, body);
    await Cache.delete('drugs:list');
    
    return new Response(JSON.stringify(drug), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating drug:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update drug', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 删除药品
 */
async function deleteDrug(drugId) {
  try {
    await OSS.deleteDrug(drugId);
    await Cache.delete('drugs:list');
    
    return new Response(JSON.stringify({ message: 'Drug deleted' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting drug:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete drug', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 搜索药品
 */
async function searchDrugs(url) {
  try {
    const query = url.searchParams.get('q') || '';
    const drugs = await OSS.searchDrugs(query);
    return new Response(JSON.stringify(drugs), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error searching drugs:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to search drugs', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 工具函数
 */
function generateFileId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '.jpg';
}

