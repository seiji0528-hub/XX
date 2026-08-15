import type { PostWithMeta } from './types';

export const POST_SELECT = `
  id, user_id, content, image_url, created_at, quoted_post_id,
  x_profiles!x_posts_user_id_fkey ( username, display_name, avatar_url ),
  x_likes ( user_id ),
  x_comments ( id ),
  x_reposts ( user_id ),
  quoted_post:x_posts!x_posts_quoted_post_id_fkey (
    id, content, image_url, created_at,
    x_profiles!x_posts_user_id_fkey ( username, display_name, avatar_url )
  )
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
    quoted_post: p.quoted_post
      ? {
          id: p.quoted_post.id,
          content: p.quoted_post.content,
          image_url: p.quoted_post.image_url,
          created_at: p.quoted_post.created_at,
          profiles: p.quoted_post.x_profiles,
        }
      : null,
  };
}
