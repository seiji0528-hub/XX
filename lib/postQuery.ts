import type { PostWithMeta, QuotedPostMeta } from './types';

// 自己参照(投稿が投稿を引用する)の結合はSupabaseで不安定になりやすいため、
// ここでは quoted_post_id だけ取得しておき、attachQuotedPosts で別クエリとして後付けする
export const POST_SELECT = `
  id, user_id, content, image_url, created_at, quoted_post_id,
  x_profiles!x_posts_user_id_fkey ( username, display_name, avatar_url ),
  x_likes ( user_id ),
  x_comments ( id ),
  x_reposts ( user_id )
`;

export function mapPostRow(p: any, myUserId: string): PostWithMeta {
  return {
    id: p.id,
    user_id: p.user_id,
    content: p.content,
    image_url: p.image_url,
    created_at: p.created_at,
    profiles: p.x_profiles,
    likes_count: p.x_likes?.length ?? 0,
    liked_by_me: !!p.x_likes?.some((l: any) => l.user_id === myUserId),
    comments_count: p.x_comments?.length ?? 0,
    repost_count: p.x_reposts?.length ?? 0,
    reposted_by_me: !!p.x_reposts?.some((r: any) => r.user_id === myUserId),
    quoted_post_id: p.quoted_post_id ?? null,
    quoted_post: null,
  };
}

// posts配列の中から quoted_post_id を集めて、引用元投稿をまとめて1回のクエリで取得し、
// 各投稿の quoted_post に埋め込んで返す
export async function attachQuotedPosts(
  posts: PostWithMeta[],
  supabase: any
): Promise<PostWithMeta[]> {
  const ids = Array.from(
    new Set(posts.map((p) => p.quoted_post_id).filter((id): id is string => !!id))
  );

  if (ids.length === 0) return posts;

  const { data } = await supabase
    .from('x_posts')
    .select(
      'id, content, image_url, created_at, x_profiles!x_posts_user_id_fkey ( username, display_name, avatar_url )'
    )
    .in('id', ids);

  const quotedById = new Map<string, QuotedPostMeta>();
  ((data as any[]) ?? []).forEach((q) => {
    quotedById.set(q.id, {
      id: q.id,
      content: q.content,
      image_url: q.image_url,
      created_at: q.created_at,
      profiles: q.x_profiles,
    });
  });

  return posts.map((p) => ({
    ...p,
    quoted_post: p.quoted_post_id ? quotedById.get(p.quoted_post_id) ?? null : null,
  }));
}
