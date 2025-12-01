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

    let query = 'SELECT * FROM contacts';
    let countQuery = 'SELECT COUNT(*) as total FROM contacts';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      countQuery += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // 데이터 조회
    const stmt = env['thenaeun-logi-db'].prepare(query);
    if (params.length > 2) {
      stmt.bind(...params);
    } else {
      stmt.bind(limit, offset);
    }
    const contacts = await stmt.all();

    // 전체 개수 조회
    const countStmt = env['thenaeun-logi-db'].prepare(countQuery);
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
    return errorResponse(`문의 조회 실패: ${error.message}`, 500);
  }
}

// OPTIONS 요청 처리
export async function onRequestOptions() {
  return handleCORS();
}

