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

    // 데이터 조회 쿼리 구성
    let query;
    let countQuery;
    
    if (status) {
      // status 필터가 있을 때
      query = `SELECT * FROM contacts WHERE status = ? ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      countQuery = 'SELECT COUNT(*) as total FROM contacts WHERE status = ?';
    } else {
      // status 필터가 없을 때
      query = `SELECT * FROM contacts ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      countQuery = 'SELECT COUNT(*) as total FROM contacts';
    }

    // 데이터 조회
    let stmt = env['thenaeun-logi-db'].prepare(query);
    if (status) {
      stmt = stmt.bind(status);
    }
    const contacts = await stmt.all();

    // 전체 개수 조회
    let countStmt = env['thenaeun-logi-db'].prepare(countQuery);
    if (status) {
      countStmt = countStmt.bind(status);
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

