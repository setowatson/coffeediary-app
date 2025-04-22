"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

// 焙煎度選択肢
const ROAST_LEVELS = ["浅煎り", "中浅煎り", "中煎り", "中深煎り", "深煎り"];

// フレーバーノート選択肢
const FLAVOR_NOTES = [
  "ナッティ", "チョコレート", "キャラメル", "ベリー系", "柑橘系", "フローラル",
  "スパイシー", "ハーブ", "フルーティ", "ワイニー", "スイート"
];

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

export default function RecordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 基本情報
  const [beanName, setBeanName] = useState("");
  const [beanOrigin, setBeanOrigin] = useState("");
  const [roastLevel, setRoastLevel] = useState("");
  const [shop, setShop] = useState("");
  const [brewMethod, setBrewMethod] = useState("");
  const [madeByUser, setMadeByUser] = useState(true);
  const [grindSize, setGrindSize] = useState("");

  // 評価
  const [sourness, setSourness] = useState(3);
  const [sweetness, setSweetness] = useState(3);
  const [bitterness, setBitterness] = useState(3);
  const [richness, setRichness] = useState(3);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [customFlavor, setCustomFlavor] = useState("");
  const [rating, setRating] = useState(3);

  // メモ・写真
  const [memo, setMemo] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleFlavor = (flavor: string) => {
    setSelectedFlavors(prev =>
      prev.includes(flavor)
        ? prev.filter(f => f !== flavor)
        : [...prev, flavor]
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setPhotoFile(file);

    // プレビュー生成
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ユーザー取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("認証情報が見つかりません");

      // 写真アップロード処理
      let photoUrl = null;
      if (photoFile) {
        const filename = `${user.id}/${Date.now()}-${photoFile.name}`;
        const { data, error } = await supabase.storage
          .from('coffee-photos')
          .upload(filename, photoFile);

        if (error) throw error;
        // 写真のURLを生成
        const { data: urlData } = supabase.storage
          .from('coffee-photos')
          .getPublicUrl(filename);

        photoUrl = urlData.publicUrl;
      }

      // フレーバーノート処理
      const flavors = [...selectedFlavors];
      if (customFlavor) {
        flavors.push(customFlavor);
      }

      // データ保存
      const { error } = await supabase.from('coffee_entries').insert({
        user_id: user.id,
        bean_name: beanName,
        bean_origin: beanOrigin,
        roast_level: roastLevel,
        shop,
        brew_method: brewMethod,
        made_by_user: madeByUser,
        grind_size: grindSize,
        sourness,
        sweetness,
        bitterness,
        richness,
        flavor_notes: flavors,
        rating,
        memo,
        photos: photoUrl ? [photoUrl] : [],
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSuccess(true);
      // 成功したらホームに戻るか、別の記録を続けるか確認
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

  // 評価のスライダーコンポーネント
  const RatingSlider = ({
    label,
    value,
    onChange
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div className="mb-3">
      <label className="block text-sm font-medium mb-1">
        {label}: <span className="font-bold">{value}</span>
      </label>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-zinc-500">
        <span>弱</span>
        <span>強</span>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center">
        <div className="text-green-600 mb-4 text-xl">✓ 記録を保存しました！</div>
        <p>ホームに戻ります...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-xl font-bold mb-6">コーヒー記録</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報セクション */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">基本情報</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              豆の名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              required
              value={beanName}
              onChange={(e) => setBeanName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">産地</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={beanOrigin}
              onChange={(e) => setBeanOrigin(e.target.value)}
              placeholder="例: エチオピア、コロンビアなど"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">焙煎度</label>
            <div className="flex flex-wrap gap-2">
              {ROAST_LEVELS.map(level => (
                <button
                  key={level}
                  type="button"
                  className={`px-3 py-1 rounded-full border text-sm ${roastLevel === level ? "bg-zinc-700 text-white border-zinc-700" : "bg-zinc-100"}`}
                  onClick={() => setRoastLevel(level)}
                >{level}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">カフェ/購入店</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">抽出方法</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={brewMethod}
              onChange={(e) => setBrewMethod(e.target.value)}
              placeholder="例: ハンドドリップ、エスプレッソなど"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={madeByUser}
                onChange={(e) => setMadeByUser(e.target.checked)}
              />
              <span className="text-sm font-medium">自分で淹れた</span>
            </label>
          </div>

          {madeByUser && (
            <div>
              <label className="block text-sm font-medium mb-1">挽き具合</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={grindSize}
                onChange={(e) => setGrindSize(e.target.value)}
                placeholder="例: 中細挽き、極細挽きなど"
              />
            </div>
          )}
        </section>

        {/* 評価セクション */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">評価</h2>

          <RatingSlider label="酸味" value={sourness} onChange={setSourness} />
          <RatingSlider label="甘味" value={sweetness} onChange={setSweetness} />
          <RatingSlider label="苦味" value={bitterness} onChange={setBitterness} />
          <RatingSlider label="コク" value={richness} onChange={setRichness} />

          <div>
            <label className="block text-sm font-medium mb-1">フレーバーノート (複数選択可)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {FLAVOR_NOTES.map(flavor => (
                <button
                  key={flavor}
                  type="button"
                  className={`px-3 py-1 rounded-full border text-sm ${selectedFlavors.includes(flavor) ? "bg-zinc-700 text-white border-zinc-700" : "bg-zinc-100"}`}
                  onClick={() => handleFlavor(flavor)}
                >{flavor}</button>
              ))}
            </div>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={customFlavor}
              onChange={(e) => setCustomFlavor(e.target.value)}
              placeholder="その他のフレーバーがあれば入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              総合評価: <span className="font-bold">{rating}</span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
        </section>

        {/* メモ・写真セクション */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">メモ・写真</h2>

          <div>
            <label className="block text-sm font-medium mb-1">メモ</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={3}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="気づいたことや感想など自由に記録できます"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">写真</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full border rounded px-3 py-2"
            />
            {photoPreview && (
              <div className="mt-2">
                <img src={photoPreview} alt="プレビュー" className="max-h-40 rounded" />
              </div>
            )}
          </div>
        </section>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          className="w-full bg-amber-600 text-white py-2 rounded hover:bg-amber-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "保存中..." : "記録を保存"}
        </button>
      </form>
    </div>
  );
}
