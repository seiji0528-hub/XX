'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PostWithMeta, Profile } from '@/lib/types';
import { POST_SELECT, mapPostRow, attachQuotedPosts } from '@/lib/postQuery';
import PostCard from './PostCard';

export default function ProfileFeed({
  userId,
  myUserId,
  me,
}: {
  userId: string;
  myUserId: string;
  me?: Profile;
}) {
  const supabase = createClient();
  const [posts, setPosts] = useState<PostWithMeta[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('x_posts')
      .select(POST_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const mapped = ((data as any[]) ?? []).map((row) => mapPostRow(row, myUserId));
    const withQuotes = await attachQuotedPosts(mapped, supabase);
    setPosts(withQuotes);
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
        <PostCard key={post.id} post={post} myUserId={myUserId} me={me} onChanged={load} />
      ))}
    </div>
  );
}
