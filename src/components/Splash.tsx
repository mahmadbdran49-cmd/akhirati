import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { FONTS } from '../theme';
import { IslamicPattern } from './ui';

// شاشة البداية: الشعار المعتمد مدموج مع خلفية دافئة تغمق تدريجياً
export default function Splash({ onDone }: { onDone: () => void }) {
  const logo = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;
  const sub = useRef(new Animated.Value(0)).current;
  const verse = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logo, { toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(shine, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sub, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(verse, { toValue: 1, duration: 900, delay: 250, useNativeDriver: true }),
      ]),
      Animated.delay(600),
      Animated.timing(out, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start(() => onDone());
  }, [logo, shine, sub, verse, out, onDone]);

  const scale = logo.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
  const rise = (v: Animated.Value) => v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const shineX = shine.interpolate({ inputRange: [0, 1], outputRange: [-160, 260] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, st.root, { opacity: out }]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="sg" cx="50%" cy="42%" r="70%">
            <Stop offset="0" stopColor="#8A4A26" />
            <Stop offset="0.45" stopColor="#4A2614" />
            <Stop offset="1" stopColor="#0E0A07" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#sg)" />
      </Svg>
      <IslamicPattern opacity={0.08} color="#E2BF7A" size={50} force />
      <Animated.View style={[st.logoWrap, { opacity: logo, transform: [{ scale }] }]}>
        <Image source={require('../../assets/logo-mark.png')} style={st.logo} />
        <Animated.View pointerEvents="none" style={[st.shine, { transform: [{ translateX: shineX }, { rotate: '20deg' }] }]} />
      </Animated.View>
      <Animated.View style={[st.subRow, { opacity: sub, transform: [{ translateY: rise(sub) }] }]}>
        <View style={[st.line]} />
        <Text style={st.latin}>AKHIRAH</Text>
        <View style={st.line} />
      </Animated.View>
      <Animated.View style={[st.verseBox, { opacity: verse, transform: [{ translateY: rise(verse) }] }]}>
        <Text style={st.verse}>وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ</Text>
        <Text style={st.ref}>سورة الضحى · ٤</Text>
      </Animated.View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', zIndex: 100, backgroundColor: '#0E0A07' },
  logoWrap: {
    width: 230,
    height: 230,
    borderRadius: 52,
    overflow: 'hidden',
    elevation: 14,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  logo: { width: 230, height: 230 },
  shine: { position: 'absolute', top: -40, bottom: -40, width: 46, backgroundColor: 'rgba(255,240,205,0.22)' },
  subRow: { marginTop: 26, flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { width: 42, height: 1, backgroundColor: '#E2BF7A' },
  latin: { fontSize: 17, letterSpacing: 8, color: '#E9CF92', fontWeight: '600' },
  verseBox: { position: 'absolute', bottom: 70, alignItems: 'center', gap: 4 },
  verse: { fontFamily: FONTS.dhikr, fontSize: 22, lineHeight: 40, color: '#F4E9D2', textAlign: 'center' },
  ref: { fontSize: 13, color: '#BCA684' },
});
