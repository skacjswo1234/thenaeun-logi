/**
 * API 클라이언트 - Cloudflare Workers API와 통신
 */

// API 기본 URL 설정 (로컬 개발시 변경 필요)
const API_BASE_URL = 'https://your-worker-name.your-subdomain.workers.dev/api';

// API 요청 헬퍼 함수
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API 요청 실패');
    }

    return data;
  } catch (error) {
    console.error('API 요청 오류:', error);
    throw error;
  }
}

// 블로그 글 API
export const blogAPI = {
  // 모든 글 조회
  async getAllPosts() {
    return await apiRequest('/posts', { method: 'GET' });
  },

  // 특정 글 조회
  async getPost(id) {
    return await apiRequest(`/posts/${id}`, { method: 'GET' });
  },

  // 새 글 생성
  async createPost(postData) {
    return await apiRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  // 글 수정
  async updatePost(id, postData) {
    return await apiRequest(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  },

  // 글 삭제
  async deletePost(id) {
    return await apiRequest(`/posts/${id}`, { method: 'DELETE' });
  },

  // 글 발행
  async publishPost(id) {
    return await apiRequest(`/posts/${id}/publish`, { method: 'POST' });
  },
};

// 문의하기 API
export const contactAPI = {
  // 문의하기
  async submitContact(contactData) {
    return await apiRequest('/contact', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  },
};

// 기본 export
export default {
  blog: blogAPI,
  contact: contactAPI,
};

