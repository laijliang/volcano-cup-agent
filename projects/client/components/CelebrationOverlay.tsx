import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AchievementBrief {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CelebrationOverlayProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  achievements?: AchievementBrief[];
  onComplete?: () => void;
}

const SPARKLES = ['✨', '🎉', '⭐', '💫', '🌟', '🎊', '🏆', '💎'];

function SparkleParticle({ index, onEnd }: { index: number; onEnd: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dx = (Math.random() - 0.5) * SCREEN_WIDTH * 0.8;
    const dy = -Math.random() * 200 - 80;
    const duration = 800 + Math.random() * 600;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.2,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration * 0.15,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration * 0.85,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scale, {
        toValue: 1.8,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: dy,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: dx,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: Math.random() * 4 - 2,
        duration,
        useNativeDriver: true,
      }),
    ]).start(() => onEnd());
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.sparkle,
        {
          opacity,
          transform: [
            { scale },
            { translateY },
            { translateX },
            { rotate: spin },
          ],
        },
      ]}
    >
      {SPARKLES[index % SPARKLES.length]}
    </Animated.Text>
  );
}

export default function CelebrationOverlay({
  visible,
  title = '打卡成功！',
  subtitle = '',
  achievements,
  onComplete,
}: CelebrationOverlayProps) {
  const mainOpacity = useRef(new Animated.Value(0)).current;
  const mainScale = useRef(new Animated.Value(0.5)).current;
  const [showParticles, setShowParticles] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setShowParticles(true);

    Animated.parallel([
      Animated.spring(mainOpacity, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(mainScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      Animated.timing(mainOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setShowParticles(false);
        onComplete?.();
      });
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {showParticles && (
        <View style={styles.particlesLayer}>
          {Array.from({ length: 12 }).map((_, i) => (
            <SparkleParticle key={i} index={i} onEnd={() => {}} />
          ))}
        </View>
      )}
      <Animated.View
        style={[
          styles.card,
          {
            opacity: mainOpacity,
            transform: [{ scale: mainScale }],
          },
        ]}
      >
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {achievements && achievements.length > 0 && (
          <View style={styles.achContainer}>
            <Text style={styles.achLabel}>新成就解锁！</Text>
            <View style={styles.achList}>
              {achievements.map((ach) => (
                <View key={ach.id} style={[styles.achBadge, { backgroundColor: ach.color + '20', borderColor: ach.color }]}>
                  <Text style={styles.achIcon}>{ach.icon === 'star' ? '⭐' : ach.icon === 'map' ? '🗺️' : ach.icon === 'utensils' ? '🍴' : ach.icon === 'fire' ? '🔥' : ach.icon === 'walking' ? '🚶' : ach.icon === 'landmark' ? '🏛️' : ach.icon === 'moon' ? '🌙' : ach.icon === 'question' ? '❓' : ach.icon === 'book' ? '📚' : ach.icon === 'cloud-moon' ? '🌃' : ach.icon === 'heart' ? '❤️' : ach.icon === 'crown' ? '👑' : '⭐'}</Text>
                  <Text style={[styles.achName, { color: ach.color }]}>{ach.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  particlesLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  achContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  achLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4A574',
    marginBottom: 8,
  },
  achList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  achBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  achIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  achName: {
    fontSize: 12,
    fontWeight: '600',
  },
});
