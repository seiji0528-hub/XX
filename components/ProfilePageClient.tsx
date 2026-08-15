'use client';

import { useState } from 'react';
import type { Profile } from '@/lib/types';
import AppShell from './AppShell';
import ProfileHeader from './ProfileHeader';
import ProfileFeed from './ProfileFeed';

export default function ProfilePageClient({
  me,
  initialProfile,
}: {
  me: Profile;
  initialProfile: Profile;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const isMe = me.id === profile.id;

  return (
    <AppShell me={me}>
      <ProfileHeader profile={profile} isMe={isMe} onUpdated={setProfile} />
      <ProfileFeed userId={profile.id} myUserId={me.id} me={me} />
    </AppShell>
  );
}
