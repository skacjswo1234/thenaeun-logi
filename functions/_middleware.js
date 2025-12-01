// Pages Functions 미들웨어 - CORS 처리
import { handleCORS } from './_utils.js';

export async function onRequest(context) {
  const { request } = context;

  // OPTIONS 요청 처리
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }

  // 다음 핸들러로 전달
  return context.next();
}

