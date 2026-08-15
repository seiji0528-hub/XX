'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,15}$/;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!USERNAME_RE.test(username)) {
      setError('ユーザー名は英数字とアンダースコアのみ、3〜15文字で入力してください。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('このメールアドレスは既に使われています。');
      } else {
        setError('登録に失敗しました。時間をおいて試してください。');
      }
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[380px] flex flex-col items-center">
          <div className="mb-8 select-none">
            <span
              className="text-[40px] leading-none font-bold"
              style={{ color: '#0F1419' }}
            >
              ×
            </span>
          </div>

          <h1 className="text-[23px] font-bold text-[#0F1419] mb-8 text-center leading-snug">
            アカウントを作成
          </h1>

          <form onSubmit={handleSignup} className="w-full flex flex-col gap-4">
            {error && (
              <p className="text-[13px] text-[#F4212E] leading-snug">{error}</p>
            )}

            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="名前"
              className="w-full h-[56px] rounded-[4px] border border-[#CFD9DE] px-3
                text-[17px] text-[#0F1419] placeholder:text-[#536471]
                focus:outline-none focus:border-[#4A5FE0] focus:ring-1 focus:ring-[#4A5FE0]
                transition-colors"
            />

            <div className="flex flex-col gap-1">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="ユーザー名(@なし、英数字と_のみ)"
                className="w-full h-[56px] rounded-[4px] border border-[#CFD9DE] px-3
                  text-[17px] text-[#0F1419] placeholder:text-[#536471]
                  focus:outline-none focus:border-[#4A5FE0] focus:ring-1 focus:ring-[#4A5FE0]
                  transition-colors"
              />
            </div>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              className="w-full h-[56px] rounded-[4px] border border-[#CFD9DE] px-3
                text-[17px] text-[#0F1419] placeholder:text-[#536471]
                focus:outline-none focus:border-[#4A5FE0] focus:ring-1 focus:ring-[#4A5FE0]
                transition-colors"
            />

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード(6文字以上)"
              className="w-full h-[56px] rounded-[4px] border border-[#CFD9DE] px-3
                text-[17px] text-[#0F1419] placeholder:text-[#536471]
                focus:outline-none focus:border-[#4A5FE0] focus:ring-1 focus:ring-[#4A5FE0]
                transition-colors"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[44px] rounded-full bg-[#0F1419] text-white text-[15px]
                font-bold mt-2 disabled:opacity-50 transition-opacity"
            >
              {loading ? '作成中…' : 'アカウントを作成'}
            </button>
          </form>

          <div className="w-full flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#EFF3F4]" />
            <span className="text-[13px] text-[#536471]">または</span>
            <div className="flex-1 h-px bg-[#EFF3F4]" />
          </div>

          <Link
            href="/login"
            className="w-full h-[44px] rounded-full border border-[#CFD9DE]
              flex items-center justify-center text-[15px] font-bold text-[#0F1419]
              hover:bg-[#F7F8F8] transition-colors"
          >
            すでにアカウントをお持ちの方
          </Link>
        </div>
      </div>
    </div>
  );
}
