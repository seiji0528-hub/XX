'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PostWithMeta, Profile } from '@/lib/types';
import PostComposer from './PostComposer';
import PostCard from './PostCard';

export default function Timeline({ me }: { me: Profile }) {
  const supabase = createClient();
  const [posts, setPosts] = useState<PostWithMeta[] | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('x_posts')
      .select(
        `id, user_id, content, image_url, created_at,
         x_profiles!x_posts_user_id_fkey ( username, display_name, avatar_url ),
         x_likes ( user_id ),
         x_comments ( id )`
      )
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      setPosts([]);
      return;
    }

    const mapped: PostWithMeta[] = (data as any[]).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      content: p.content,
      image_url: p.image_url,
      created_at: p.created_at,
      profiles: p.x_profiles,
      likes_count: p.x_likes?.length ?? 0,
      liked_by_me: !!p.x_likes?.some((l: any) => l.user_id === me.id),
      comments_count: p.x_comments?.length ?? 0,
    }));

    setPosts(mapped);
  }, [supabase, me.id]);

  useEffect(() => {
    load();

    // 新規投稿・いいね・コメントが入ったらリアルタイムで再取得
    const channel = supabase
      .channel('timeline-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'x_posts' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'x_likes' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'x_comments' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  return (
    <div>
      <PostComposer me={me} onPosted={load} />

      {posts === null && (
        <p className="text-center text-[#536471] text-[14px] py-8">読み込み中…</p>
      )}

      {posts !== null && posts.length === 0 && (
        <div className="text-center py-16 px-6">
          <p className="text-[17px] font-bold mb-1">まだ投稿がありません</p>
          <p className="text-[14px] text-[#536471]">最初の投稿をしてみよう</p>
        </div>
      )}

      {posts?.map((post) => (
        <PostCard key={post.id} post={post} myUserId={me.id} onChanged={load} />
      ))}
    </div>
  );
}
