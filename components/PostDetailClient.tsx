'use client';

import { useRouter } from 'next/navigation';
import PostCard from './PostCard';
import type { PostWithMeta, Profile } from '@/lib/types';

export default function PostDetailClient({
  post,
  myUserId,
  me,
}: {
  post: PostWithMeta;
  myUserId: string;
  me: Profile;
}) {
  const router = useRouter();

  return (
    <PostCard
      post={post}
      myUserId={myUserId}
      me={me}
      onChanged={() => router.refresh()}
      defaultShowComments
    />
  );
}
