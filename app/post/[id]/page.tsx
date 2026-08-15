import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import PostCard from '@/components/PostCard';
import BackButton from '@/components/BackButton';
import { fetchPostById } from '@/lib/postQuery';

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: me } = await supabase.from('x_profiles').select('*').eq('id', user.id).single();
  if (!me) redirect('/login');

  const post = await fetchPostById(supabase, params.id, me.id);
  if (!post) notFound();

  return (
    <AppShell me={me}>
      <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-[#EFF3F4] px-4 py-3 flex items-center gap-6 z-10">
        <BackButton />
        <p className="text-[19px] font-bold">投稿</p>
      </div>
      <PostCard post={post} myUserId={me.id} me={me} onChanged={() => {}} defaultShowComments />
    </AppShell>
  );
}
