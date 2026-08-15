import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfilePageClient from '@/components/ProfilePageClient';

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('x_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!me) redirect('/login');

  const { data: targetProfile } = await supabase
    .from('x_profiles')
    .select('*')
    .eq('username', params.username)
    .single();

  if (!targetProfile) notFound();

  return <ProfilePageClient me={me} initialProfile={targetProfile} />;
}
