// POST /api/auth/change-password - 비밀번호 변경
import { errorResponse, successResponse, handleCORS } from '../../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { username, oldPassword, newPassword } = data;

    // 필수 필드 검증
    if (!username || !oldPassword || !newPassword) {
      return errorResponse('모든 필드를 입력해주세요.', 400);
    }

    if (newPassword.length < 4) {
      return errorResponse('새 비밀번호는 최소 4자 이상이어야 합니다.', 400);
    }

    // 현재 비밀번호 확인
    const admin = await env['thenaeun-logi-db'].prepare(
      'SELECT id, password FROM admin WHERE username = ?'
    ).bind(username).first();

    if (!admin) {
      return errorResponse('사용자를 찾을 수 없습니다.', 404);
    }

    if (admin.password !== oldPassword) {
      return errorResponse('현재 비밀번호가 올바르지 않습니다.', 401);
    }

    // 비밀번호 변경
    const result = await env['thenaeun-logi-db'].prepare(
      `UPDATE admin 
       SET password = ?, updated_at = datetime('now', 'localtime')
       WHERE username = ?`
    ).bind(newPassword, username).run();

    if (result.meta.changes === 0) {
      return errorResponse('비밀번호 변경에 실패했습니다.', 500);
    }

    return successResponse({
      message: '비밀번호가 변경되었습니다.',
    });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    return errorResponse(`비밀번호 변경 실패: ${error.message}`, 500);
  }
}

// OPTIONS 요청 처리
export async function onRequestOptions() {
  return handleCORS();
}

