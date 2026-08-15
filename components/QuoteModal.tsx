'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PostWithMeta, Profile } from '@/lib/types';
import { Avatar } from './PostComposer';

const MAX_LEN = 140;

export default function QuoteModal({
  me,
  targetPost,
  onClose,
  onPosted,
}: {
  me: Profile;
  targetPost: PostWithMeta;
  onClose: () => void;
  onPosted: () => void;
}) {
  const supabase = createClient();
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_LEN - content.length;
  const canPost = content.trim().length > 0 && remaining >= 0 && !posting;

  async function handlePost() {
    if (!canPost) return;
    setPosting(true);
    setError(null);

    const { error: insertError } = await supabase.from('x_posts').insert({
      user_id: me.id,
      content: content.trim(),
      quoted_post_id: targetPost.id,
    });

    setPosting(false);

    if (insertError) {
      setError('投稿に失敗しました。もう一度試してください。');
      return;
    }

    onPosted();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-[500px] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#EFF3F4] sticky top-0 bg-white">
          <button onClick={onClose} className="text-[15px]">
            キャンセル
          </button>
          <button
            onClick={handlePost}
            disabled={!canPost}
            className="h-[34px] px-4 rounded-full bg-[#0F1419] text-white text-[14px] font-bold disabled:opacity-40"
          >
            {posting ? '投稿中…' : '投稿する'}
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-3">
            <Avatar url={me.avatar_url} name={me.display_name} size={44} />
            <div className="flex-1 min-w-0">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="コメントを追加"
                rows={3}
                autoFocus
                className="w-full resize-none text-[17px] placeholder:text-[#536471] outline-none"
              />

              {error && <p className="text-[13px] text-[#F4212E] mt-1">{error}</p>}

              {/* 引用元投稿のプレビュー */}
              <div className="mt-2 border border-[#EFF3F4] rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-[13px] flex-wrap">
                  <Avatar url={targetPost.profiles.avatar_url} name={targetPost.profiles.display_name} size={20} />
                  <span className="font-bold">{targetPost.profiles.display_name}</span>
                  <span className="text-[#536471]">@{targetPost.profiles.username}</span>
                </div>
                <p className="text-[14px] whitespace-pre-wrap break-words mt-1">{targetPost.content}</p>
                {targetPost.image_url && (
                  <div className="mt-2 rounded-xl overflow-hidden">
                    <img src={targetPost.image_url} alt="" className="w-full max-h-[200px] object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-2">
                <span className={`text-[13px] ${remaining < 0 ? 'text-[#F4212E]' : 'text-[#536471]'}`}>
                  {remaining}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
