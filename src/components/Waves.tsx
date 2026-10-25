import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStore } from '../store';

const W = 780; // ضعف عرض الشاشة تقريباً حتى تتكرر الموجة بسلاسة
const H = 60;

function wave(y: number, a: number) {
  return `M0 ${y} C65 ${y - a} 130 ${y + a} 195 ${y} S325 ${y - a} 390 ${y} S520 ${y + a} 585 ${y} S715 ${y - a} 780 ${y}`;
}

function Layer({ duration, reverse, fill, stroke, y, a, bottom, opacity }: { duration: number; reverse?: boolean; fill: string; stroke?: string; y: number; a: number; bottom: number; opacity: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  const tx = v.interpolate({ inputRange: [0, 1], outputRange: reverse ? [-390, 0] : [0, -390] });
  return (
    <Animated.View style={{ position: 'absolute', left: 0, bottom, width: W, height: H, opacity, transform: [{ translateX: tx }] }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Path d={`${wave(y, a)} V${H} H0 Z`} fill={fill} />
        {stroke ? <Path d={wave(y, a)} fill="none" stroke={stroke} strokeWidth={1.2} /> : null}
      </Svg>
    </Animated.View>
  );
}

// موج خفيف يتحرك ببطء أسفل الجزء العلوي من الرئيسية
export default function Waves() {
  const { colors, state } = useStore();
  if (state.minimal) return null;
  const [c1, c2, c3] = colors.waves;
  return (
    <View pointerEvents="none" style={st.wrap}>
      <Layer duration={26000} fill={c1} y={30} a={12} bottom={14} opacity={0.4} />
      <Layer duration={19000} reverse fill={c2} stroke={colors.gold} y={32} a={10} bottom={6} opacity={0.7} />
      <Layer duration={13000} fill={c3} stroke={colors.goldText} y={38} a={8} bottom={0} opacity={1} />
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: -1, height: H + 14, overflow: 'hidden' },
});
