// GET /api/admin/contacts - 모든 문의 조회
import { errorResponse, successResponse, handleCORS } from '../../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // 필터링: new, read, replied
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // LIMIT와 OFFSET은 숫자로 직접 넣기 (보안상 안전 - 이미 parseInt로 검증됨)
    let query = 'SELECT * FROM contacts';
    let countQuery = 'SELECT COUNT(*) as total FROM contacts';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      countQuery += ' WHERE status = ?';
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    // 데이터 조회
    const stmt = env['thenaeun-logi-db'].prepare(query);
    // status가 있을 때만 파라미터 바인딩
    if (status && params.length > 0) {
      stmt.bind(status);
    }
    const contacts = await stmt.all();

    // 전체 개수 조회
    const countStmt = env['thenaeun-logi-db'].prepare(countQuery);
    // status가 있을 때만 파라미터 바인딩
    if (status) {
      countStmt.bind(status);
    }
    const countResult = await countStmt.first();
    const total = countResult?.total || 0;

    return successResponse({
      contacts: contacts.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('문의 조회 오류:', error);
    console.error('에러 스택:', error.stack);
    return errorResponse(`문의 조회 실패: ${error.message}`, 500);
  }
}

// OPTIONS 요청 처리
export async function onRequestOptions() {
  return handleCORS();
}

