# 接入指南

给"要把 FeedbackPort 接进某个具体产品"的场景用的操作手册。目标读者是你自己（或者你直接把这份文档丢给 AI 编程助手，让它照着做）。

## 前提：先注册产品

每个要接入的产品都要在 `products` 表里有一行，才有 `slug` 可用。两种方式：

1. **管理后台**（Phase 0 完成后）：登录后台 → 新增产品 → 填 slug（比如 `cardwhisper`，只能小写字母数字连字符）、name、brand_color
2. **临时手动方式**（管理后台还没搭好之前）：直接在 Supabase Studio 的 Table Editor 里插一行，或者跑：

```sql
insert into products (slug, name, brand_color)
values ('cardwhisper', 'CardWhisper', '#6366f1');
```

拿到 slug 之后才能进行下面的接入步骤。

## 30 秒接入（纯 HTML / 任意静态站）

在 `</body>` 前加一行：

```html
<script
  src="https://cdn.你的域名.com/widget.js"
  data-product="cardwhisper"
  async
></script>
```

不需要额外初始化代码，脚本自己会在页面上挂一个悬浮反馈入口。

## React / Next.js

```tsx
// components/FeedbackWidget.tsx
'use client';
import { useEffect } from 'react';

export function FeedbackWidget({ productSlug, userEmail }: { productSlug: string; userEmail?: string }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.你的域名.com/widget.js';
    script.async = true;
    script.dataset.product = productSlug;
    if (userEmail) script.dataset.userEmail = userEmail;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [productSlug, userEmail]);

  return null;
}
```

用法：`<FeedbackWidget productSlug="cardwhisper" userEmail={session?.user?.email} />`，放在根布局里即可全站生效。

## Vue

```vue
<script setup lang="ts">
import { onMounted } from 'vue';

const props = defineProps<{ productSlug: string; userEmail?: string }>();

onMounted(() => {
  const script = document.createElement('script');
  script.src = 'https://cdn.你的域名.com/widget.js';
  script.async = true;
  script.dataset.product = props.productSlug;
  if (props.userEmail) script.dataset.userEmail = props.userEmail;
  document.body.appendChild(script);
});
</script>
<template></template>
```

## WordPress / 其他不方便改代码的站点

主题编辑器 → 页脚（footer.php 或"自定义 HTML/JS"插件）里贴 30 秒接入那段 `<script>`，没有区别，widget 本身不关心宿主是什么技术栈。

## 已登录用户邮箱预填

如果产品自己有登录态，把当前用户邮箱传进 `data-user-email`（见上面 React/Vue 示例），用户提交反馈/投票时就不用手动填邮箱了。不传就是匿名用户手动填，两种方式共存不冲突。**这不是身份校验**，只是省一次输入，后端不会验证这个邮箱是否真的属于当前登录用户。

## 公开面板地址

产品注册完 slug 之后，自动就有一个公开投票板：

```
https://<slug>.board.你的域名.com
```

可以直接把这个链接放进产品的"意见反馈"入口、更新日志页脚等位置，不需要额外部署。

## 关于跨域

widget 请求 API 是跨域请求（宿主域名 ≠ FeedbackPort 域名），后端已对提交反馈/投票这两个端点开放 CORS，宿主域名不需要额外配置。如果用了 Cloudflare Turnstile，注意在 Turnstile 控制台把宿主产品的域名加进允许列表，否则验证会失败（这是最常见的接入踩坑点）。

## 排查清单

- Widget 没显示：看浏览器控制台有没有 CSP（Content-Security-Policy）拦截了 `cdn.你的域名.com` 这个脚本源，宿主站如果配了严格 CSP 需要把这个域名加进 `script-src`
- 提交一直失败：先看 slug 是不是拼对了（大小写敏感、要和 `products.slug` 完全一致），再看 Turnstile 域名白名单
- 投票不生效：正常，同一个邮箱对同一条反馈只能投一次，接口会返回 `alreadyVoted: true` 而不是报错

## AI 辅助接入：可直接复制的提示词模板

日常接入新产品时，可以把下面这段丢给 AI 编程助手（替换掉花括号里的占位符），让它去对应项目里把 widget 接进去：

```
帮我把 FeedbackPort 反馈组件接入这个项目。

- FeedbackPort 的 product slug 是：{cardwhisper}
- 这个项目的技术栈是：{Next.js App Router / 纯静态 HTML / Vue / ...}
- 参考接入方式见：https://github.com/{你的仓库}/blob/main/docs/INTEGRATION.md
- 如果项目里有登录态，把当前登录用户的邮箱传给 widget 的 data-user-email
- 把 widget 放在全局布局里，确保每个页面都能看到反馈入口
- 接完之后帮我在这个项目的 README 里加一行"用户反馈"链接，指向 https://{cardwhisper}.board.你的域名.com
```

这份提示词假设 AI 助手能读取 `docs/INTEGRATION.md` 的内容（贴进上下文或给它仓库链接），不需要每次重新解释一遍接入逻辑。
