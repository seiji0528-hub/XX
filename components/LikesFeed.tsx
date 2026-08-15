'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PostWithMeta, Profile } from '@/lib/types';
import { POST_SELECT, mapPostRow } from '@/lib/postQuery';
import PostCard from './PostCard';

export default function LikesFeed({ myUserId, me }: { myUserId: string; me?: Profile }) {
  const supabase = createClient();
  const [posts, setPosts] = useState<PostWithMeta[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('x_likes')
      .select(`created_at, x_posts!inner ( ${POST_SELECT} )`)
      .eq('user_id', myUserId)
      .order('created_at', { ascending: false });

    const mapped: PostWithMeta[] = ((data as any[]) ?? [])
      .map((row) => row.x_posts)
      .filter(Boolean)
      .map((p: any) => mapPostRow(p, myUserId));

    setPosts(mapped);
  }, [supabase, myUserId]);

  useEffect(() => {
    load();
  }, [load]);

  if (posts === null) {
    return <p className="text-center text-[#536471] text-[14px] py-8">読み込み中…</p>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <p className="text-[17px] font-bold mb-1">まだいいねした投稿がありません</p>
        <p className="text-[14px] text-[#536471]">気に入った投稿にいいねすると、ここに表示されます</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} myUserId={myUserId} me={me} onChanged={load} />
      ))}
    </div>
  );
}
