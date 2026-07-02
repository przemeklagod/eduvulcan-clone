import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAccounts } from '@/src/auth/accountsContext';

export default function Index() {
  const { loading, tenants } = useAccounts();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={tenants.length > 0 ? '/(app)/grades' : '/(auth)/login'} />;
}
