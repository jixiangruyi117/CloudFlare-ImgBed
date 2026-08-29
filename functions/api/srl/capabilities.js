const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

/**
 * SRL 无副作用能力探针。
 *
 * 这个接口故意不读取 Token、数据库或存储配置：它只证明当前域名确实部署了
 * CloudFlare-ImgBed 的动态 Functions/Worker 后端，而不是只有 frontend-dist 的
 * 静态 Pages。SRL 可据此在真正上传前区分“后端未部署”和“凭据/业务错误”。
 */
export async function onRequest(context) {
  const method = context.request.method.toUpperCase();
  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (method !== 'GET') return json({ code: 'METHOD_NOT_ALLOWED' }, 405);

  return json({
    srlCompatible: true,
    protocolVersion: 1,
    service: 'cloudflare-imgbed',
    upload: {
      path: '/upload',
      methods: ['POST'],
      auth: ['bearer-api-token', 'auth-code'],
    },
    delete: {
      pathTemplate: '/api/manage/delete/{fileId}',
      methods: ['DELETE'],
      auth: ['bearer-api-token'],
    },
  });
}
