"use strict";

/**
 * Supabase 项目配置
 *
 * Publishable Key 可以用于网页前端。
 * 严禁在这里填写：
 * 1. Secret Key
 * 2. service_role Key
 * 3. 数据库密码
 */

const SUPABASE_URL =
  "https://tbqjpkmukeothesdgcty.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ozr9h3n4pi3Z8OXj2WQKpw_YtMNTyIk";


/*
 * 确认 Supabase JavaScript SDK 已经加载。
 */
if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {
  throw new Error(
    "Supabase JavaScript SDK 加载失败，请检查页面底部的脚本引用和加载顺序。"
  );
}


/*
 * 创建全站共用的 Supabase 客户端。
 */
const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );


/*
 * 暴露给其他页面脚本使用。
 */
window.ostarSupabase =
  supabaseClient;