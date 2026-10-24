import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Rect } from 'react-native-svg';
import { FONTS } from '../theme';
import { IslamicPattern } from './ui';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

// شاشة البداية: اسم «آخرتي» بخط الرقعة مع حركة ناعمة ثم تختفي
export default function Splash({ onDone }: { onDone: () => void }) {
  const logo = useRef(new Animated.Value(0)).current;
  const sub = useRef(new Animated.Value(0)).current;
  const verse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 30000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.sequence([
      Animated.timing(logo, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(sub, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(verse, { toValue: 1, duration: 900, delay: 250, useNativeDriver: true }),
      ]),
      Animated.delay(700),
      Animated.timing(out, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start(() => onDone());
  }, [logo, sub, verse, spin, out, onDone]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = logo.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });
  const rise = (v: Animated.Value) => v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, st.root, { opacity: out }]}>
      <IslamicPattern opacity={0.13} color="#C9A45C" size={52} />
      <View style={st.glow} />
      <Animated.View style={{ width: 290, height: 290, alignItems: 'center', justifyContent: 'center', opacity: logo, transform: [{ scale }] }}>
        <AnimatedSvg width={290} height={290} viewBox="0 0 300 300" style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
          <G fill="none" stroke="#C9A45C">
            <Rect x={62} y={62} width={176} height={176} strokeWidth={1.2} />
            <Rect x={62} y={62} width={176} height={176} strokeWidth={1.2} transform="rotate(45 150 150)" />
            <Circle cx={150} cy={150} r={138} strokeWidth={0.8} strokeDasharray="2 6" />
            <Circle cx={150} cy={150} r={128} strokeWidth={0.6} />
          </G>
        </AnimatedSvg>
        <View style={st.medal} />
        <Text style={st.word}>آخرتي</Text>
      </Animated.View>
      <Animated.View style={[st.subRow, { opacity: sub, transform: [{ translateY: rise(sub) }] }]}>
        <View style={st.line} />
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
  root: { backgroundColor: '#1E130C', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  glow: { position: 'absolute', width: 420, height: 420, borderRadius: 210, backgroundColor: '#145A45', opacity: 0.35 },
  medal: {
    position: 'absolute',
    width: 182,
    height: 182,
    borderRadius: 91,
    backgroundColor: '#0E3B2E',
    borderWidth: 1,
    borderColor: 'rgba(246,223,164,0.45)',
  },
  word: {
    fontFamily: FONTS.logo,
    fontSize: 72,
    lineHeight: 120,
    color: '#E8C878',
    textShadowColor: 'rgba(246,223,164,0.55)',
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
  },
  subRow: { marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { width: 40, height: 1, backgroundColor: '#C9A45C' },
  latin: { fontSize: 17, letterSpacing: 8, color: '#E3C47E', fontWeight: '600' },
  verseBox: { position: 'absolute', bottom: 70, alignItems: 'center', gap: 4 },
  verse: { fontFamily: FONTS.dhikr, fontSize: 22, lineHeight: 40, color: '#F2E6CC', textAlign: 'center' },
  ref: { fontSize: 13, color: '#B8A27A' },
});
