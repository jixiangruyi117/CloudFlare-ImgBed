import { authenticate, AUTH_SCOPE } from "../../utils/auth/authCore.js";

const DEFAULT_MANAGE_CACHE_CONTROL = 'private, no-store, max-age=0';

// 管理 API 会被 SRL 的 Safari/PWA 跨域调用。OPTIONS 预检通过还不够，浏览器仍会
// 校验真正 GET/POST/DELETE 响应上的 CORS 头，因此所有成功/失败响应都必须补齐。
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function withManageHeaders(response) {
  const headers = new Headers(response.headers);
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', DEFAULT_MANAGE_CACHE_CONTROL);
  }
  for (const [name, value] of Object.entries(corsHeaders)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function errorHandling(context) {
  try {
    return withManageHeaders(await context.next());
  } catch (err) {
    return withManageHeaders(
      new Response(`${err.message}\n${err.stack}`, {
        status: 500,
      }),
    );
  }
}

function UnauthorizedException(reason) {
  return withManageHeaders(
    new Response(reason, {
      status: 401,
      statusText: 'Unauthorized',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        'Content-Length': reason.length,
      },
    }),
  );
}

/**
 * 根据请求路径提取所需权限
 * @param {string} pathname - 请求路径
 * @returns {string} 需要的权限类型
 */
function extractRequiredPermission(pathname) {
  const pathParts = pathname.toLowerCase().split('/');

  if (pathParts.includes('delete')) {
    return 'delete';
  }

  if (pathParts.includes('list')) {
    return 'list';
  }

  // 其他 /api/manage 下的操作需要管理权限
  return 'manage';
}

async function authentication(context) {
  // OPTIONS 预检请求不需要鉴权，直接返回 CORS 响应
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const pathname = new URL(context.request.url).pathname;
  const requiredPermission = extractRequiredPermission(pathname);

  const result = await authenticate({
    env: context.env,
    request: context.request,
    requiredPermission,
    authScope: AUTH_SCOPE.ADMIN,
  });

  if (!result.authorized) {
    return UnauthorizedException('You need to login');
  }

  return context.next();
}

export const onRequest = [errorHandling, authentication];
