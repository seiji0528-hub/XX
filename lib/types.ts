export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  created_at: string;
};

export type QuotedPostMeta = {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>;
} | null;

export type PostWithMeta = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>;
  likes_count: number;
  liked_by_me: boolean;
  comments_count: number;
  repost_count: number;
  reposted_by_me: boolean;
  quoted_post_id: string | null;
  quoted_post: QuotedPostMeta;
};

export type CommentWithProfile = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>;
};
