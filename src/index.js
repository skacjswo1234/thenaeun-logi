/**
 * Cloudflare Workers API - 블로그 자동 배포 시스템
 * 
 * API 엔드포인트:
 * GET  /api/posts - 모든 글 조회
 * GET  /api/posts/:id - 특정 글 조회
 * POST /api/posts - 새 글 생성
 * PUT  /api/posts/:id - 글 수정
 * DELETE /api/posts/:id - 글 삭제
 * POST /api/posts/:id/publish - 글 발행
 * POST /api/contact - 문의하기 (기존 문의폼 연동)
 */

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// CORS 응답 처리
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// 에러 응답 생성
function errorResponse(message, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// 성공 응답 생성
function successResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// ID 생성 (간단한 UUID 스타일)
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 모든 블로그 글 조회
async function getAllPosts(env) {
  try {
    // KV에서 모든 키 조회
    const keys = await env.BLOG_STORAGE.list();
    const posts = [];

    // 각 키에 대해 값 가져오기
    for (const key of keys.keys) {
      const value = await env.BLOG_STORAGE.get(key.name);
      if (value) {
        posts.push(JSON.parse(value));
      }
    }

    // 날짜순으로 정렬 (최신순)
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return successResponse({ posts, total: posts.length });
  } catch (error) {
    return errorResponse(`글 조회 실패: ${error.message}`, 500);
  }
}

// 특정 블로그 글 조회
async function getPostById(env, id) {
  try {
    const postData = await env.BLOG_STORAGE.get(`post:${id}`);
    
    if (!postData) {
      return errorResponse('글을 찾을 수 없습니다.', 404);
    }

    return successResponse(JSON.parse(postData));
  } catch (error) {
    return errorResponse(`글 조회 실패: ${error.message}`, 500);
  }
}

// 새 블로그 글 생성
async function createPost(env, request) {
  try {
    const data = await request.json();
    
    // 필수 필드 검증
    if (!data.title || !data.content) {
      return errorResponse('제목과 내용은 필수입니다.');
    }

    const post = {
      id: generateId(),
      title: data.title,
      content: data.content,
      platform: data.platform || 'naver', // naver, tistory, brunch 등
      category: data.category || '',
      tags: data.tags || [],
      status: data.status || 'draft', // draft, scheduled, published
      scheduledAt: data.scheduledAt || null,
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: data.metadata || {},
    };

    // KV에 저장
    await env.BLOG_STORAGE.put(`post:${post.id}`, JSON.stringify(post));

    return successResponse(post, 201);
  } catch (error) {
    return errorResponse(`글 생성 실패: ${error.message}`, 500);
  }
}

// 블로그 글 수정
async function updatePost(env, id, request) {
  try {
    const existingData = await env.BLOG_STORAGE.get(`post:${id}`);
    
    if (!existingData) {
      return errorResponse('글을 찾을 수 없습니다.', 404);
    }

    const existing = JSON.parse(existingData);
    const updates = await request.json();

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // ID는 변경 불가
      createdAt: existing.createdAt, // 생성일은 변경 불가
      updatedAt: new Date().toISOString(),
    };

    await env.BLOG_STORAGE.put(`post:${id}`, JSON.stringify(updated));

    return successResponse(updated);
  } catch (error) {
    return errorResponse(`글 수정 실패: ${error.message}`, 500);
  }
}

// 블로그 글 삭제
async function deletePost(env, id) {
  try {
    const existingData = await env.BLOG_STORAGE.get(`post:${id}`);
    
    if (!existingData) {
      return errorResponse('글을 찾을 수 없습니다.', 404);
    }

    await env.BLOG_STORAGE.delete(`post:${id}`);

    return successResponse({ message: '글이 삭제되었습니다.', id });
  } catch (error) {
    return errorResponse(`글 삭제 실패: ${error.message}`, 500);
  }
}

// 글 발행 (자동 배포 트리거)
async function publishPost(env, id, request) {
  try {
    const existingData = await env.BLOG_STORAGE.get(`post:${id}`);
    
    if (!existingData) {
      return errorResponse('글을 찾을 수 없습니다.', 404);
    }

    const post = JSON.parse(existingData);
    
    // 여기서 실제 블로그 플랫폼으로 발행하는 로직을 추가할 수 있습니다
    // 현재는 상태만 변경합니다
    // 실제 자동화를 위해서는 별도의 서버나 서비스를 호출해야 합니다
    
    post.status = 'published';
    post.publishedAt = new Date().toISOString();
    post.updatedAt = new Date().toISOString();

    await env.BLOG_STORAGE.put(`post:${id}`, JSON.stringify(post));

    // TODO: 실제 블로그 플랫폼 API 호출
    // 예: 네이버 블로그 자동화 서비스 호출
    // await callBlogPlatformAPI(post);

    return successResponse({
      message: '글이 발행되었습니다.',
      post,
      note: '실제 블로그 플랫폼 연동은 별도 서비스가 필요합니다.',
    });
  } catch (error) {
    return errorResponse(`글 발행 실패: ${error.message}`, 500);
  }
}

// 문의하기 (기존 문의폼 연동)
async function handleContact(env, request) {
  try {
    const data = await request.json();
    
    // 필수 필드 검증
    if (!data.name || !data.age || !data.message) {
      return errorResponse('이름, 나이, 문의내용은 필수입니다.');
    }

    const contact = {
      id: generateId(),
      name: data.name,
      phone: data.phone || '',
      age: data.age,
      message: data.message,
      createdAt: new Date().toISOString(),
      status: 'new', // new, read, replied
    };

    // KV에 저장
    await env.BLOG_STORAGE.put(`contact:${contact.id}`, JSON.stringify(contact));

    // TODO: 이메일 알림 발송 등 추가 처리
    // 예: SendGrid, Mailgun 등의 서비스 활용

    return successResponse({
      message: '문의가 접수되었습니다.',
      id: contact.id,
    }, 201);
  } catch (error) {
    return errorResponse(`문의 접수 실패: ${error.message}`, 500);
  }
}

// 메인 핸들러
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight 요청 처리
    if (method === 'OPTIONS') {
      return handleCORS();
    }

    // API 라우팅
    try {
      // 문의하기 API
      if (path === '/api/contact' && method === 'POST') {
        return await handleContact(env, request);
      }

      // 블로그 글 관리 API
      if (path.startsWith('/api/posts')) {
        // POST /api/posts - 새 글 생성
        if (path === '/api/posts' && method === 'POST') {
          return await createPost(env, request);
        }

        // GET /api/posts - 모든 글 조회
        if (path === '/api/posts' && method === 'GET') {
          return await getAllPosts(env);
        }

        // GET /api/posts/:id - 특정 글 조회
        const postMatch = path.match(/^\/api\/posts\/([^\/]+)$/);
        if (postMatch) {
          const id = postMatch[1];
          
          if (method === 'GET') {
            return await getPostById(env, id);
          }
          
          if (method === 'PUT') {
            return await updatePost(env, id, request);
          }
          
          if (method === 'DELETE') {
            return await deletePost(env, id);
          }
        }

        // POST /api/posts/:id/publish - 글 발행
        const publishMatch = path.match(/^\/api\/posts\/([^\/]+)\/publish$/);
        if (publishMatch && method === 'POST') {
          const id = publishMatch[1];
          return await publishPost(env, id, request);
        }
      }

      // API 정보 페이지
      if (path === '/api' || path === '/api/') {
        return successResponse({
          name: '블로그 자동 배포 API',
          version: '1.0.0',
          endpoints: {
            'GET /api/posts': '모든 글 조회',
            'GET /api/posts/:id': '특정 글 조회',
            'POST /api/posts': '새 글 생성',
            'PUT /api/posts/:id': '글 수정',
            'DELETE /api/posts/:id': '글 삭제',
            'POST /api/posts/:id/publish': '글 발행',
            'POST /api/contact': '문의하기',
          },
        });
      }

      // 404 - 잘못된 경로
      return errorResponse('API 엔드포인트를 찾을 수 없습니다.', 404);

    } catch (error) {
      return errorResponse(`서버 오류: ${error.message}`, 500);
    }
  },
};



