import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Render error caught by ErrorBoundary', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Coś poszło nie tak</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <Text style={styles.stack}>{this.state.error.stack}</Text>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#300', padding: 24, paddingTop: 64 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  message: { color: '#fff', fontSize: 15, marginBottom: 16 },
  stack: { color: '#faa', fontSize: 12 },
});
