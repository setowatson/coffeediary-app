"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Menu, Coffee, BarChart, User, LogOut } from "lucide-react";

interface UserProfile {
  id: string;
  nickname: string;
  avatar_url: string | null;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // プロフィール情報を取得する関数
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, nickname, avatar_url')
        .eq('id', userId)
        .single();

      if (data) {
        setUserProfile(data);
      } else {
        setUserProfile({
          id: userId,
          nickname: '名前未設定',
          avatar_url: null
        });
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
    }
  };

  // 認証状態チェック
  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        fetchUserProfile(user.id);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('認証確認エラー:', error);
      setIsLoggedIn(false);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初期認証状態チェック
    checkAuth();

    // 認証状態変更イベントのリスナーを設定
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          setIsLoggedIn(true);
          fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUserProfile(null);
        }
      }
    );

    // クリーンアップ関数
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // ログアウト後にリダイレクトするかは、onAuthStateChangeでハンドリングする
      // window.location.href = '/auth'; は不要
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-amber-600" />
            <span className="font-bold text-lg">CoffeeDiary</span>
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center space-x-1">
            {isLoggedIn ? (
              <>
                <Link href="/" className="px-3 py-2 rounded-md text-sm text-zinc-700 hover:bg-zinc-100">
                  ホーム
                </Link>
                <Link href="/entries" className="px-3 py-2 rounded-md text-sm text-zinc-700 hover:bg-zinc-100">
                  記録一覧
                </Link>
                <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm text-zinc-700 hover:bg-zinc-100">
                  ダッシュボード
                </Link>
                <Link
                  href="/record"
                  className="ml-2 px-3 py-2 rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-700"
                >
                  新規記録
                </Link>

                {/* ユーザーメニュー */}
                <div className="relative ml-3">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center text-sm rounded-full focus:outline-none"
                  >
                    <div className="relative w-8 h-8 bg-zinc-200 rounded-full overflow-hidden">
                      {userProfile?.avatar_url ? (
                        <Image
                          src={userProfile.avatar_url}
                          alt="ユーザープロフィール"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 m-1.5 text-zinc-500" />
                      )}
                    </div>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <div className="px-4 py-2 text-sm text-zinc-700 border-b">
                        <div className="font-medium">{userProfile?.nickname || '名前未設定'}</div>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 w-full text-left"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        プロフィール設定
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full px-4 py-2 text-sm text-left text-zinc-700 hover:bg-zinc-100"
                      >
                        ログアウト
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              !loading && (
                <Link
                  href="/auth"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700"
                >
                  ログイン / 新規登録
                </Link>
              )
            )}
          </nav>

          {/* モバイルメニュー */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* モバイルメニュー（展開時） */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isLoggedIn ? (
              <>
                <Link
                  href="/"
                  className="block px-3 py-2 rounded-md text-base text-zinc-700 hover:bg-zinc-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ホーム
                </Link>
                <Link
                  href="/entries"
                  className="block px-3 py-2 rounded-md text-base text-zinc-700 hover:bg-zinc-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  記録一覧
                </Link>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 rounded-md text-base text-zinc-700 hover:bg-zinc-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BarChart className="inline-block w-4 h-4 mr-2" />
                  ダッシュボード
                </Link>
                <Link
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-base text-zinc-700 hover:bg-zinc-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="inline-block w-4 h-4 mr-2" />
                  プロフィール設定
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base text-zinc-700 hover:bg-zinc-100"
                >
                  <LogOut className="inline-block w-4 h-4 mr-2" />
                  ログアウト
                </button>
                <Link
                  href="/record"
                  className="block mt-2 px-3 py-2 rounded-md text-base font-medium bg-amber-600 text-white hover:bg-amber-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Coffee className="inline-block w-4 h-4 mr-2" />
                  新規記録作成
                </Link>
              </>
            ) : (
              !loading && (
                <Link
                  href="/auth"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-zinc-800 text-white hover:bg-zinc-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ログイン / 新規登録
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
