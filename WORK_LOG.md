# Work log

## 2026-08-30：发布 Safari 上传 405 脱敏证据

- 目标：按用户要求把已验证发现推送 GitHub，供其他 chat 核对，不改业务代码或部署。
- 改动：在既有 `deploy/pages/SRL_PAGES_DEPLOY.md` 补充 Production SHA、capabilities、控制组及真实 iPhone tail 摘录；纠正 capabilities 缺失等于全部 Functions 缺失的表述和将生产域名误作项目名的示例。
- 验证：文档内 tail JSON 与本地白名单脱敏记录逐字段核对；检查 Git diff、固定提交源码链接及敏感值；提交以 `[skip ci]` 开头，避免 push 触发 Actions 和 Pages 构建。
- 未决：已观察到零长度 multipart 与解析异常；具体 WebKit bug 归属、405 返回位置、真实 Safari 重定向链及修复效果均未确认。业务 Production 基线保持 `eef1240038a5c1652dba522976518c232fa2f206`。
