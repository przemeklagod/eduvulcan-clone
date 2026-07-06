import { Tabs } from 'expo-router';
import { ActiveChildBadge } from '@/src/ui/ActiveChildBadge';

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerRight: () => <ActiveChildBadge /> }}>
      <Tabs.Screen name="grades/index" options={{ title: 'Oceny' }} />
      <Tabs.Screen name="schedule/index" options={{ title: 'Plan lekcji' }} />
      <Tabs.Screen name="attendance/index" options={{ title: 'Frekwencja' }} />
      <Tabs.Screen name="messages/index" options={{ title: 'Wiadomości' }} />
      <Tabs.Screen name="more/index" options={{ title: 'Więcej' }} />

      {/* Reachable from the "Więcej" menu, not shown as their own tab. */}
      <Tabs.Screen name="announcements/index" options={{ href: null, title: 'Ogłoszenia', headerShown: true }} />
      <Tabs.Screen name="homework/index" options={{ href: null, title: 'Zadania domowe', headerShown: true }} />
      <Tabs.Screen name="exams/index" options={{ href: null, title: 'Sprawdziany', headerShown: true }} />
      <Tabs.Screen name="schedule-extra/index" options={{ href: null, title: 'Zajęcia dodatkowe', headerShown: true }} />
      <Tabs.Screen name="notes/index" options={{ href: null, title: 'Uwagi i pochwały', headerShown: true }} />
      <Tabs.Screen name="teachers/index" options={{ href: null, title: 'Nauczyciele', headerShown: true }} />
      <Tabs.Screen name="settings/index" options={{ href: null, title: 'Ustawienia', headerShown: true }} />
    </Tabs>
  );
}
