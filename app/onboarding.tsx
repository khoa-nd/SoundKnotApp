// ── Sound Knot V2 — Onboarding
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/constants/theme';
import { useUserStore } from '../src/stores/userStore';
import { Button } from '../src/components/ui/Button';
import { Typography } from '../src/constants/Typography';
import { Spacing, Radius } from '../src/constants/Spacing';

const TOPICS = [
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'philosophy', label: 'Philosophy', icon: '🤔' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'arts', label: 'Arts', icon: '🎨' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'psychology', label: 'Psychology', icon: '🧠' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'literature', label: 'Literature', icon: '📖' },
];

export default function OnboardingScreen() {
  const colors = useTheme();
  const [step, setStep] = useState<'welcome' | 'interests' | 'ready'>('welcome');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const updateInterests = useUserStore((s) => s.updateInterests);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  const toggleTopic = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    updateInterests(selectedInterests);
    completeOnboarding();
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top', 'bottom']}>
      {step === 'welcome' && (
        <View style={styles.stepContent}>
          <Text style={styles.logo}>🎧</Text>
          <Text style={[styles.appName, { color: colors.ink }]}>SoundKnot</Text>
          <Text style={[styles.tagline, { color: colors.accentInk, fontFamily: Typography.serifItalic.fontFamily, fontStyle: Typography.serifItalic.fontStyle }]}>
            Work hard now.{'\n'}Listen smart later.
          </Text>
          <Text style={[styles.description, { color: colors.ink3 }]}>
            Master English listening through hours of engagement with brilliant
            minds — not simplified textbook dialogues.
          </Text>
          <View style={styles.bullets}>
            {[
              'Track your listening hours, not lessons',
              'Learn from real experts and deep conversations',
              'AI companion answers your questions in real-time',
              'Hands-free mode for learning on the go',
            ].map((bullet, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: colors.accent }]}>▸</Text>
                <Text style={[styles.bulletText, { color: colors.ink2 }]}>{bullet}</Text>
              </View>
            ))}
          </View>
          <Button
            title="Get Started"
            size="lg"
            onPress={() => setStep('interests')}
          />
        </View>
      )}

      {step === 'interests' && (
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.ink }]}>What fascinates you?</Text>
          <Text style={[styles.stepDesc, { color: colors.ink3 }]}>
            Choose topics you're genuinely curious about. Your brain works harder
            to understand content that interests you — without feeling fatigued.
          </Text>

          <View style={styles.topicsGrid}>
            {TOPICS.map((topic) => {
              const selected = selectedInterests.includes(topic.id);
              return (
                <TouchableOpacity
                  key={topic.id}
                  onPress={() => toggleTopic(topic.id)}
                  style={[
                    styles.topicCard,
                    {
                      backgroundColor: colors.paper2,
                      borderColor: selected ? colors.ink : colors.hair,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.topicIcon}>{topic.icon}</Text>
                  <Text style={[styles.topicLabel, { color: selected ? colors.ink : colors.ink3 }]}>
                    {topic.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            title={`Continue with ${selectedInterests.length} topics`}
            size="lg"
            onPress={() => setStep('ready')}
            disabled={selectedInterests.length === 0}
          />
          <TouchableOpacity onPress={() => setStep('ready')}>
            <Text style={[styles.skipText, { color: colors.ink4 }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'ready' && (
        <View style={styles.stepContent}>
          <Text style={styles.readyIcon}>⚡</Text>
          <Text style={[styles.readyTitle, { color: colors.ink }]}>You're all set</Text>
          <Text style={[styles.readyDesc, { color: colors.ink3 }]}>
            SoundKnot will curate a library of deep conversations from brilliant
            minds, tailored to what drives your curiosity.
          </Text>
          <Text style={[styles.readyQuote, { color: colors.ink4, fontFamily: Typography.serifItalic.fontFamily, fontStyle: Typography.serifItalic.fontStyle }]}>
            "The only way to do great work is to love what you do."{'\n'}
            — Steve Jobs
          </Text>
          <Button
            title="Start Your Journey"
            size="lg"
            onPress={handleFinish}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logo: { fontSize: 56, textAlign: 'center', marginBottom: 12 },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  bullets: { marginBottom: 32, gap: 12 },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  bullet: { fontSize: 16, lineHeight: 22 },
  bulletText: { fontSize: 15, flex: 1, lineHeight: 22 },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  topicCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: Radius.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  topicIcon: { fontSize: 28, marginBottom: 6 },
  topicLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  skipText: { fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  readyIcon: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  readyTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  readyDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  readyQuote: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
});
