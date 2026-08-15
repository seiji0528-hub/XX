'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PostWithMeta } from '@/lib/types';
import PostCard from './PostCard';

export default function ProfileFeed({
  userId,
  myUserId,
}: {
  userId: string;
  myUserId: string;
}) {
  const supabase = createClient();
  const [posts, setPosts] = useState<PostWithMeta[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('x_posts')
      .select(
        `id, user_id, content, image_url, created_at,
         x_profiles!x_posts_user_id_fkey ( username, display_name, avatar_url ),
         x_likes ( user_id ),
         x_comments ( id )`
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const mapped: PostWithMeta[] = ((data as any[]) ?? []).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      content: p.content,
      image_url: p.image_url,
      created_at: p.created_at,
      profiles: p.x_profiles,
      likes_count: p.x_likes?.length ?? 0,
      liked_by_me: !!p.x_likes?.some((l: any) => l.user_id === myUserId),
      comments_count: p.x_comments?.length ?? 0,
    }));

    setPosts(mapped);
  }, [supabase, userId, myUserId]);

  useEffect(() => {
    load();
  }, [load]);

  if (posts === null) {
    return <p className="text-center text-[#536471] text-[14px] py-8">読み込み中…</p>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <p className="text-[17px] font-bold mb-1">まだ投稿がありません</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} myUserId={myUserId} onChanged={load} />
      ))}
    </div>
  );
}
