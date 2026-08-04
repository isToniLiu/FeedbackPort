-- 补 GRANT：0001 号迁移只写了 RLS policy，没显式 GRANT 表级权限。
-- RLS policy 决定"哪些行"，GRANT 决定"能不能碰这张表"，两者缺一不可——
-- 有些 Supabase 项目配置下 service_role 不会自动拿到新表的权限，
-- 见 docs/DATA_MODEL.md，这条迁移把这个隐性依赖显式声明出来。

grant usage on schema public to service_role, anon, authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- anon/authenticated 的具体权限跟 0001 号迁移里的 RLS policy 对应：
-- 能读全部、能插入 feedback/votes，不能改 status、不能写 is_admin=true 的回复
grant select on public.products to anon, authenticated;
grant select, insert on public.feedback to anon, authenticated;
grant select, insert on public.votes to anon, authenticated;
grant select on public.replies to anon, authenticated;
