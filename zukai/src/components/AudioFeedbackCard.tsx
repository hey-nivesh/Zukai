import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput } from 'react-native';
import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react-native';
import { Text } from './Text';
import { GlassCard } from './GlassCard';
import { ShinyButton } from './ShinyButton';
import { Mascot } from './Mascot';
import { supabase } from '../lib/supabase';

const REASON_OPTIONS = [
  { id: 'too_fast', label: 'Too fast' },
  { id: 'too_slow', label: 'Too slow' },
  { id: 'too_complex', label: 'Too complex' },
  { id: 'too_simple', label: 'Too simple' },
  { id: 'missed_important_part', label: 'Missed key parts' },
  { id: 'wrong_information', label: 'Wrong info' },
  { id: 'voice_issue', label: 'Voice robotic' },
  { id: 'language_issue', label: 'Language issue' },
];

export interface AudioFeedbackCardProps {
  trackId: string;
  userId?: string;
  onSubmitted?: () => void;
}

export function AudioFeedbackCard({ trackId, userId, onSubmitted }: AudioFeedbackCardProps) {
  const [rating, setRating] = useState<boolean | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const toggleReason = (id: string) => {
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (rating === null || !userId) return;
    setIsSubmitting(true);
    try {
      await supabase.from('audio_feedback').upsert({
        track_id: trackId,
        user_id: userId,
        is_positive: rating,
        rating: rating ? 5 : 2,
        reasons: selectedReasons,
        comment: comment.slice(0, 500),
      });
      setIsDone(true);
      onSubmitted?.();
    } catch {
      // Graceful offline fallback
      setIsDone(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <GlassCard style={s.card}>
        <View style={s.doneRow}>
          <Mascot pose="success" size={48} />
          <Text variant="subhead" color="primary" style={{ fontWeight: '600' }}>
            Thanks for your feedback!
          </Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={s.card}>
      <Text variant="caption" color="secondary" style={s.title}>
        HOW WAS THIS EXPLANATION?
      </Text>

      <View style={s.thumbsRow}>
        <Pressable
          onPress={() => setRating(true)}
          style={[s.thumbBtn, rating === true && s.thumbBtnActivePositive]}
        >
          <ThumbsUp size={22} color={rating === true ? '#92F702' : '#B5C4CC'} />
          <Text variant="subhead" style={{ color: rating === true ? '#92F702' : '#B5C4CC' }}>
            Helpful
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setRating(false)}
          style={[s.thumbBtn, rating === false && s.thumbBtnActiveNegative]}
        >
          <ThumbsDown size={22} color={rating === false ? '#FF5252' : '#B5C4CC'} />
          <Text variant="subhead" style={{ color: rating === false ? '#FF5252' : '#B5C4CC' }}>
            Could be better
          </Text>
        </Pressable>
      </View>

      {rating === false && (
        <View style={s.negativeBlock}>
          <Text variant="caption" color="secondary">
            What could improve?
          </Text>
          <View style={s.chipsWrap}>
            {REASON_OPTIONS.map((opt) => {
              const active = selectedReasons.includes(opt.id);
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => toggleReason(opt.id)}
                  style={[s.chip, active && s.chipActive]}
                >
                  <Text variant="caption" style={{ color: active ? '#92F702' : '#8A9BA8' }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {rating !== null && (
        <ShinyButton
          label="Submit Feedback"
          size="sm"
          variant="primary"
          loading={isSubmitting}
          onPress={handleSubmit}
        />
      )}
    </GlassCard>
  );
}

const s = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  thumbBtnActivePositive: {
    borderColor: '#92F702',
    backgroundColor: 'rgba(146, 247, 2, 0.12)',
  },
  thumbBtnActiveNegative: {
    borderColor: '#FF5252',
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  negativeBlock: {
    gap: 8,
    marginTop: 4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipActive: {
    borderColor: '#92F702',
    backgroundColor: 'rgba(146, 247, 2, 0.15)',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
});

