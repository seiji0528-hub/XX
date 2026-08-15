'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let email = identifier.trim();

    // username で入力された場合は profiles から email を逆引きできないので、
    // ログインは email 前提にする(シンプルさ優先)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError('ユーザー名またはパスワードが正しくありません。');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[380px] flex flex-col items-center">
          {/* ロゴ */}
          <div className="mb-10 select-none">
            <span
              className="text-[40px] leading-none font-bold"
              style={{ color: '#0F1419' }}
            >
              ×
            </span>
          </div>

          <h1 className="text-[23px] font-bold text-[#0F1419] mb-8 text-center leading-snug">
            アカウントにログイン
          </h1>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            {error && (
              <p className="text-[13px] text-[#F4212E] leading-snug">{error}</p>
            )}

            <div className="relative">
              <input
                type="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="メールアドレス"
                className="w-full h-[56px] rounded-[4px] border border-[#CFD9DE] px-3 pt-3
                  text-[17px] text-[#0F1419] placeholder:text-[#536471]
                  focus:outline-none focus:border-[#4A5FE0] focus:ring-1 focus:ring-[#4A5FE0]
                  transition-colors"
              />
            </div>

            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                className="w-full h-[56px] rounded-[4px] border border-[#CFD9DE] px-3 pt-3
                  text-[17px] text-[#0F1419] placeholder:text-[#536471]
                  focus:outline-none focus:border-[#4A5FE0] focus:ring-1 focus:ring-[#4A5FE0]
                  transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[44px] rounded-full bg-[#0F1419] text-white text-[15px]
                font-bold mt-2 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'ログイン中…' : 'ログイン'}
            </button>
          </form>

          <div className="w-full flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#EFF3F4]" />
            <span className="text-[13px] text-[#536471]">または</span>
            <div className="flex-1 h-px bg-[#EFF3F4]" />
          </div>

          <Link
            href="/signup"
            className="w-full h-[44px] rounded-full border border-[#CFD9DE]
              flex items-center justify-center text-[15px] font-bold text-[#0F1419]
              hover:bg-[#F7F8F8] transition-colors"
          >
            アカウントを作成
          </Link>
        </div>
      </div>
    </div>
  );
}
