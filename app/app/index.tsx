// ── Sound Knot V2 — Entry redirect
// Auth restoration runs in _layout.tsx before any child mounts.
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/login'} />;
}
