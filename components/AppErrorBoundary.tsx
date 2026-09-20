import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BrandColors, Radius, Spacing, Typography } from '../constants/theme';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Đã xảy ra lỗi</Text>
        <Text style={styles.message}>Ứng dụng không thể hiển thị nội dung này. Vui lòng thử lại.</Text>
        <TouchableOpacity style={styles.button} onPress={() => this.setState({ hasError: false })}>
          <Text style={styles.buttonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, backgroundColor: BrandColors.bgPrimary },
  title: { fontFamily: Typography.bold, fontSize: 22, color: BrandColors.textDark, marginBottom: Spacing.sm },
  message: { fontFamily: Typography.regular, fontSize: 15, lineHeight: 22, textAlign: 'center', color: BrandColors.textSecondary, marginBottom: Spacing.lg },
  button: { minHeight: 48, minWidth: 140, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, backgroundColor: BrandColors.accentPink, paddingHorizontal: Spacing.lg },
  buttonText: { fontFamily: Typography.bold, fontSize: 15, color: '#FFF' },
});
