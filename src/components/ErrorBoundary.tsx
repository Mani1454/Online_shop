import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { crashlyticsService } from '../services/CrashlyticsService';
import { Colors, Typography, Spacing, Shadows, TouchTargets } from '../theme/colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Record fatal unhandled exception to Crashlytics / Sentry telemetry
    crashlyticsService.recordError(error, true, {
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content} centerContent>
            {/* Friendly Safety Shield & Cart Icon */}
            <View style={styles.iconCircle}>
              <Text style={styles.emoji}>🛡️</Text>
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <View style={styles.safetyPill}>
              <Text style={styles.safetyPillText}>✓ Your Cart & Items are 100% Safe</Text>
            </View>

            <Text style={styles.message}>
              We ran into a temporary technical issue. Don't worry, your items and delivery address have been preserved safely in local storage.
            </Text>

            {/* Action CTAs (≥48dp touch targets) */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={this.handleReset}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>🔄 Reload & Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                if (typeof window !== 'undefined' && window.location) {
                  window.location.reload();
                } else {
                  this.handleReset();
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>🏠 Refresh Full Application</Text>
            </TouchableOpacity>

            {/* Debug details toggle */}
            <TouchableOpacity
              onPress={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              style={styles.detailsToggle}
            >
              <Text style={styles.detailsToggleText}>
                {this.state.showDetails ? 'Hide Technical Details ▲' : 'Show Technical Details ▼'}
              </Text>
            </TouchableOpacity>

            {this.state.showDetails && (
              <View style={styles.detailsBox}>
                <Text style={styles.detailsText}>
                  {this.state.error?.name}: {this.state.error?.message}
                </Text>
                <Text style={styles.stackText}>
                  {this.state.error?.stack?.slice(0, 400)}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    ...Typography.titleLarge,
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  safetyPill: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: Spacing.md,
  },
  safetyPillText: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '800',
  },
  message: {
    ...Typography.bodyMedium,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    width: '100%',
    height: TouchTargets.minHeight, // ≥48dp
    backgroundColor: Colors.brandPrimary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  primaryButtonText: {
    ...Typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    height: TouchTargets.minHeight, // ≥48dp
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  secondaryButtonText: {
    ...Typography.bodyLarge,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  detailsToggle: {
    padding: Spacing.sm,
  },
  detailsToggleText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#090D16',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: Spacing.sm,
  },
  detailsText: {
    color: '#EF4444',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    marginBottom: 4,
  },
  stackText: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
});

export default ErrorBoundary;
