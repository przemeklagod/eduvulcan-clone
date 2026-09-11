import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from './theme';
import { formatWeekRangeLabel } from '../utils/dates';

const SWIPE_MOVE_THRESHOLD = 20;
const SWIPE_COMMIT_THRESHOLD = 50;

/** Shared week-at-a-time navigation (swipe left/right, prev/next arrows) for schedule-shaped screens. */
export function useWeekNavigation() {
  const [weekOffset, setWeekOffset] = useState(0);
  const referenceDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > SWIPE_MOVE_THRESHOLD && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx <= -SWIPE_COMMIT_THRESHOLD) setWeekOffset((w) => w + 1);
        else if (gesture.dx >= SWIPE_COMMIT_THRESHOLD) setWeekOffset((w) => w - 1);
      },
    })
  ).current;

  return { referenceDate, weekOffset, setWeekOffset, panHandlers: panResponder.panHandlers };
}

export function WeekHeader({
  referenceDate,
  weekOffset,
  setWeekOffset,
}: {
  referenceDate: Date;
  weekOffset: number;
  setWeekOffset: (updater: number | ((w: number) => number)) => void;
}) {
  const colors = useThemeColors();

  return (
    <View style={[styles.weekHeader, { borderBottomColor: colors.border }]}>
      <Pressable style={styles.weekArrow} onPress={() => setWeekOffset((w) => w - 1)} hitSlop={12}>
        <Text style={[styles.weekArrowLabel, { color: colors.accent }]}>‹</Text>
      </Pressable>
      <Pressable onPress={() => setWeekOffset(0)}>
        <Text style={[styles.weekLabel, { color: colors.text }]}>{formatWeekRangeLabel(referenceDate)}</Text>
        {weekOffset !== 0 && <Text style={[styles.todayLabel, { color: colors.accent }]}>wróć do dziś</Text>}
      </Pressable>
      <Pressable style={styles.weekArrow} onPress={() => setWeekOffset((w) => w + 1)} hitSlop={12}>
        <Text style={[styles.weekArrowLabel, { color: colors.accent }]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekArrow: { paddingHorizontal: 16, paddingVertical: 4 },
  weekArrowLabel: { fontSize: 24, fontWeight: '700' },
  weekLabel: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  todayLabel: { fontSize: 11, textAlign: 'center', marginTop: 2 },
});
