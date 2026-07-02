import { Tabs } from 'expo-router';

export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="grades/index" options={{ title: 'Oceny' }} />
      <Tabs.Screen name="schedule/index" options={{ title: 'Plan lekcji' }} />
      <Tabs.Screen name="attendance/index" options={{ title: 'Frekwencja' }} />
      <Tabs.Screen name="messages/index" options={{ title: 'Wiadomości' }} />
      <Tabs.Screen name="announcements/index" options={{ title: 'Ogłoszenia' }} />
      <Tabs.Screen name="teachers/index" options={{ title: 'Nauczyciele' }} />
      <Tabs.Screen name="settings/index" options={{ title: 'Ustawienia' }} />
    </Tabs>
  );
}
