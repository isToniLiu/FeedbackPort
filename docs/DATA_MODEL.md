# 数据模型

## ER 图

```mermaid
erDiagram
    products ||--o{ feedback : "拥有"
    feedback ||--o{ votes : "被投票"
    feedback ||--o{ replies : "被回复"
    feedback }o--o| feedback : "duplicate_of 指向主贴"

    products {
        uuid id PK
        text slug UK "子域名标识"
        text name
        text brand_color
        timestamptz created_at
    }
    feedback {
        uuid id PK
        uuid product_id FK
        text title
        text body
        text status "open/planned/in_progress/done/declined"
        text submitter_email
        vector embedding "预留，AI判重用，MVP不启用"
        uuid duplicate_of FK "指向被判定重复的主贴"
        timestamptz created_at
        timestamptz updated_at
    }
    votes {
        uuid id PK
        uuid feedback_id FK
        text voter_email
        timestamptz created_at
    }
    replies {
        uuid id PK
        uuid feedback_id FK
        text body
        boolean is_admin
        timestamptz created_at
    }
```

## DDL

```sql
create extension if not exists "uuid-ossp";
create extension if not exists vector; -- 预留 pgvector，MVP 阶段不使用

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- 子域名/路由匹配用，如 'cardwhisper'
  name text not null,
  brand_color text,
  created_at timestamptz not null default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  title text not null,
  body text,
  status text not null default 'open'
    check (status in ('open','planned','in_progress','done','declined')),
  submitter_email text not null,
  embedding vector(1536),             -- Roadmap Phase 3 启用
  duplicate_of uuid references feedback(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references feedback(id) on delete cascade,
  voter_email text not null,
  created_at timestamptz not null default now(),
  unique (feedback_id, voter_email)   -- 投票去重的唯一依据
);

create table replies (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references feedback(id) on delete cascade,
  body text not null,
  is_admin boolean not null default true,
  created_at timestamptz not null default now()
);

-- 索引
create index idx_feedback_product_status on feedback(product_id, status);
create index idx_votes_feedback on votes(feedback_id);
create index idx_replies_feedback on replies(feedback_id);
```

> 频率限制不落 Postgres 表，走 Upstash Redis 的滑动窗口计数（见 ARCHITECTURE.md 防刷设计），避免为限流引入额外的数据清理任务。

## Row Level Security 策略

```sql
alter table feedback enable row level security;
alter table votes enable row level security;
alter table replies enable row level security;

-- 匿名角色可读所有反馈（board/widget 用 product_id 在应用层过滤租户）
create policy "anon can read feedback" on feedback
  for select using (true);

-- 匿名角色只能插入，不能改 status / duplicate_of
create policy "anon can submit feedback" on feedback
  for insert with check (true);

-- 状态变更、判重指派只能由 service-role 执行（不给 anon 开 update 策略即可）

create policy "anon can read votes" on votes
  for select using (true);

create policy "anon can vote" on votes
  for insert with check (true);

create policy "anon can read replies" on replies
  for select using (true);

-- 写入管理员回复（is_admin = true）不给 anon 开策略，只能 service-role 执行
```

## 字段说明补充

- `submitter_email` / `voter_email`：不做账号体系，邮箱即身份。已登录宿主产品的用户，由宿主页面在初始化 widget 时预填邮箱（见 API.md 的 widget 初始化参数），未登录用户手动输入。
- `embedding`：MVP 阶段该列始终为空，Roadmap Phase 3 启用 AI 判重时，由后台任务统一回填历史数据后开始增量维护。
- `duplicate_of`：人工确认判重后指向的主贴 id；查询列表时默认过滤掉 `duplicate_of is not null` 的记录，票数/评论在展示时归并到主贴。
