'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { Avatar } from './PostComposer';

export default function AppShell({
  me,
  children,
}: {
  me: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleAddAccount() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const isHome = pathname === '/';
  const isLikes = pathname === '/likes';
  const isProfile = pathname === `/profile/${me.username}`;

  return (
    <div className="min-h-screen w-full flex justify-center bg-white">
      <div className="w-full max-w-[990px] flex">
        {/* --- デスクトップ左サイドバー --- */}
        <aside className="hidden md:flex flex-col w-[240px] shrink-0 py-4 px-3 sticky top-0 h-screen">
          <Link href="/" className="text-[28px] font-bold px-3 mb-6 select-none">
            ×
          </Link>

          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              className={`flex items-center gap-4 px-3 py-3 rounded-full text-[19px] hover:bg-[#F7F8F8] transition-colors ${
                isHome ? 'font-bold' : ''
              }`}
            >
              <HomeIcon filled={isHome} />
              ホーム
            </Link>
            <Link
              href="/likes"
              className={`flex items-center gap-4 px-3 py-3 rounded-full text-[19px] hover:bg-[#F7F8F8] transition-colors ${
                isLikes ? 'font-bold' : ''
              }`}
            >
              <BookmarkIcon filled={isLikes} />
              履歴
            </Link>
            <Link
              href={`/profile/${me.username}`}
              className={`flex items-center gap-4 px-3 py-3 rounded-full text-[19px] hover:bg-[#F7F8F8] transition-colors ${
                isProfile ? 'font-bold' : ''
              }`}
            >
              <UserIcon filled={isProfile} />
              プロフィール
            </Link>
          </nav>

          <div className="mt-auto relative">
            {accountMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setAccountMenuOpen(false)} />
                <div className="absolute bottom-[64px] left-0 right-0 z-30 bg-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.18)] border border-[#EFF3F4] overflow-hidden">
                  <button
                    onClick={handleAddAccount}
                    className="w-full text-left px-4 py-3 text-[14px] font-bold hover:bg-[#F7F8F8] transition-colors"
                  >
                    新しいアカウントを追加
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-[14px] font-bold text-[#F4212E] hover:bg-[#F4212E]/10 transition-colors border-t border-[#EFF3F4]"
                  >
                    @{me.username} をログアウト
                  </button>
                </div>
              </>
            )}

            <button
              onClick={() => setAccountMenuOpen((v) => !v)}
              className="flex items-center gap-3 px-3 py-3 rounded-full hover:bg-[#F7F8F8] transition-colors w-full text-left"
            >
              <Avatar url={me.avatar_url} name={me.display_name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold truncate">{me.display_name}</p>
                <p className="text-[13px] text-[#536471] truncate">@{me.username}</p>
              </div>
              <MoreIcon />
            </button>
          </div>
        </aside>

        {/* --- メインカラム --- */}
        <main className="flex-1 min-w-0 border-x border-[#EFF3F4] pb-16 md:pb-0">
          {/* モバイル上部ヘッダー */}
          <div className="md:hidden sticky top-0 bg-white/90 backdrop-blur border-b border-[#EFF3F4] py-3 flex items-center justify-center z-10">
            <span className="text-[22px] font-bold select-none">×</span>
          </div>
          {children}
        </main>
      </div>

      {/* --- モバイル下タブバー --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-[#EFF3F4] flex items-center justify-around h-[52px] z-10">
        <Link href="/" className="p-3">
          <HomeIcon filled={isHome} />
        </Link>
        <Link href="/likes" className="p-3">
          <BookmarkIcon filled={isLikes} />
        </Link>
        <Link href={`/profile/${me.username}`} className="p-3">
          <UserIcon filled={isProfile} />
        </Link>

        <div className="relative">
          {accountMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setAccountMenuOpen(false)} />
              <div className="absolute bottom-[52px] right-0 z-30 w-56 bg-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.18)] border border-[#EFF3F4] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#EFF3F4]">
                  <p className="text-[14px] font-bold truncate">{me.display_name}</p>
                  <p className="text-[13px] text-[#536471] truncate">@{me.username}</p>
                </div>
                <button
                  onClick={handleAddAccount}
                  className="w-full text-left px-4 py-3 text-[14px] font-bold hover:bg-[#F7F8F8] transition-colors"
                >
                  新しいアカウントを追加
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-[14px] font-bold text-[#F4212E] hover:bg-[#F4212E]/10 transition-colors border-t border-[#EFF3F4]"
                >
                  ログアウト
                </button>
              </div>
            </>
          )}

          <button onClick={() => setAccountMenuOpen((v) => !v)} className="p-2 block">
            <Avatar url={me.avatar_url} name={me.display_name} size={28} />
          </button>
        </div>
      </nav>
    </div>
  );
}

function HomeIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"
        fill={filled ? '#0F1419' : 'none'}
        stroke="#0F1419"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 4h12a1 1 0 011 1v15l-7-4-7 4V5a1 1 0 011-1z"
        fill={filled ? '#0F1419' : 'none'}
        stroke="#0F1419"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="8"
        r="4"
        fill={filled ? '#0F1419' : 'none'}
        stroke="#0F1419"
        strokeWidth="1.6"
      />
      <path
        d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"
        fill="none"
        stroke="#0F1419"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.8" fill="#536471" />
      <circle cx="12" cy="12" r="1.8" fill="#536471" />
      <circle cx="19" cy="12" r="1.8" fill="#536471" />
    </svg>
  );
}
