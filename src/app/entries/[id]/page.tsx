"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface CoffeeEntry {
  id: string;
  user_id: string;
  bean_name: string;
  bean_origin: string;
  roast_level: string;
  shop: string;
  brew_method: string;
  made_by_user: boolean;
  grind_size: string;
  sourness: number;
  sweetness: number;
  bitterness: number;
  richness: number;
  flavor_notes: string[];
  rating: number;
  memo: string;
  photos: string[];
  created_at: string;
}

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

export default function EntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<CoffeeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        // ユーザー確認
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth");
          return;
        }

        // 記録取得
        const { data, error } = await supabase
          .from("coffee_entries")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("記録が見つかりません");

        setEntry(data as CoffeeEntry);
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

    if (params.id) {
      fetchEntry();
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center">読み込み中...</div>
    );
  }

  if (error || !entry) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="text-red-600 mb-4">{error || "記録が見つかりません"}</div>
        <Link href="/" className="text-blue-600 hover:underline">
          ← ホームに戻る
        </Link>
      </div>
    );
  }

  // 評価バー（酸味・甘味・苦味・コク）
  const RatingBar = ({ label, value }: { label: string; value: number }) => (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="w-full bg-zinc-200 rounded-full h-2">
        <div
          className="bg-amber-600 h-2 rounded-full"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Link href="/" className="text-zinc-600 mr-4 hover:text-zinc-900">
          ← 戻る
        </Link>
        <h1 className="text-xl font-bold flex-1">{entry.bean_name}</h1>
      </div>

      {/* メイン情報 */}
      <div className="bg-white rounded-lg shadow-sm border p-5 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-zinc-500">記録日</div>
            <div>{new Date(entry.created_at).toLocaleDateString("ja-JP")}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">総合評価</div>
            <div className="text-amber-600 text-lg font-bold">
              {"★".repeat(entry.rating)}
            </div>
          </div>
        </div>

        {entry.bean_origin && (
          <div className="mb-4">
            <div className="text-sm text-zinc-500">産地</div>
            <div>{entry.bean_origin}</div>
          </div>
        )}

        {entry.roast_level && (
          <div className="mb-4">
            <div className="text-sm text-zinc-500">焙煎度</div>
            <div>{entry.roast_level}</div>
          </div>
        )}

        {entry.shop && (
          <div className="mb-4">
            <div className="text-sm text-zinc-500">カフェ/購入店</div>
            <div>{entry.shop}</div>
          </div>
        )}

        {entry.brew_method && (
          <div className="mb-4">
            <div className="text-sm text-zinc-500">抽出方法</div>
            <div>{entry.brew_method}</div>
          </div>
        )}

        <div className="mb-4">
          <div className="text-sm text-zinc-500">淹れ方</div>
          <div>{entry.made_by_user ? "自分で淹れた" : "お店で飲んだ"}</div>
        </div>

        {entry.made_by_user && entry.grind_size && (
          <div className="mb-4">
            <div className="text-sm text-zinc-500">挽き具合</div>
            <div>{entry.grind_size}</div>
          </div>
        )}
      </div>

      {/* 評価セクション */}
      <div className="bg-white rounded-lg shadow-sm border p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">テイスト評価</h2>
        <RatingBar label="酸味" value={entry.sourness} />
        <RatingBar label="甘味" value={entry.sweetness} />
        <RatingBar label="苦味" value={entry.bitterness} />
        <RatingBar label="コク" value={entry.richness} />

        {entry.flavor_notes && entry.flavor_notes.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-zinc-500 mb-2">フレーバーノート</div>
            <div className="flex flex-wrap gap-2">
              {entry.flavor_notes.map((flavor) => (
                <span
                  key={`flavor-${flavor}`}
                  className="px-3 py-1 bg-zinc-100 rounded-full text-sm"
                >
                  {flavor}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* メモ */}
      {entry.memo && (
        <div className="bg-white rounded-lg shadow-sm border p-5 mb-6">
          <h2 className="text-lg font-semibold mb-2">メモ</h2>
          <p className="whitespace-pre-wrap">{entry.memo}</p>
        </div>
      )}

      {/* 写真 */}
      {entry.photos && entry.photos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">写真</h2>
          <div className="grid grid-cols-1 gap-4">
            {entry.photos.map((photo) => (
              <div key={`photo-${photo}`} className="relative pb-[75%]">
                <img
                  src={photo}
                  alt="コーヒー写真"
                  className="absolute inset-0 w-full h-full object-cover rounded"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
