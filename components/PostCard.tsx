'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { PostWithMeta, CommentWithProfile } from '@/lib/types';
import { Avatar } from './PostComposer';

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}日前`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function PostCard({
  post,
  myUserId,
  onChanged,
}: {
  post: PostWithMeta;
  myUserId: string;
  onChanged: () => void;
}) {
  const supabase = createClient();

  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [likeBusy, setLikeBusy] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentWithProfile[] | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  async function toggleLike() {
    if (likeBusy) return;
    setLikeBusy(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));

    if (nextLiked) {
      await supabase.from('x_likes').insert({ post_id: post.id, user_id: myUserId });
    } else {
      await supabase
        .from('x_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', myUserId);
    }
    setLikeBusy(false);
  }

  async function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      const { data } = await supabase
        .from('x_comments')
        .select('id, post_id, user_id, content, created_at, x_profiles ( username, display_name, avatar_url )')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      const mapped = ((data as any[]) ?? []).map((c) => ({ ...c, profiles: c.x_profiles }));
      setComments(mapped);
    }
  }

  async function submitComment() {
    if (!commentInput.trim() || commentBusy) return;
    setCommentBusy(true);
    const { data, error } = await supabase
      .from('x_comments')
      .insert({ post_id: post.id, user_id: myUserId, content: commentInput.trim() })
      .select('id, post_id, user_id, content, created_at, x_profiles ( username, display_name, avatar_url )')
      .single();

    if (!error && data) {
      const mapped = { ...(data as any), profiles: (data as any).x_profiles };
      setComments((prev) => [...(prev ?? []), mapped]);
      setCommentInput('');
      onChanged();
    }
    setCommentBusy(false);
  }

  return (
    <article className="border-b border-[#EFF3F4] px-4 py-3">
      <div className="flex gap-3">
        <Link href={`/profile/${post.profiles.username}`}>
          <Avatar url={post.profiles.avatar_url} name={post.profiles.display_name} size={44} />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[15px] flex-wrap">
            <Link href={`/profile/${post.profiles.username}`} className="font-bold hover:underline">
              {post.profiles.display_name}
            </Link>
            <span className="text-[#536471]">@{post.profiles.username}</span>
            <span className="text-[#536471]">·</span>
            <span className="text-[#536471]">{formatTime(post.created_at)}</span>
          </div>

          <p className="text-[15px] whitespace-pre-wrap mt-0.5 break-words">{post.content}</p>

          {post.image_url && (
            <div className="mt-2 rounded-2xl overflow-hidden border border-[#EFF3F4]">
              <img src={post.image_url} alt="" className="w-full max-h-[420px] object-cover" />
            </div>
          )}

          <div className="flex items-center gap-8 mt-3 text-[#536471]">
            <button
              onClick={toggleComments}
              className="flex items-center gap-1.5 hover:text-[#4A5FE0] transition-colors"
            >
              <CommentIcon />
              <span className="text-[13px]">{comments?.length ?? post.comments_count}</span>
            </button>

            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 transition-colors ${
                liked ? 'text-[#F91880]' : 'hover:text-[#F91880]'
              }`}
            >
              <HeartIcon filled={liked} />
              <span className="text-[13px]">{likeCount}</span>
            </button>
          </div>

          {showComments && (
            <div className="mt-3 pl-1 border-l-2 border-[#EFF3F4] pl-3 flex flex-col gap-3">
              {comments === null && <p className="text-[13px] text-[#536471]">読み込み中…</p>}
              {comments?.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar url={c.profiles.avatar_url} name={c.profiles.display_name} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[13px]">
                      <span className="font-bold">{c.profiles.display_name}</span>
                      <span className="text-[#536471]">@{c.profiles.username}</span>
                    </div>
                    <p className="text-[14px] whitespace-pre-wrap break-words">{c.content}</p>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 items-center mt-1">
                <input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  placeholder="返信を投稿"
                  maxLength={140}
                  className="flex-1 h-9 rounded-full border border-[#CFD9DE] px-3 text-[13px] outline-none focus:border-[#4A5FE0]"
                />
                <button
                  onClick={submitComment}
                  disabled={!commentInput.trim() || commentBusy}
                  className="h-9 px-4 rounded-full bg-[#0F1419] text-white text-[13px] font-bold disabled:opacity-40"
                >
                  返信
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 20s-7-4.35-9.5-9C.87 7.5 2.5 4 6 4c2 0 3.5 1.2 4.5 2.8C11.5 5.2 13 4 15 4c3.5 0 5.13 3.5 3.5 7-2.5 4.65-9.5 9-9.5 9z"
        fill={filled ? '#F91880' : 'none'}
        stroke={filled ? '#F91880' : 'currentColor'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12c0 4.4-4 8-9 8-1.2 0-2.4-.2-3.4-.6L3 20l1.1-4.1C3.4 14.6 3 13.3 3 12c0-4.4 4-8 9-8s9 3.6 9 8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
