import { Alert } from 'react-native';

const defaultHandler = global.ErrorUtils?.getGlobalHandler?.();
global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  Alert.alert(isFatal ? 'Fatal error' : 'Error', `${error?.name}: ${error?.message}\n\n${error?.stack ?? ''}`);
  defaultHandler?.(error, isFatal);
});

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('react-native-quick-crypto').install();
} catch (e) {
  console.error('react-native-quick-crypto install() failed', e);
  Alert.alert('Crypto init failed', String(e?.message ?? e));
}

import 'expo-router/entry';
