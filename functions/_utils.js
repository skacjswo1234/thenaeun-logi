// 공통 유틸리티 함수

// CORS 헤더 설정
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// CORS 응답 처리
export function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// 에러 응답 생성
export function errorResponse(message, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// 성공 응답 생성
export function successResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

