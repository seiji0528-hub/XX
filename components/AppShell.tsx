'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const isHome = pathname === '/';
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
              href={`/profile/${me.username}`}
              className={`flex items-center gap-4 px-3 py-3 rounded-full text-[19px] hover:bg-[#F7F8F8] transition-colors ${
                isProfile ? 'font-bold' : ''
              }`}
            >
              <UserIcon filled={isProfile} />
              プロフィール
            </Link>
          </nav>

          <div className="mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-full text-[15px] text-[#536471] hover:bg-[#F7F8F8] transition-colors w-full text-left"
            >
              {me.display_name} をログアウト
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
        <Link href={`/profile/${me.username}`} className="p-3">
          <UserIcon filled={isProfile} />
        </Link>
        <button onClick={handleLogout} className="p-3">
          <LogoutIcon />
        </button>
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

function LogoutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
        stroke="#536471"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="#536471"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
