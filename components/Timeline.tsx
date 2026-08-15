'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PostWithMeta, Profile } from '@/lib/types';
import { POST_SELECT, mapPostRow } from '@/lib/postQuery';
import PostComposer from './PostComposer';
import PostCard from './PostCard';

type FeedItem = {
  key: string;
  post: PostWithMeta;
  sortTime: string;
  repostedBy?: { display_name: string; username: string } | null;
};

export default function Timeline({ me }: { me: Profile }) {
  const supabase = createClient();
  const [items, setItems] = useState<FeedItem[] | null>(null);

  const load = useCallback(async () => {
    const [{ data: postRows }, { data: repostRows }] = await Promise.all([
      supabase.from('x_posts').select(POST_SELECT).order('created_at', { ascending: false }).limit(80),
      supabase
        .from('x_reposts')
        .select('post_id, created_at, x_profiles ( username, display_name, avatar_url )')
        .order('created_at', { ascending: false })
        .limit(80),
    ]);

    const postsById = new Map<string, PostWithMeta>();
    (postRows as any[] ?? []).forEach((row) => {
      postsById.set(row.id, mapPostRow(row, me.id));
    });

    const feed: FeedItem[] = [];

    postsById.forEach((post) => {
      feed.push({ key: `post-${post.id}`, post, sortTime: post.created_at });
    });

    (repostRows as any[] ?? []).forEach((row) => {
      const post = postsById.get(row.post_id);
      if (!post) return;
      feed.push({
        key: `repost-${row.post_id}-${row.created_at}`,
        post,
        sortTime: row.created_at,
        repostedBy: row.x_profiles,
      });
    });

    feed.sort((a, b) => new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime());
    setItems(feed.slice(0, 60));
  }, [supabase, me.id]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('timeline-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'x_posts' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'x_likes' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'x_comments' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'x_reposts' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  return (
    <div>
      <PostComposer me={me} onPosted={load} />

      {items === null && (
        <p className="text-center text-[#536471] text-[14px] py-8">読み込み中…</p>
      )}

      {items !== null && items.length === 0 && (
        <div className="text-center py-16 px-6">
          <p className="text-[17px] font-bold mb-1">まだ投稿がありません</p>
          <p className="text-[14px] text-[#536471]">最初の投稿をしてみよう</p>
        </div>
      )}

      {items?.map((item) => (
        <PostCard
          key={item.key}
          post={item.post}
          myUserId={me.id}
          me={me}
          repostedBy={item.repostedBy}
          onChanged={load}
        />
      ))}
    </div>
  );
}
