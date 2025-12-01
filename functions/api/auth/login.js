// POST /api/auth/login - 관리자 로그인
import { errorResponse, successResponse, handleCORS } from '../../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { password } = data;

    // 필수 필드 검증
    if (!password) {
      return errorResponse('비밀번호를 입력해주세요.', 400);
    }

    // 관리자 정보 조회 (첫 번째 관리자 계정)
    const admin = await env['thenaeun-logi-db'].prepare(
      'SELECT id, username, password FROM admin LIMIT 1'
    ).first();

    if (!admin) {
      return errorResponse('비밀번호가 올바르지 않습니다.', 401);
    }

    // 비밀번호만 비교
    if (admin.password !== password) {
      return errorResponse('비밀번호가 올바르지 않습니다.', 401);
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

