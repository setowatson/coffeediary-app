"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface CoffeeEntry {
  id: string;
  bean_name: string;
  bean_origin: string;
  roast_level: string;
  brew_method: string;
  created_at: string;
  rating: number;
}

// 焙煎度選択肢
const ROAST_LEVELS = ["浅煎り", "中浅煎り", "中煎り", "中深煎り", "深煎り"];

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

export default function EntriesPage() {
  const [entries, setEntries] = useState<CoffeeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<CoffeeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 検索・フィルター条件
  const [searchTerm, setSearchTerm] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [roastFilter, setRoastFilter] = useState("");
  const [brewMethodFilter, setBrewMethodFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");

  // フィルター用のユニーク値
  const [origins, setOrigins] = useState<string[]>([]);
  const [brewMethods, setBrewMethods] = useState<string[]>([]);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        // ユーザー確認
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = "/auth";
          return;
        }

        // 全記録取得
        const { data, error } = await supabase
          .from("coffee_entries")
          .select("id, bean_name, bean_origin, roast_level, brew_method, created_at, rating")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        const fetchedEntries = data || [];
        setEntries(fetchedEntries);
        setFilteredEntries(fetchedEntries);

        // 産地とブリューメソッドの一覧を抽出
        const uniqueOrigins = Array.from(
          new Set(
            fetchedEntries
              .map(entry => entry.bean_origin)
              .filter(origin => origin && origin.trim() !== "")
          )
        );

        const uniqueBrewMethods = Array.from(
          new Set(
            fetchedEntries
              .map(entry => entry.brew_method)
              .filter(method => method && method.trim() !== "")
          )
        );

        setOrigins(uniqueOrigins);
        setBrewMethods(uniqueBrewMethods);
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

  // 検索＆フィルターロジック
  useEffect(() => {
    let result = [...entries];

    // 検索条件でフィルタリング
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        entry =>
          (entry.bean_name?.toLowerCase().includes(term)) ||
          (entry.bean_origin?.toLowerCase().includes(term))
      );
    }

    // 産地でフィルタリング
    if (originFilter) {
      result = result.filter(entry => entry.bean_origin === originFilter);
    }

    // 焙煎度でフィルタリング
    if (roastFilter) {
      result = result.filter(entry => entry.roast_level === roastFilter);
    }

    // 抽出方法でフィルタリング
    if (brewMethodFilter) {
      result = result.filter(entry => entry.brew_method === brewMethodFilter);
    }

    // 評価でフィルタリング
    if (ratingFilter > 0) {
      result = result.filter(entry => entry.rating >= ratingFilter);
    }

    // ソート
    if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredEntries(result);
  }, [entries, searchTerm, originFilter, roastFilter, brewMethodFilter, ratingFilter, sortBy]);

  // フィルターリセット
  const resetFilters = () => {
    setSearchTerm("");
    setOriginFilter("");
    setRoastFilter("");
    setBrewMethodFilter("");
    setRatingFilter(0);
    setSortBy("date");
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

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Link href="/" className="text-zinc-600 mr-4 hover:text-zinc-900">
          ← ホーム
        </Link>
        <h1 className="text-xl font-bold flex-1">すべての記録</h1>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
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
          {/* 検索・フィルターエリア */}
          <div className="bg-zinc-50 rounded-lg p-4 mb-6 border">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm text-zinc-600 mb-1">キーワード検索</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="豆名・産地などで検索"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-600 mb-1">産地で絞り込み</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={originFilter}
                  onChange={e => setOriginFilter(e.target.value)}
                >
                  <option value="">すべて</option>
                  {origins.map(origin => (
                    <option key={origin} value={origin}>{origin}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-600 mb-1">焙煎度で絞り込み</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={roastFilter}
                  onChange={e => setRoastFilter(e.target.value)}
                >
                  <option value="">すべて</option>
                  {ROAST_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm text-zinc-600 mb-1">抽出方法で絞り込み</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={brewMethodFilter}
                  onChange={e => setBrewMethodFilter(e.target.value)}
                >
                  <option value="">すべて</option>
                  {brewMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-600 mb-1">評価で絞り込み</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={ratingFilter}
                  onChange={e => setRatingFilter(Number(e.target.value))}
                >
                  <option value="0">すべて</option>
                  <option value="5">★5のみ</option>
                  <option value="4">★4以上</option>
                  <option value="3">★3以上</option>
                  <option value="2">★2以上</option>
                  <option value="1">★1以上</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-600 mb-1">並び替え</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as "date" | "rating")}
                >
                  <option value="date">日付（新しい順）</option>
                  <option value="rating">評価（高い順）</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-zinc-500">
                {filteredEntries.length} 件表示 / 全 {entries.length} 件
              </div>

              <button
                className="px-4 py-2 border rounded hover:bg-zinc-100 transition"
                onClick={resetFilters}
              >
                フィルターをリセット
              </button>
            </div>
          </div>

          {/* 結果表示エリア */}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <div className="text-zinc-500">
                該当する記録がありません
              </div>
              <button
                className="mt-4 text-blue-600 hover:underline"
                onClick={resetFilters}
              >
                フィルターをリセットする
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map(entry => (
                <li key={entry.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow transition">
                  <Link href={`/entries/${entry.id}`} className="block">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{entry.bean_name}</h3>
                        <div className="text-sm text-zinc-500 mt-1">
                          {new Date(entry.created_at).toLocaleDateString("ja-JP")}
                        </div>
                      </div>
                      <div className="text-amber-600">{"★".repeat(entry.rating)}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.bean_origin && (
                        <span className="text-xs px-2 py-1 bg-zinc-100 rounded-full">
                          {entry.bean_origin}
                        </span>
                      )}
                      {entry.roast_level && (
                        <span className="text-xs px-2 py-1 bg-zinc-100 rounded-full">
                          {entry.roast_level}
                        </span>
                      )}
                      {entry.brew_method && (
                        <span className="text-xs px-2 py-1 bg-zinc-100 rounded-full">
                          {entry.brew_method}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
