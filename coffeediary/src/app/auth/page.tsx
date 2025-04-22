"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ErrorWithMessage = { message: string };

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // すでにログインしているユーザーをリダイレクト
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/');
      } else {
        setChecking(false);
      }
    };

    checkSession();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nickname } },
        });

        if (error) throw error;

        setMessage("認証メールを送信しました。メールをご確認ください。");

        // 自動確認リンクが使用されている場合は直接ホームへリダイレクト
        // そうでない場合は5秒後にログインページへ
        setTimeout(() => {
          setMode("login");
        }, 5000);
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage("ログインしました。ホームページへ移動します...");

        // 特にプロフィール情報を設定していないユーザーはプロフィールページへ誘導
        const { data: profile } = await supabase
          .from('users')
          .select('nickname, bio, favorite_types')
          .eq('id', data.user.id)
          .single();

        setTimeout(() => {
          // プロフィールが不完全な場合はプロフィール設定画面へ
          const isProfileIncomplete = !profile?.bio || !profile?.favorite_types || profile?.favorite_types.length === 0;
          router.push(isProfileIncomplete ? '/profile' : '/');
        }, 1500);
      }
    } catch (err) {
      // エラーハンドリングを改善
      console.error('認証エラー:', err);
      if (isErrorWithMessage(err)) {
        // Supabaseエラーメッセージを日本語化
        const errorMsg = err.message;
        if (errorMsg.includes("Email not confirmed")) {
          setError("メールアドレスが確認されていません。メールをご確認ください。");
        } else if (errorMsg.includes("Invalid login credentials")) {
          setError("メールアドレスまたはパスワードが正しくありません。");
        } else if (errorMsg.includes("Email already registered")) {
          setError("このメールアドレスは既に登録されています。");
        } else if (errorMsg.includes("Password should be at least")) {
          setError("パスワードは8文字以上にしてください。");
        } else {
          setError(`エラーが発生しました: ${errorMsg}`);
        }
      } else {
        setError("認証中に予期せぬエラーが発生しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("メールアドレスを入力してください。");
      return;
    }

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage("パスワード再設定用メールを送信しました。メールをご確認ください。");
    } catch (err) {
      if (isErrorWithMessage(err)) {
        setError(`パスワードリセットエラー: ${err.message}`);
      } else {
        setError("パスワードリセット中にエラーが発生しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="max-w-md mx-auto py-16 px-4 text-center">認証状態を確認中...</div>;
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">CoffeeDiary</h1>
        <p className="text-zinc-600">あなたのコーヒー体験を記録・管理</p>
      </div>

      <div className="flex mb-6">
        <button
          className={`flex-1 py-2 font-bold rounded-l ${mode === "login" ? "bg-zinc-800 text-white" : "bg-zinc-100"}`}
          onClick={() => setMode("login")}
        >ログイン</button>
        <button
          className={`flex-1 py-2 font-bold rounded-r ${mode === "signup" ? "bg-zinc-800 text-white" : "bg-zinc-100"}`}
          onClick={() => setMode("signup")}
        >新規登録</button>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">メールアドレス</label>
          <input
            type="email"
            className="w-full px-3 py-2 border rounded"
            autoComplete="email"
            disabled={loading}
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">パスワード</label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            disabled={loading}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div className="text-xs text-zinc-500 mt-1">8文字以上で入力してください</div>
        </div>
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium mb-1">ニックネーム</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded"
              disabled={loading}
              required
              value={nickname}
              maxLength={20}
              onChange={e => setNickname(e.target.value)}
            />
          </div>
        )}
        {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded">{error}</div>}
        {message && <div className="text-green-600 text-sm p-2 bg-green-50 rounded">{message}</div>}
        <button
          type="submit"
          className="w-full bg-zinc-700 text-white py-2 rounded mt-4 disabled:opacity-50 hover:bg-zinc-800 transition"
          disabled={loading}
        >
          {loading ? "処理中..." : mode === "signup" ? "新規登録" : "ログイン"}
        </button>
      </form>
      {mode === "login" && (
        <div className="mt-4 text-right">
          <button
            onClick={handlePasswordReset}
            className="text-blue-600 text-sm hover:underline"
            disabled={loading || !email}
          >パスワードを忘れた方はこちら</button>
        </div>
      )}
    </div>
  );
}
