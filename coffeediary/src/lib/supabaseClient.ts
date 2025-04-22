import { createClient } from '@supabase/supabase-js';

// 環境変数チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数が未設定の場合にわかりやすいエラーメッセージを表示
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数 NEXT_PUBLIC_SUPABASE_URL または NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません。.env.local ファイルを確認してください。');
}

// Supabaseクライアントを作成
export const supabase = createClient(
  supabaseUrl || '',  // 空文字をフォールバックとして使用
  supabaseAnonKey || ''
);
