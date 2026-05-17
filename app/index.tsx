// ── Sound Knot V2 — Entry redirect
import { Redirect } from 'expo-router';
import { useUserStore } from '../src/stores/userStore';

export default function Index() {
  const user = useUserStore((s) => s.user);

  if (user && !user.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
