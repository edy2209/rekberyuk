import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const imageTranslate = useRef(new Animated.Value(60)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity3 = useRef(new Animated.Value(0.3)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo masuk
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Title masuk
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Subtitle masuk
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Image masuk
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(imageTranslate, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(imageOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Loading dots loop
    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity1, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dotOpacity1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dotOpacity2, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dotOpacity2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dotOpacity3, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dotOpacity3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    };
    setTimeout(animateDots, 800);

    // Shimmer effect on logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Decorative circles */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />
      <View style={styles.circleCenter} />

      {/* Top section - Branding */}
      <View style={styles.topSection}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoBox}>
            <Animated.View style={[styles.logoShimmer, { opacity: shimmerOpacity }]} />
            <Text style={styles.logoText}>R</Text>
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.brandName,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslate }],
            },
          ]}
        >
          RekberYuk
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: subtitleOpacity }]}>
          Transaksi Online Aman & Terpercaya
        </Animated.Text>

        {/* Loading dots */}
        <Animated.View style={[styles.loadingRow, { opacity: subtitleOpacity }]}>
          <Animated.View style={[styles.dot, { opacity: dotOpacity1 }]} />
          <Animated.View style={[styles.dot, { opacity: dotOpacity2 }]} />
          <Animated.View style={[styles.dot, { opacity: dotOpacity3 }]} />
        </Animated.View>
      </View>

      {/* Bottom section - Character image */}
      <Animated.View
        style={[
          styles.imageSection,
          {
            opacity: imageOpacity,
            transform: [{ translateY: imageTranslate }],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/splash-girl.png')}
          style={styles.characterImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: subtitleOpacity }]}>
        <Text style={styles.footerText}>Escrow Service Indonesia</Text>
        <Text style={styles.versionText}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },

  // Decorative circles
  circleTopRight: {
    position: 'absolute',
    top: -width * 0.3,
    right: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#2563EB',
    opacity: 0.3,
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -width * 0.15,
    left: -width * 0.25,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#3B82F6',
    opacity: 0.2,
  },
  circleCenter: {
    position: 'absolute',
    top: height * 0.35,
    left: width * 0.5 - width * 0.4,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#2563EB',
    opacity: 0.1,
  },

  // Top branding
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.08,
    zIndex: 2,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBox: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoShimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3B82F6',
    borderRadius: 28,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#1E3A8A',
    zIndex: 1,
  },
  brandName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Loading dots
  loadingRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  // Character image
  imageSection: {
    alignItems: 'center',
    paddingBottom: 0,
    zIndex: 2,
  },
  characterImage: {
    width: width * 0.7,
    height: height * 0.35,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    zIndex: 2,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  versionText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
    marginTop: 4,
  },
});
