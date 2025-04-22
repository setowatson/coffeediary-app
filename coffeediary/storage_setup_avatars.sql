-- Supabase ストレージのプロフィール画像用バケット作成
-- 注: これはSupabaseコンソールのStorage管理画面からUIでも設定可能です

-- プロフィール画像用のバケット作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'プロフィール画像', true)
ON CONFLICT (id) DO NOTHING;

-- RLSポリシー設定 (セキュリティルール)
-- ユーザーは自分のファイルのみ操作可能にする

-- 閲覧ポリシー (誰でも閲覧可能)
CREATE POLICY "プロフィール画像は誰でも閲覧可能"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- アップロードポリシー (認証済みユーザーのみ)
CREATE POLICY "プロフィール画像は認証ユーザーのみアップロード可能"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 削除ポリシー (自分のファイルのみ)
CREATE POLICY "プロフィール画像は所有者のみ削除可能"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
