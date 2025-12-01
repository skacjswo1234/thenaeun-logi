// POST /api/auth/login - 관리자 로그인
import { errorResponse, successResponse, handleCORS } from '../../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { username, password } = data;

    // 필수 필드 검증
    if (!username || !password) {
      return errorResponse('사용자명과 비밀번호를 입력해주세요.', 400);
    }

    // 관리자 정보 조회
    const admin = await env['thenaeun-logi-db'].prepare(
      'SELECT id, username, password FROM admin WHERE username = ?'
    ).bind(username).first();

    if (!admin) {
      return errorResponse('사용자명 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    // 비밀번호 비교 (간단한 비교, 실제로는 해시 비교 필요)
    if (admin.password !== password) {
      return errorResponse('사용자명 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    // 로그인 성공 (실제로는 JWT 토큰 발급 권장)
    return successResponse({
      message: '로그인 성공',
      user: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    return errorResponse(`로그인 실패: ${error.message}`, 500);
  }
}

// OPTIONS 요청 처리
export async function onRequestOptions() {
  return handleCORS();
}

