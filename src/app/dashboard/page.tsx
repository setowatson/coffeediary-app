"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import CoffeeTrends from "@/components/dashboard/CoffeeTrends";

interface CoffeeEntry {
  id: string;
  bean_name: string;
  bean_origin: string;
  roast_level: string;
  brew_method: string;
  rating: number;
  sourness: number;
  sweetness: number;
  bitterness: number;
  richness: number;
  created_at: string;
}

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export default function DashboardPage() {
  const [entries, setEntries] = useState<CoffeeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        // ユーザー確認
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = "/auth";
          return;
        }

        // 記録取得
        const { data, error } = await supabase
          .from("coffee_entries")
          .select("id, bean_name, bean_origin, roast_level, brew_method, rating, sourness, sweetness, bitterness, richness, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setEntries(data || []);
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

    fetchEntries();
  }, []);

  // ダッシュボード統計情報
  const getStats = () => {
    const totalEntries = entries.length;

    // 平均評価
    const avgRating = entries.reduce((sum, entry) => sum + entry.rating, 0) / (totalEntries || 1);

    // 最も使用した抽出方法
    const methodCounts: Record<string, number> = {};
    for (const entry of entries) {
      if (entry.brew_method) {
        methodCounts[entry.brew_method] = (methodCounts[entry.brew_method] || 0) + 1;
      }
    }
    const topMethod = Object.entries(methodCounts)
      .sort((a, b) => b[1] - a[1])
      .shift();

    // 最も頻繁に飲んだ豆の産地
    const originCounts: Record<string, number> = {};
    for (const entry of entries) {
      if (entry.bean_origin) {
        originCounts[entry.bean_origin] = (originCounts[entry.bean_origin] || 0) + 1;
      }
    }
    const topOrigin = Object.entries(originCounts)
      .sort((a, b) => b[1] - a[1])
      .shift();

    return {
      totalEntries,
      avgRating: avgRating.toFixed(1),
      topMethod: topMethod ? topMethod[0] : "なし",
      topOrigin: topOrigin ? topOrigin[0] : "なし",
      thisMonth: entries.filter(e => {
        const date = new Date(e.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length,
    };
  };

  if (loading) {
    return <div className="max-w-xl mx-auto py-12 px-4 text-center">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="text-red-600 mb-4">{error}</div>
        <Link href="/" className="text-blue-600 hover:underline">← ホームに戻る</Link>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Link href="/" className="text-zinc-600 mr-4 hover:text-zinc-900">
          ← ホーム
        </Link>
        <h1 className="text-xl font-bold flex-1">ダッシュボード</h1>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <div className="text-zinc-500 mb-4">まだコーヒー記録がありません</div>
          <Link
            href="/record"
            className="bg-amber-600 text-white px-4 py-2 rounded shadow hover:bg-amber-700 transition"
          >
            記録を始める
          </Link>
        </div>
      ) : (
        <>
          {/* 統計サマリー */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-zinc-500 text-sm">総記録数</div>
              <div className="text-3xl font-bold">{stats.totalEntries}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-zinc-500 text-sm">今月の記録</div>
              <div className="text-3xl font-bold">{stats.thisMonth}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-zinc-500 text-sm">平均評価</div>
              <div className="text-3xl font-bold text-amber-600">★ {stats.avgRating}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-zinc-500 text-sm">好みの抽出方法</div>
              <div className="text-xl font-medium truncate">{stats.topMethod}</div>
            </div>
          </div>

          {/* 傾向分析 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">コーヒー傾向分析</h2>
            <CoffeeTrends entries={entries} />
          </div>

          {/* 最近の記録 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">最近の記録</h2>
              <Link href="/entries" className="text-blue-600 text-sm hover:underline">
                すべて見る
              </Link>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="bg-zinc-50 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">日付</th>
                    <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">豆名</th>
                    <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">産地</th>
                    <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">抽出方法</th>
                    <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">評価</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {entries.slice(0, 5).map(entry => (
                    <tr key={entry.id} className="hover:bg-zinc-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(entry.created_at).toLocaleDateString("ja-JP")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/entries/${entry.id}`} className="font-medium text-blue-600 hover:underline">
                          {entry.bean_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.bean_origin || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.brew_method || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-amber-600">{"★".repeat(entry.rating)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
