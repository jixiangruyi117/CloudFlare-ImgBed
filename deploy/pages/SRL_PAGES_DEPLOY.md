# SRL-compatible Cloudflare Pages deployment

When this repository is deployed to Cloudflare Pages, the `/functions` directory must be deployed together with `frontend-dist`.

A Dashboard drag-and-drop / static-only deployment can serve the UI but does **not** compile the Pages Functions directory. In that state the site may open normally while `POST /upload` returns HTTP 405.

## Existing Direct Upload Pages project

This section applies only to existing Direct Upload projects. The production site audited below uses Git integration; keep that integration and do not replace it with this deployment procedure.

Run Wrangler from the **repository root** so it can discover both `frontend-dist` and the root-level `functions` directory:

```bash
npm install
npx wrangler login
npx wrangler pages deploy frontend-dist --project-name=<your-pages-project-name>
```

Keep the existing KV / D1 / R2 bindings and environment variables configured on the Pages project in the Cloudflare dashboard.

## Verify the dynamic backend

After deployment, this URL must return JSON instead of the SPA HTML shell:

```text
https://<your-project>.pages.dev/api/srl/capabilities
```

Expected fields include:

```json
{
  "srlCompatible": true,
  "protocolVersion": 1,
  "service": "cloudflare-imgbed"
}
```

If the capability URL returns HTML, 404, or another static-site response, that capability route was not matched. Check the actual production commit before concluding that all Pages Functions are absent: an older deployment can serve `/upload` without containing this newer capability endpoint.

## 2026-08-30：iOS Safari 上传 405 的生产证据

本节由用户要求发布，供其他 chat 核对。它记录已发生的部署、控制组和一次真实 iPhone 请求，不包含修复，也不代表已经唯一确认 WebKit bug 的编号或 405 的具体返回代码位置。

### 部署基线

| 项目 | 已核对值 |
| --- | --- |
| GitHub 仓库 | `jixiangruyi117/CloudFlare-ImgBed` |
| Cloudflare Pages 项目名 | `cloudflare-imgbed` |
| 生产域名 | `https://cloudflare-imgbed-3wx.pages.dev` |
| 部署方式 | GitHub Git integration，Production branch 为 `main` |
| Root directory | 空，仓库根目录 |
| Build command | `npm install` |
| Build output directory | `frontend-dist` |
| 旧 Production SHA | `c2a8196588b5c2f19272384d0d72d41db22e7540` |
| 旧 Deployment ID | `bf4b6f46-7bb2-4bee-bb4a-75763304ebce` |
| 本次证据对应的 Production SHA | `eef1240038a5c1652dba522976518c232fa2f206` |
| 本次证据对应的 Deployment ID | `2c65a031-ffe1-4854-91b2-9dd9cd98e4a5` |
| 部署结果 | `success`，`uses_functions=true` |
| 部署完成时间 | `2026-08-30T04:44:15.3024Z`，北京时间 12:44:15 |

此前 main 对应的记录 `afa6916e-31f7-4d70-9a0e-03641d9bb69b` 为 `is_skipped=true`、`skip_reason=commit_message`。在用户明确授权后，仅通过 Pages 官方 Retry deployment API 重试该 Git 部署记录，使上述 SHA 成为 Production；未使用 GitHub Actions，也未覆盖环境变量或 Bindings。

在记录这次故障证据时，GitHub main 与 Production 都是 `eef1240038a5c1652dba522976518c232fa2f206`。本节后续以纯文档提交发布，并跳过 CI/Pages 构建；文档提交造成的 main SHA 前进不代表业务代码又落后。

### 新接口与无凭据控制组

生产 `GET /api/srl/capabilities` 实测 `200`，`Content-Type: application/json; charset=utf-8`，响应如下：

```json
{"srlCompatible":true,"protocolVersion":1,"service":"cloudflare-imgbed","upload":{"path":"/upload","methods":["POST"],"auth":["bearer-api-token","auth-code"]},"delete":{"pathTemplate":"/api/manage/delete/{fileId}","methods":["DELETE"],"auth":["bearer-api-token"]}}
```

控制组请求地址均为 `https://cloudflare-imgbed-3wx.pages.dev/upload`。OPTIONS 携带 Origin `https://srl.jixiangruyi1207.buzz`、请求方法声明 `POST` 和请求头声明 `authorization`。POST 仅发送内存中的 1 字节文本 multipart 文件，无真实凭据、无 Cookie；命令行携带 Safari UA，但不等同于 iPhone 真机测试。

| 响应字段 | OPTIONS 控制组 | POST 控制组 |
| --- | --- | --- |
| Status | `204` | `401` |
| Body | 空 | `Unauthorized` |
| Content-Type | 未提供 | `text/plain; charset=UTF-8` |
| Access-Control-Allow-Origin | `*` | `*` |
| Access-Control-Allow-Methods | `GET, POST, OPTIONS` | `POST, GET` |
| Access-Control-Allow-Headers | `Content-Type, Authorization` | `Content-Type, Authorization, authCode` |
| Location / Allow | 均未提供 | 均未提供 |
| CF-Ray | `a331257eeea34f1c-SJC` | `a3312581e91f4f1c-SJC` |
| Redirect chain | 空 | 空 |

控制组关闭了自动跟随重定向；初始 URL、Response URL 和最终 URL 相同。POST 进入鉴权层并被拒绝，没有成功上传。401 响应自身带有 CORS 头；这不证明真实带凭据的 405 响应也有相同 CORS 头。

### 真实 iPhone 请求：生产 Functions tail 脱敏摘录

日志来源是上述 Production deployment 的实时 Functions tail，过滤 `POST /upload`。仅保留下列白名单字段；没有保存或发布请求凭据、Cookie、multipart body、图片内容或完整原始日志。未保留请求事件时间戳，不以部署时间或日志文件写入时间代替请求时间。

```json
{
  "request URL": "https://cloudflare-imgbed-3wx.pages.dev/upload?returnFormat=full&autoRetry=true",
  "method": "POST",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1",
  "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryUsqHyQG2nauEPDtJ",
  "Content-Length": "0",
  "Transfer-Encoding": null,
  "response status": 405,
  "Functions outcome": "ok",
  "exception message / stack": [
    {
      "message": "TypeError: No initial boundary string (or you have a truncated message).",
      "stack": null
    }
  ],
  "CF-Ray": "a333d8011efa17a5"
}
```

这里的 `null` 表示脱敏日志没有提供该字段，不能解释成数值零或证明网络层不存在该字段。错误消息字段汇集 tail 的异常/错误 console 消息；没有保留原始事件分类，不能据此将该错误称为未捕获异常。`Functions outcome=ok` 也不等于 HTTP 上传成功。

### 已确认与证据边界

- 已确认这次请求声明 multipart/form-data，但 `Content-Length` 为 `0`，且出现缺少初始 boundary／消息截断的解析异常。
- 已确认请求进入生产 Functions 的 `/upload` 处理链，该次事件记录的 HTTP 响应为 `405`。不能再归因于 `/upload` 不存在、整体拒绝 POST、Functions 整体漏部署或本次业务 main 未上线。
- **已命中 Safari/WebKit 26.x disk-backed File multipart body 丢失特征。**这是症状匹配：[WebKit Bug 319985](https://bugs.webkit.org/show_bug.cgi?id=319985) 的报告也涉及 Safari File 请求体为空、multipart/EOF 等表现。单次服务端记录不证明该文件的 backing 类型，也不唯一确认 bug 编号。
- 没有异常 stack、浏览器 Network redirect chain、原始响应正文、图片预期大小或客户端 Blob 对照试验。不能定位 405 究竟由业务处理、异常中间件还是后续静态回退产生；也不能把控制组“没有重定向”推广到真实 Safari 请求。
- 日志证明该次 405 出现在一次 Functions 调用的响应记录中，不支持“请求完全没有进入 Function”的判断。不能把浏览器 CORS 阻止读取响应与服务器返回 405 混为一谈。
- 本节不提出或验证任何修复，不修改业务代码。后续核对以该 SHA 和这条脱敏记录为基准，不重复已排除的整体漏部署方向。

相关源码（固定为取证部署 SHA）：[上传入口](https://github.com/jixiangruyi117/CloudFlare-ImgBed/blob/eef1240038a5c1652dba522976518c232fa2f206/functions/upload/index.js)、[上传中间件](https://github.com/jixiangruyi117/CloudFlare-ImgBed/blob/eef1240038a5c1652dba522976518c232fa2f206/functions/upload/_middleware.js)、[通用中间件](https://github.com/jixiangruyi117/CloudFlare-ImgBed/blob/eef1240038a5c1652dba522976518c232fa2f206/functions/utils/middleware.js)。
