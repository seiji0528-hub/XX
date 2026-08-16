'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { PostWithMeta, CommentWithProfile, Profile } from '@/lib/types';
import { Avatar } from './PostComposer';
import QuoteModal from './QuoteModal';

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

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

export default function PostCard({
  post,
  myUserId,
  me,
  repostedBy,
  onChanged,
  defaultShowComments,
}: {
  post: PostWithMeta;
  myUserId: string;
  me?: Profile;
  repostedBy?: { display_name: string; username: string } | null;
  onChanged: () => void;
  defaultShowComments?: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [likeBusy, setLikeBusy] = useState(false);

  const [reposted, setReposted] = useState(post.reposted_by_me);
  const [repostCount, setRepostCount] = useState(post.repost_count);
  const [repostBusy, setRepostBusy] = useState(false);
  const [repostMenuOpen, setRepostMenuOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const [showComments, setShowComments] = useState(!!defaultShowComments);
  const [comments, setComments] = useState<CommentWithProfile[] | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const [commentMenuOpenId, setCommentMenuOpenId] = useState<string | null>(null);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);
  const [commentDeleting, setCommentDeleting] = useState(false);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const isOwner = myUserId === post.user_id;

  const loadComments = useCallback(async () => {
    const { data } = await supabase
      .from('x_comments')
      .select('id, post_id, user_id, content, created_at, x_profiles ( username, display_name, avatar_url )')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    const mapped = ((data as any[]) ?? []).map((c) => ({ ...c, profiles: c.x_profiles }));
    setComments(mapped);
  }, [supabase, post.id]);

  useEffect(() => {
    if (defaultShowComments) loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    const { error } = await supabase.from('x_posts').delete().eq('id', post.id);
    setDeleting(false);

    if (!error) {
      setDeleted(true);
      setConfirmOpen(false);
      onChanged();
    }
  }

  if (deleted) return null;

  function goToPost() {
    router.push(`/post/${post.id}`);
  }

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

  async function toggleRepost() {
    if (repostBusy) return;
    setRepostMenuOpen(false);
    setRepostBusy(true);
    const nextReposted = !reposted;
    setReposted(nextReposted);
    setRepostCount((c) => c + (nextReposted ? 1 : -1));

    if (nextReposted) {
      await supabase.from('x_reposts').insert({ post_id: post.id, user_id: myUserId });
    } else {
      await supabase
        .from('x_reposts')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', myUserId);
    }
    setRepostBusy(false);
    onChanged();
  }

  async function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      await loadComments();
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

  async function handleDeleteComment(commentId: string) {
    if (commentDeleting) return;
    setCommentDeleting(true);
    const { error } = await supabase.from('x_comments').delete().eq('id', commentId);
    setCommentDeleting(false);

    if (!error) {
      setComments((prev) => prev?.filter((c) => c.id !== commentId) ?? null);
      setConfirmDeleteCommentId(null);
      onChanged();
    }
  }

  return (
    <article
      onClick={goToPost}
      className="border-b border-[#EFF3F4] px-4 py-3 cursor-pointer hover:bg-[#FAFAFA] transition-colors"
    >
      {repostedBy && (
        <div className="flex items-center gap-2 text-[13px] text-[#536471] font-bold mb-2 pl-7">
          <RepostIcon small />
          <Link href={`/profile/${repostedBy.username}`} onClick={stop} className="hover:underline">
            {repostedBy.display_name}
          </Link>
          <span>がリポスト</span>
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/profile/${post.profiles.username}`} onClick={stop}>
          <Avatar url={post.profiles.avatar_url} name={post.profiles.display_name} size={44} />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5 text-[15px] flex-wrap">
              <Link href={`/profile/${post.profiles.username}`} onClick={stop} className="font-bold hover:underline">
                {post.profiles.display_name}
              </Link>
              <span className="text-[#536471]">@{post.profiles.username}</span>
              <span className="text-[#536471]">·</span>
              <span className="text-[#536471]">{formatTime(post.created_at)}</span>
            </div>

            {isOwner && (
              <div className="relative shrink-0 -mt-1 -mr-2" onClick={stop}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#536471] hover:bg-[#4A5FE0]/10 hover:text-[#4A5FE0] transition-colors"
                  aria-label="投稿メニュー"
                >
                  <MoreIcon />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-9 z-30 w-44 bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.15)] border border-[#EFF3F4] overflow-hidden">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setConfirmOpen(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-bold text-[#F4212E] hover:bg-[#F4212E]/10 transition-colors"
                      >
                        <TrashIcon />
                        削除
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-[15px] whitespace-pre-wrap mt-0.5 break-words">{post.content}</p>

          {post.image_url && (
            <div
              className="mt-2 rounded-2xl overflow-hidden border border-[#EFF3F4] inline-block max-w-full"
              onClick={stop}
            >
              <img
                src={post.image_url}
                alt=""
                onClick={() => setLightboxUrl(post.image_url)}
                className="block max-h-[500px] max-w-full w-auto h-auto cursor-zoom-in"
              />
            </div>
          )}

          {/* 引用元投稿のプレビュー(タップでその投稿へ) */}
          {post.quoted_post && (
            <div
              onClick={(e) => {
                stop(e);
                router.push(`/post/${post.quoted_post!.id}`);
              }}
              className="mt-2 border border-[#EFF3F4] rounded-2xl p-3 hover:bg-[#F7F8F8] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-[13px] flex-wrap">
                <Avatar
                  url={post.quoted_post.profiles.avatar_url}
                  name={post.quoted_post.profiles.display_name}
                  size={20}
                />
                <span className="font-bold">{post.quoted_post.profiles.display_name}</span>
                <span className="text-[#536471]">@{post.quoted_post.profiles.username}</span>
              </div>
              <p className="text-[14px] whitespace-pre-wrap break-words mt-1">{post.quoted_post.content}</p>
              {post.quoted_post.image_url && (
                <div className="mt-2 rounded-xl overflow-hidden">
                  <img
                    src={post.quoted_post.image_url}
                    alt=""
                    className="block max-h-[240px] max-w-full w-auto h-auto"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-8 mt-3 text-[#536471]" onClick={stop}>
            <button
              onClick={toggleComments}
              className="flex items-center gap-1.5 hover:text-[#4A5FE0] transition-colors"
            >
              <CommentIcon />
              <span className="text-[13px]">{comments?.length ?? post.comments_count}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setRepostMenuOpen((v) => !v)}
                className={`flex items-center gap-1.5 transition-colors ${
                  reposted ? 'text-[#00BA7C]' : 'hover:text-[#00BA7C]'
                }`}
              >
                <RepostIcon filled={reposted} />
                <span className="text-[13px]">{repostCount}</span>
              </button>

              {repostMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setRepostMenuOpen(false)} />
                  <div className="absolute left-0 top-8 z-30 w-48 bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.15)] border border-[#EFF3F4] overflow-hidden">
                    <button
                      onClick={toggleRepost}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-bold hover:bg-[#F7F8F8] transition-colors"
                    >
                      <RepostIcon filled={reposted} />
                      {reposted ? 'リポストを取り消す' : 'リポスト'}
                    </button>
                    <button
                      onClick={() => {
                        setRepostMenuOpen(false);
                        setQuoteModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-bold hover:bg-[#F7F8F8] transition-colors border-t border-[#EFF3F4]"
                    >
                      <QuoteIcon />
                      引用
                    </button>
                  </div>
                </>
              )}
            </div>

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
            <div className="mt-3 pl-1 border-l-2 border-[#EFF3F4] pl-3 flex flex-col gap-3" onClick={stop}>
              {comments === null && <p className="text-[13px] text-[#536471]">読み込み中…</p>}
              {comments?.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar url={c.profiles.avatar_url} name={c.profiles.display_name} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 text-[13px] min-w-0">
                        <span className="font-bold">{c.profiles.display_name}</span>
                        <span className="text-[#536471]">@{c.profiles.username}</span>
                      </div>

                      {c.user_id === myUserId && (
                        <div className="relative shrink-0">
                          <button
                            onClick={() =>
                              setCommentMenuOpenId((v) => (v === c.id ? null : c.id))
                            }
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[#536471] hover:bg-[#4A5FE0]/10 hover:text-[#4A5FE0] transition-colors"
                            aria-label="返信メニュー"
                          >
                            <MoreIcon />
                          </button>

                          {commentMenuOpenId === c.id && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setCommentMenuOpenId(null)}
                              />
                              <div className="absolute right-0 top-7 z-30 w-40 bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.15)] border border-[#EFF3F4] overflow-hidden">
                                <button
                                  onClick={() => {
                                    setCommentMenuOpenId(null);
                                    setConfirmDeleteCommentId(c.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] font-bold text-[#F4212E] hover:bg-[#F4212E]/10 transition-colors"
                                >
                                  <TrashIcon />
                                  削除
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
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

      {confirmOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6"
          onClick={(e) => {
            stop(e);
            if (!deleting) setConfirmOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[340px] p-6 flex flex-col items-center text-center"
            onClick={stop}
          >
            <p className="text-[18px] font-bold mb-1">投稿を削除しますか?</p>
            <p className="text-[14px] text-[#536471] mb-5">
              この操作は取り消せません。
            </p>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full h-[44px] rounded-full bg-[#F4212E] text-white text-[15px] font-bold disabled:opacity-50 transition-opacity"
            >
              {deleting ? '削除中…' : '削除'}
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
              className="w-full h-[44px] rounded-full border border-[#CFD9DE] text-[15px] font-bold mt-2 disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {confirmDeleteCommentId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6"
          onClick={(e) => {
            stop(e);
            if (!commentDeleting) setConfirmDeleteCommentId(null);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[340px] p-6 flex flex-col items-center text-center"
            onClick={stop}
          >
            <p className="text-[18px] font-bold mb-1">返信を削除しますか?</p>
            <p className="text-[14px] text-[#536471] mb-5">この操作は取り消せません。</p>

            <button
              onClick={() => handleDeleteComment(confirmDeleteCommentId)}
              disabled={commentDeleting}
              className="w-full h-[44px] rounded-full bg-[#F4212E] text-white text-[15px] font-bold disabled:opacity-50 transition-opacity"
            >
              {commentDeleting ? '削除中…' : '削除'}
            </button>
            <button
              onClick={() => setConfirmDeleteCommentId(null)}
              disabled={commentDeleting}
              className="w-full h-[44px] rounded-full border border-[#CFD9DE] text-[15px] font-bold mt-2 disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {quoteModalOpen && me && (
        <div onClick={stop}>
          <QuoteModal
            me={me}
            targetPost={post}
            onClose={() => setQuoteModalOpen(false)}
            onPosted={onChanged}
          />
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] px-4"
          onClick={(e) => {
            stop(e);
            setLightboxUrl(null);
          }}
        >
          <button
            onClick={(e) => {
              stop(e);
              setLightboxUrl(null);
            }}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            aria-label="閉じる"
          >
            <CloseIcon />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            onClick={stop}
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
        </div>
      )}
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

function RepostIcon({ filled, small }: { filled?: boolean; small?: boolean }) {
  const size = small ? 15 : 19;
  const color = filled ? '#00BA7C' : 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 5h9a3 3 0 013 3v3M6 5L3 8M6 5l3 3"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 19H9a3 3 0 01-3-3v-3M18 19l3-3M18 19l-3 3"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 5h14a1 1 0 011 1v9a1 1 0 01-1 1H9l-4 4V6a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="19" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a2 2 0 002 2h6a2 2 0 002-2V7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
