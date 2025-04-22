"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteTypes, setFavoriteTypes] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 好みのコーヒータイプ候補
  const COFFEE_TYPES = [
    "浅煎り", "中煎り", "深煎り", "エスプレッソ", "カフェラテ", "ハンドドリップ", "コールドブリュー", "シングルオリジン", "ブレンド"
  ];

  // ユーザープロフィール取得
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth");
          return;
        }

        setUserId(user.id);

        // プロフィール情報取得
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setNickname(data.nickname || "");
          setBio(data.bio || "");
          setFavoriteTypes(data.favorite_types || []);

          // 画像URL取得
          if (data.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        }
      } catch (err: unknown) {
        if (isErrorWithMessage(err)) {
          setError(err.message);
        } else {
          setError("未知のエラーが発生しました");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleFavoriteType = (type: string) => {
    setFavoriteTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setAvatar(file);

    // プレビュー生成
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!userId) throw new Error('認証情報が取得できません');

      // プロフィール画像アップロード
      let newAvatarUrl = avatarUrl;

      if (avatar) {
        // 古い画像を削除（あれば）
        if (avatarUrl) {
          const oldAvatarPath = avatarUrl.split('/').pop();
          if (oldAvatarPath) {
            await supabase.storage
              .from('avatars')
              .remove([`${userId}/${oldAvatarPath}`]);
          }
        }

        // 新しい画像をアップロード
        const fileExt = avatar.name.split('.').pop();
        const filePath = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar);

        if (uploadError) throw uploadError;

        // 公開URLを取得
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        newAvatarUrl = data.publicUrl;
      }

      // データ保存
      const { error } = await supabase.from('users').upsert({
        id: userId,
        nickname,
        bio,
        favorite_types: favoriteTypes,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setAvatarUrl(newAvatarUrl);
      setMessage("プロフィールを保存しました！");

      // 2秒後にリダイレクト
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err: unknown) {
      if (isErrorWithMessage(err)) {
        setError(err.message);
      } else {
        setError("未知のエラーが発生しました");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-md mx-auto py-12 px-4 text-center">読み込み中...</div>;
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-xl font-bold mb-6">プロフィール設定</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm mb-1">プロフィール画像</label>
          <div className="flex items-center space-x-4">
            <div className="relative w-20 h-20 overflow-hidden rounded-full bg-zinc-100">
              {(avatarPreview || avatarUrl) ? (
                <Image
                  src={avatarPreview || avatarUrl || ''}
                  alt="プロフィール"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-zinc-200 text-zinc-400">
                  No image
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={loading}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">ニックネーム</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded"
            required
            value={nickname}
            maxLength={20}
            disabled={loading}
            onChange={e => setNickname(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">自己紹介 <span className="text-xs text-zinc-500">（100字以内）</span></label>
          <textarea
            className="w-full px-3 py-2 border rounded"
            maxLength={100}
            rows={3}
            value={bio}
            disabled={loading}
            onChange={e => setBio(e.target.value)}
          />
          <div className="text-xs text-right text-zinc-400">{bio.length}/100</div>
        </div>
        <div>
          <label className="block text-sm mb-1">好みのコーヒータイプ <span className="text-xs text-zinc-500">（複数選択可）</span></label>
          <div className="flex flex-wrap gap-2">
            {COFFEE_TYPES.map(type => (
              <button
                key={type}
                type="button"
                className={`px-3 py-1 rounded-full border text-sm ${favoriteTypes.includes(type) ? "bg-zinc-700 text-white border-zinc-700" : "bg-zinc-100"}`}
                disabled={loading}
                onClick={() => handleFavoriteType(type)}
              >{type}</button>
            ))}
          </div>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {message && <div className="text-green-600 text-sm">{message}</div>}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex-1 px-4 py-2 bg-zinc-100 rounded hover:bg-zinc-200 transition"
            disabled={loading}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="flex-1 bg-zinc-700 text-white py-2 rounded disabled:opacity-50 hover:bg-zinc-800 transition"
            disabled={loading}
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}
