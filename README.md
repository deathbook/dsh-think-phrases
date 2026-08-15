# dsh-think-phrases

> 🤖 本项目由 **DeepSeek V4 Flash Max** 完全自主生成。

右上角思维链短语统计插件：统计当前会话所有思维链（reasoning blocks）中
`let me` / `we` / `let's` / `I'll` 的出现次数。

适用于 DeepSeek Harness（dsh）插件体系，采用双半边架构：

- **宿主半边** `src/index.ts` + `src/projection.ts` — 注册 `thinkPhrases` 会话投影：
  投影框架对**完整会话日志**逐条执行 `apply`（仅统计 `assistant/message` 事件的
  reasoning 块，支持 surface replace 回退），不受客户端窗口截断影响。
- **客户端半边** `src/client/` — 挂载到 `conversation.session.header.utilities`
  （会话头部右侧工具区），通过 `useProjection('thinkPhrases')` 实时读取计数；
  丸粒按钮显示总数，点击拉出面板、点外部或 Esc 收起。

## 功能

- 统计思维链中的高频短语/单词：
  - `let me`
  - `we`（只匹配独立单词，不匹配 `we're`、`we'll` 等缩写词）
  - `let's`
  - `I'll`（同时统计全写 `I will`）
- 全部忽略大小写。
- 只统计思维链（reasoning）文本，不统计可见正文与用户消息。
- 面板实时显示每项计数和总数。

## 计数规则

| 短语 | 正则 |
| --- | --- |
| `let me` | `/\blet\s+me\b/gi` |
| `we` | `/(?<![A-Za-z0-9_])we(?![A-Za-z0-9_]|['’‘][A-Za-z0-9_])/gi` （只匹配独立单词，不匹配 `we're`/`we'll` 等缩写词） |
| `let's` | `/\blet(?:['’]s|s)\b/gi` （含直/弯引号与无引号变体） |
| `I'll` | `/\bi(?:['’‘]ll|\s+will)\b/gi` （含 `I will` 全写及大小写/直弯引号变体） |

## 目录结构

```text
dsh-think-phrases/
├── src/
│   ├── client/
│   │   ├── ThinkStatsWidget.tsx   # 客户端统计面板组件
│   │   ├── index.ts               # 客户端插件入口
│   │   └── think-stats.module.css # 面板样式
│   ├── index.ts                   # 宿主插件入口
│   └── projection.ts              # thinkPhrases 会话投影与计数规则
├── lib/                           # 构建产物（构建后生成，已 gitignore）
├── .gitignore
├── LICENSE
├── README.md
├── cordis.patch.yml
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── tsdown.config.ts
```

## 构建

```bash
pnpm install
pnpm run build   # lib/index.js (宿主) + lib/client.js (浏览器) + lib/types
```

## 安装到 profile

将 `dsh-think-phrases` 加入 profile 的 `dependencies`（`link:`/`file:`/工作区即可），
并在 `dsh.profile.bundles` 追加 `"dsh-think-phrases"`，然后 `pnpm install` 并重启 dsh 宿主
（插件集合与客户端引导图均在启动时组合）。

## 标签

DeepSeek Harness 插件通用标签：

- `dsh`
- `dsh-plugin`
- `deepseek`
- `harness`
- `reasoning`
- `stats`

## License

[MIT](./LICENSE)
