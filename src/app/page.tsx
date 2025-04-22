"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface CoffeeEntry {
  id: string;
  bean_name: string;
  created_at: string;
  rating: number;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<CoffeeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 認証状態のチェックと監視
  useEffect(() => {
    // 初期認証状態チェック
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          fetchEntries(user.id);
        } else {
          // 未ログインの場合は認証ページへリダイレクト
          router.push("/auth");
        }
      } catch (error) {
        console.error("認証チェックエラー:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // 認証状態変更イベントのリスナーを設定
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        fetchEntries(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setEntries([]);
        router.push("/auth");
      }
    });

    // クリーンアップ関数
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const fetchEntries = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("coffee_entries")
        .select("id,bean_name,created_at,rating")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("エントリー取得エラー:", error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-xl mx-auto py-12 px-4 text-center">読み込み中...</div>;
  }

  if (!user) {
    return null; // useEffectでリダイレクトするため、ここでは何も表示しない
  }

  return (
    <main className="max-w-xl mx-auto py-12 px-4">
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold">CoffeeDiary</h1>
      </div>
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2">最近の記録</h2>
        {entries.length === 0 ? (
          <div className="text-zinc-500">まだコーヒー記録がありません</div>
        ) : (
          <ul className="space-y-2">
            {entries.map(entry => (
              <li key={entry.id} className="bg-white rounded-lg shadow-sm border p-3 hover:shadow transition">
                <Link href={`/entries/${entry.id}`} className="block">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold">{entry.bean_name}</h3>
                    <div className="text-amber-600">{"★".repeat(entry.rating)}</div>
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">
                    {new Date(entry.created_at).toLocaleDateString("ja-JP")}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {entries.length > 0 && (
          <div className="mt-4 text-right">
            <Link href="/entries" className="text-blue-600 text-sm hover:underline">
              すべての記録を見る →
            </Link>
          </div>
        )}
      </section>
      <section className="bg-zinc-100 rounded p-5">
        <h2 className="text-lg font-semibold mb-2">ダッシュボード</h2>
        <div className="text-zinc-700 text-sm mb-4">
          記録数：<span className="font-bold">{entries.length}</span> / 最新5件
        </div>
        <Link href="/dashboard" className="inline-block text-blue-600 text-sm hover:underline">
          詳細分析を見る →
        </Link>
      </section>
    </main>
  );
}
