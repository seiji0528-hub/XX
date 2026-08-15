import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import LikesFeed from '@/components/LikesFeed';

export default async function LikesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('x_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  return (
    <AppShell me={profile}>
      <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-[#EFF3F4] px-4 py-3 hidden md:block">
        <p className="text-[19px] font-bold">履歴</p>
      </div>
      <LikesFeed myUserId={profile.id} me={profile} />
    </AppShell>
  );
}
