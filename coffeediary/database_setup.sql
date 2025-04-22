-- users テーブル（プロフィール情報）
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  nickname TEXT NOT NULL,
  bio TEXT,
  favorite_types TEXT[],
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザーの行が自動作成されるようにRLSポリシーとトリガーを追加
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のプロフィールのみ閲覧可能"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "ユーザーは自分のプロフィールのみ編集可能"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "ユーザーは自分のプロフィールのみ作成可能"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 新規ユーザー登録時にusersテーブルに自動挿入するための関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nickname)
  VALUES (new.id, COALESCE((new.raw_user_meta_data->>'nickname'), '名称未設定'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザー作成時のトリガー
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- coffee_entries テーブル（コーヒー記録）
CREATE TABLE IF NOT EXISTS coffee_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  bean_name TEXT NOT NULL,
  bean_origin TEXT,
  roast_level TEXT,
  shop TEXT,
  brew_method TEXT,
  made_by_user BOOLEAN DEFAULT TRUE,
  grind_size TEXT,
  sourness INTEGER DEFAULT 3,
  sweetness INTEGER DEFAULT 3,
  bitterness INTEGER DEFAULT 3,
  richness INTEGER DEFAULT 3,
  flavor_notes TEXT[],
  rating INTEGER DEFAULT 3 CHECK (rating BETWEEN 1 AND 5),
  memo TEXT,
  photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- coffee_entriesのRLSポリシー
ALTER TABLE coffee_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のコーヒー記録のみ閲覧可能"
  ON coffee_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のコーヒー記録のみ作成可能"
  ON coffee_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のコーヒー記録のみ更新可能"
  ON coffee_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のコーヒー記録のみ削除可能"
  ON coffee_entries FOR DELETE
  USING (auth.uid() = user_id);

-- インデックス作成（検索・ソート高速化）
CREATE INDEX idx_coffee_entries_user_id ON coffee_entries(user_id);
CREATE INDEX idx_coffee_entries_created_at ON coffee_entries(created_at);
