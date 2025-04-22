"use client";
import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  type TooltipItem,
  type ChartTypeRegistry,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

// Chart.jsの設定
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// 日本語用設定
ChartJS.defaults.font.family = "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', Meiryo, sans-serif";

interface CoffeeEntry {
  id: string;
  bean_name: string;
  bean_origin?: string;
  roast_level?: string;
  brew_method?: string;
  rating: number;
  sourness: number;
  sweetness: number;
  bitterness: number;
  richness: number;
  created_at: string;
}

interface CoffeeTrendsProps {
  entries: CoffeeEntry[];
}

export default function CoffeeTrends({ entries }: CoffeeTrendsProps) {
  // 焙煎度の分布
  const roastLevelData = () => {
    const levels: Record<string, number> = {
      "浅煎り": 0,
      "中浅煎り": 0,
      "中煎り": 0,
      "中深煎り": 0,
      "深煎り": 0,
      "その他/不明": 0,
    };

    for (const entry of entries) {
      if (entry.roast_level && levels[entry.roast_level] !== undefined) {
        levels[entry.roast_level]++;
      } else {
        levels["その他/不明"]++;
      }
    }

    return {
      labels: Object.keys(levels),
      datasets: [
        {
          label: "焙煎度の分布",
          data: Object.values(levels),
          backgroundColor: [
            "rgba(255, 217, 102, 0.6)",  // 浅煎り: 明るい黄色
            "rgba(241, 196, 15, 0.6)",   // 中浅煎り: 黄色
            "rgba(230, 126, 34, 0.6)",   // 中煎り: オレンジ
            "rgba(165, 42, 42, 0.6)",    // 中深煎り: 茶色
            "rgba(88, 24, 69, 0.6)",     // 深煎り: 濃い赤茶色
            "rgba(189, 195, 199, 0.6)",  // その他: グレー
          ],
          borderColor: [
            "rgba(255, 217, 102, 1)",
            "rgba(241, 196, 15, 1)",
            "rgba(230, 126, 34, 1)",
            "rgba(165, 42, 42, 1)",
            "rgba(88, 24, 69, 1)",
            "rgba(189, 195, 199, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // 評価分布（星の数ごと）
  const ratingData = () => {
    const ratings = [0, 0, 0, 0, 0]; // 1〜5の評価に対応

    for (const entry of entries) {
      if (entry.rating >= 1 && entry.rating <= 5) {
        ratings[entry.rating - 1]++;
      }
    }

    return {
      labels: ["★1", "★2", "★3", "★4", "★5"],
      datasets: [
        {
          label: "評価の分布",
          data: ratings,
          backgroundColor: "rgba(255, 159, 64, 0.6)",
          borderColor: "rgba(255, 159, 64, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // 月別記録数
  const monthlyData = () => {
    // 過去6ヶ月分のデータを集計
    const months: Record<string, number> = {};
    const now = new Date();

    // 過去6ヶ月の月名を作成
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString("ja-JP", { month: "short" });
      months[monthName] = 0;
    }

    // 各記録を該当する月にカウント
    for (const entry of entries) {
      const entryDate = new Date(entry.created_at);
      const monthName = entryDate.toLocaleDateString("ja-JP", { month: "short" });

      // 過去6ヶ月のデータのみカウント
      if (months[monthName] !== undefined) {
        months[monthName]++;
      }
    }

    return {
      labels: Object.keys(months),
      datasets: [
        {
          label: "月別記録数",
          data: Object.values(months),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // 味の傾向（酸味・甘味・苦味・コク）の平均
  const tasteProfileData = () => {
    let sourness = 0;
    let sweetness = 0;
    let bitterness = 0;
    let richness = 0;

    for (const entry of entries) {
      sourness += entry.sourness || 0;
      sweetness += entry.sweetness || 0;
      bitterness += entry.bitterness || 0;
      richness += entry.richness || 0;
    }

    const count = entries.length || 1; // ゼロ除算回避

    return {
      labels: ["酸味", "甘味", "苦味", "コク"],
      datasets: [
        {
          label: "味の傾向（平均）",
          data: [
            sourness / count,
            sweetness / count,
            bitterness / count,
            richness / count,
          ],
          backgroundColor: "rgba(153, 102, 255, 0.6)",
          borderColor: "rgba(153, 102, 255, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // 抽出方法の分布
  const brewMethodData = () => {
    const methods: Record<string, number> = {};

    // 抽出方法をカウント
    for (const entry of entries) {
      if (entry.brew_method) {
        if (!methods[entry.brew_method]) {
          methods[entry.brew_method] = 0;
        }
        methods[entry.brew_method]++;
      }
    }

    // 出現回数でソート
    const sortedMethods = Object.entries(methods)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // 上位5つのみ

    return {
      labels: sortedMethods.map(([method]) => method),
      datasets: [
        {
          label: "抽出方法の傾向",
          data: sortedMethods.map(([_, count]) => count),
          backgroundColor: [
            "rgba(54, 162, 235, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ],
          borderColor: [
            "rgba(54, 162, 235, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // グラフオプション
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<keyof ChartTypeRegistry>) => `${context.dataset.label}: ${context.parsed.y}件`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<keyof ChartTypeRegistry>) => `${context.label}: ${context.parsed}件`
        }
      }
    }
  };

  // データが少ない場合のメッセージ
  if (entries.length < 3) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">コーヒー傾向分析</h2>
        <div className="text-center py-8 text-zinc-500">
          より正確な分析のためには、もう少し記録を増やしてください（3件以上推奨）
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 評価分布 */}
      <div className="p-4 bg-white rounded-lg shadow-sm border">
        <h3 className="text-md font-semibold mb-3">評価分布</h3>
        <Bar data={ratingData()} options={barOptions} />
      </div>

      {/* 焙煎度の分布 */}
      <div className="p-4 bg-white rounded-lg shadow-sm border">
        <h3 className="text-md font-semibold mb-3">焙煎度の分布</h3>
        <Pie data={roastLevelData()} options={pieOptions} />
      </div>

      {/* 月別記録数 */}
      <div className="p-4 bg-white rounded-lg shadow-sm border">
        <h3 className="text-md font-semibold mb-3">月別記録数</h3>
        <Bar data={monthlyData()} options={barOptions} />
      </div>

      {/* 味の傾向 */}
      <div className="p-4 bg-white rounded-lg shadow-sm border">
        <h3 className="text-md font-semibold mb-3">味の傾向（平均）</h3>
        <Bar data={tasteProfileData()} options={{
          ...barOptions,
          scales: {
            y: {
              beginAtZero: true,
              max: 5,
              ticks: {
                stepSize: 1
              }
            }
          }
        }} />
      </div>

      {/* 抽出方法の分布 */}
      {Object.keys(brewMethodData().labels).length > 0 && (
        <div className="p-4 bg-white rounded-lg shadow-sm border">
          <h3 className="text-md font-semibold mb-3">よく使う抽出方法</h3>
          <Bar data={brewMethodData()} options={barOptions} />
        </div>
      )}
    </div>
  );
}
