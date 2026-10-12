# Work log

## 2026-08-30：发布 Safari 上传 405 脱敏证据

- 目标：按用户要求把已验证发现推送 GitHub，供其他 chat 核对，不改业务代码或部署。
- 改动：在既有 `deploy/pages/SRL_PAGES_DEPLOY.md` 补充 Production SHA、capabilities、控制组及真实 iPhone tail 摘录；纠正 capabilities 缺失等于全部 Functions 缺失的表述和将生产域名误作项目名的示例。
- 验证：文档内 tail JSON 与本地白名单脱敏记录逐字段核对；检查 Git diff、固定提交源码链接及敏感值；提交以 `[skip ci]` 开头，避免 push 触发 Actions 和 Pages 构建。
- 未决：已观察到零长度 multipart 与解析异常；具体 WebKit bug 归属、405 返回位置、真实 Safari 重定向链及修复效果均未确认。业务 Production 基线保持 `eef1240038a5c1652dba522976518c232fa2f206`。

## 2026-10-12：关闭上游自动同步

- 目标：按用户要求阻止图床继续定时同步上游。
- 改动：通过 GitHub Actions API 停用 Upstream Sync（workflow 334491780），状态为 disabled_manually；未修改工作流源码、业务代码或部署。
- 验证：停用后 API 回读状态；该工作流全部 59 次运行记录中没有未完成任务。其余四个工作流状态保持 active。
- 未决：该工作流的定时与手动触发均已停用；重新启用会恢复源码中现有定时配置。
- 增量隐私检查：基线 df325c080f23160238d4af81f144c871fa5e5160，仅审计本节新增文字，无私人邮箱、域名、服务地址或二进制；本次提交使用账号对应 GitHub noreply 身份。
