// GET /api/admin/contacts/:id - 특정 문의 조회
// PUT /api/admin/contacts/:id - 문의 상태 업데이트
// DELETE /api/admin/contacts/:id - 문의 삭제
import { errorResponse, successResponse, handleCORS } from '../../../_utils.js';

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const id = parseInt(params.id);

  try {
    const contact = await env['thenaeun-logi-db'].prepare(
      'SELECT * FROM contacts WHERE id = ?'
    ).bind(id).first();

    if (!contact) {
      return errorResponse('문의를 찾을 수 없습니다.', 404);
    }

    return successResponse(contact);
  } catch (error) {
    return errorResponse(`문의 조회 실패: ${error.message}`, 500);
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = parseInt(params.id);

  try {
    const data = await request.json();
    const { status } = data;

    // 상태 검증
    if (!status || !['new', 'read', 'replied'].includes(status)) {
      return errorResponse('유효하지 않은 상태입니다. (new, read, replied 중 하나)', 400);
    }

    // 상태 업데이트
    const result = await env['thenaeun-logi-db'].prepare(
      `UPDATE contacts 
       SET status = ?, updated_at = datetime('now', 'localtime')
       WHERE id = ?`
    ).bind(status, id).run();

    if (result.meta.changes === 0) {
      return errorResponse('문의를 찾을 수 없습니다.', 404);
    }

    // 업데이트된 문의 정보 반환
    const updatedContact = await env['thenaeun-logi-db'].prepare(
      'SELECT * FROM contacts WHERE id = ?'
    ).bind(id).first();

    return successResponse({
      message: '상태가 업데이트되었습니다.',
      contact: updatedContact,
    });
  } catch (error) {
    return errorResponse(`상태 업데이트 실패: ${error.message}`, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const id = parseInt(params.id);

  try {
    const result = await env['thenaeun-logi-db'].prepare(
      'DELETE FROM contacts WHERE id = ?'
    ).bind(id).run();

    if (result.meta.changes === 0) {
      return errorResponse('문의를 찾을 수 없습니다.', 404);
    }

    return successResponse({ message: '문의가 삭제되었습니다.', id });
  } catch (error) {
    return errorResponse(`문의 삭제 실패: ${error.message}`, 500);
  }
}

// OPTIONS 요청 처리
export async function onRequestOptions() {
  return handleCORS();
}

