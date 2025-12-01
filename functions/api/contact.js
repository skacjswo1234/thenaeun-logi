// POST /api/contact - 문의하기
import { errorResponse, successResponse, handleCORS } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS preflight 처리
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }

  try {
    const data = await request.json();
    
    // 필수 필드 검증
    if (!data.name || !data.age || !data.message) {
      return errorResponse('이름, 나이, 문의내용은 필수입니다.');
    }

    // D1에 저장
    const result = await env['thenaeun-logi-db'].prepare(
      `INSERT INTO contacts (name, phone, age, message, status)
       VALUES (?, ?, ?, ?, 'new')`
    ).bind(data.name, data.phone || '', data.age, data.message).run();

    return successResponse({
      message: '문의가 접수되었습니다.',
      id: result.meta.last_row_id,
    }, 201);
  } catch (error) {
    return errorResponse(`문의 접수 실패: ${error.message}`, 500);
  }
}

// OPTIONS 요청 처리
export async function onRequestOptions() {
  return handleCORS();
}

