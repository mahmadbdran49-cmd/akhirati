import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { treeDaysAway, useStore } from '../store';

const AnimatedG = Animated.createAnimatedComponent(G);

export type TreeState = { health: number; fallen: boolean; days: number; stage: 'bloom' | 'wilting' | 'thirsty' | 'fallen' };

// يوم واحد بلا فتح لا يؤثر · ٢–٣ أيام تبدأ بالذبول · أسبوع ذابلة جداً · أسبوعان تسقط
export function treeState(lastCare: string): TreeState {
  const d = treeDaysAway(lastCare);
  if (d <= 1) return { health: 1, fallen: false, days: d, stage: 'bloom' };
  if (d <= 3) return { health: 0.6, fallen: false, days: d, stage: 'wilting' };
  if (d < 14) return { health: 0.25, fallen: false, days: d, stage: 'thirsty' };
  return { health: 0, fallen: true, days: d, stage: 'fallen' };
}

export const TREE_MESSAGES: Record<TreeState['stage'], string> = {
  bloom: 'ما شاء الله، شجرتك مزهرة',
  wilting: 'حافظ على شجرتك، لا تجعلها تذبل',
  thirsty: 'شجرتك عطشى… اسقِها بذكر الله',
  fallen: 'سقطت شجرتك… ابدأ من جديد، فالله يحب التوابين',
};

const SPOTS: [number, number][] = [
  [196, 205], [160, 232], [232, 228], [120, 290], [270, 280], [150, 300], [220, 300], [196, 270], [92, 360], [300, 372],
  [126, 380], [262, 386], [196, 330], [170, 350], [226, 352], [80, 410], [310, 430], [140, 420], [250, 425], [196, 390],
  [176, 210], [214, 250], [108, 330], [284, 330], [200, 230], [150, 262], [240, 262], [100, 400], [290, 400], [196, 300],
];
const STARS: [number, number, number][] = Array.from({ length: 22 }, (_, i) => [(i * 71) % 380 + 6, 20 + ((i * 53) % 150), i % 4 === 0 ? 1.7 : 1]);

export type TreeHandle = { sway: () => void; rain: () => void };

// رسم الشجرة الكامل: نجوم، عصافير، ورود تتوهّج، ومطر عند السقاية
export const TreeArt = forwardRef<TreeHandle, { state: TreeState; width: number; night?: boolean }>(function TreeArt({ state, width, night = true }, ref) {
  const { colors, state: app } = useStore();
  const scale = width / 390;
  const height = 560 * scale;
  const sway = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const rainV = useRef(new Animated.Value(0)).current;
  const rainOpacity = useRef(new Animated.Value(0)).current;
  const calm = app.minimal;

  useEffect(() => {
    if (calm) return;
    const loops = [
      Animated.loop(Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.delay(2600),
        Animated.timing(hop, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(hop, { toValue: 0, duration: 220, useNativeDriver: true }),
      ])),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [breathe, twinkle, hop, calm]);

  useImperativeHandle(ref, () => ({
    sway: () => {
      if (state.fallen) return;
      sway.setValue(0);
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(sway, { toValue: -0.8, duration: 380, useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0.4, duration: 320, useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    },
    rain: () => {
      rainV.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(rainOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.delay(2200),
          Animated.timing(rainOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        Animated.loop(Animated.timing(rainV, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }), { iterations: 4 }),
      ]).start();
    },
  }));

  const h = state.health;
  const n = state.fallen ? 0 : Math.round(SPOTS.length * (h === 1 ? 1 : h >= 0.6 ? 0.45 : 0.1));
  const leafA = h === 1 ? '#2F8A63' : h >= 0.6 ? '#6F8A3A' : '#8A6A3A';
  const leafB = h === 1 ? '#0E3B2E' : h >= 0.6 ? '#3A4A1E' : '#4A3418';
  const ls = state.fallen ? 0.55 : 0.55 + h * 0.45;
  const tilt = state.fallen ? -78 : state.days >= 7 ? -7 : state.days >= 2 ? -3 : 0;
  const rot = Animated.add(
    sway.interpolate({ inputRange: [-1, 1], outputRange: [-3, 3] }),
    breathe.interpolate({ inputRange: [0, 1], outputRange: [-0.6, 0.6] })
  ).interpolate({ inputRange: [-10, 10], outputRange: [`${tilt - 10}deg`, `${tilt + 10}deg`] });
  const showBirds = !state.fallen && h >= 0.6 && !calm;
  const hopY = hop.interpolate({ inputRange: [0, 1], outputRange: [0, -5 * scale] });
  const dropY = rainV.interpolate({ inputRange: [0, 1], outputRange: [-40 * scale, 420 * scale] });

  return (
    <View style={{ width, height }}>
      {night && !calm ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }]}>
          <Svg width={width} height={height} viewBox="0 0 390 560">
            {STARS.filter((_, i) => i % 2 === 0).map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#FFF6DA" />)}
          </Svg>
        </Animated.View>
      ) : null}
      {night && !calm ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) }]}>
          <Svg width={width} height={height} viewBox="0 0 390 560">
            {STARS.filter((_, i) => i % 2 === 1).map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#FFF6DA" />)}
            <Path d="M300 50 a18 18 0 1 0 14 30 a14 14 0 1 1 -14 -30z" fill="#F6E7B8" opacity={0.85} />
          </Svg>
        </Animated.View>
      ) : null}

      <Svg width={width} height={height} viewBox="0 0 390 560" style={StyleSheet.absoluteFill}>
        <Ellipse cx={195} cy={546} rx={140} ry={16} fill={colors.emeraldDeep} opacity={0.8} />
        <Ellipse cx={195} cy={542} rx={100} ry={9} fill={colors.gold} opacity={0.22} />
        {state.days >= 4
          ? Array.from({ length: state.fallen ? 18 : 9 }, (_, i) => (
              <Ellipse key={i} cx={80 + ((i * 47) % 230)} cy={536 + (i % 3) * 5} rx={7} ry={3.5} fill={i % 2 ? '#8A6A3A' : '#6F5530'} transform={`rotate(${(i * 37) % 180} ${80 + ((i * 47) % 230)} ${536 + (i % 3) * 5})`} />
            ))
          : null}
      </Svg>

      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: 0 }, { translateY: 270 * scale }, { rotate: rot }, { translateY: -270 * scale }] }]}>
        <Svg width={width} height={height} viewBox="0 0 390 560">
          <Defs>
            <RadialGradient id="tl" cx="50%" cy="40%" r="60%">
              <Stop offset="0" stopColor={leafA} />
              <Stop offset="1" stopColor={leafB} />
            </RadialGradient>
            <RadialGradient id="bw" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="0.55" stopColor="#FFE3EE" />
              <Stop offset="1" stopColor="#F7A8C6" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="bp" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFF4F8" />
              <Stop offset="0.5" stopColor="#F59BBE" />
              <Stop offset="1" stopColor="#E86B9C" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Path
            d="M182 542 C186 480 176 440 168 400 C160 370 150 350 136 330 M194 542 C196 460 200 410 206 370 C210 340 222 310 240 290 M190 450 C214 430 238 420 262 400 M184 420 C160 400 140 392 116 376 M200 380 C196 340 192 310 196 270"
            fill="none"
            stroke="#6B4428"
            strokeWidth={12}
            strokeLinecap="round"
          />
          <Path d="M176 542 C182 500 184 470 182 440 L206 440 C204 480 206 510 214 542 Z" fill="#5A3820" />
          <G opacity={state.fallen ? 0.55 : 0.4 + h * 0.6}>
            <Circle cx={196} cy={230} r={70 * ls} fill="url(#tl)" />
            <Circle cx={130} cy={300} r={54 * ls} fill="url(#tl)" />
            <Circle cx={262} cy={290} r={54 * ls} fill="url(#tl)" />
            <Circle cx={100} cy={372} r={44 * ls} fill="url(#tl)" />
            <Circle cx={288} cy={388} r={44 * ls} fill="url(#tl)" />
            <Circle cx={196} cy={330} r={54 * ls} fill="url(#tl)" />
          </G>
          {SPOTS.slice(0, n).map(([x, y], i) => (
            <G key={i}>
              <Circle cx={x} cy={y - 20} r={h === 1 ? 12 + (i % 3) * 2 : 8} fill={i % 2 ? 'url(#bp)' : 'url(#bw)'} />
              <Circle cx={x} cy={y - 20} r={h === 1 ? 2.6 : 1.8} fill="#FFFFFF" />
            </G>
          ))}
        </Svg>
        {showBirds ? (
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: hopY }] }]}>
            <Svg width={width} height={height} viewBox="0 0 390 560">
              {([[150, 280, '#D9C3A0'], [248, 272, '#C9A0A8'], [112, 362, '#E8DCC6']] as [number, number, string][]).map(([x, y, c], i) => (
                <G key={i}>
                  <Ellipse cx={x} cy={y} rx={9} ry={6.5} fill={c} />
                  <Circle cx={x - 8} cy={y - 5} r={4.6} fill={c} />
                  <Circle cx={x - 10} cy={y - 5} r={1} fill="#1E130C" />
                  <Path d={`M${x - 12.5} ${y - 5} l-4 1.2 l4 1.2z`} fill="#E3A93C" />
                  <Path d={`M${x + 8} ${y} l7 -3 l-1 5z`} fill={c} />
                </G>
              ))}
            </Svg>
          </Animated.View>
        ) : null}
      </Animated.View>

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: rainOpacity }]}>
        <Svg width={width} height={110 * scale} viewBox="0 0 390 110">
          <Ellipse cx={160} cy={62} rx={70} ry={26} fill="#3E4A52" />
          <Ellipse cx={225} cy={56} rx={62} ry={30} fill="#4C5961" />
          <Ellipse cx={195} cy={74} rx={90} ry={22} fill="#56636B" />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: dropY }] }]}>
          <Svg width={width} height={height} viewBox="0 0 390 560">
            {Array.from({ length: 28 }, (_, i) => {
              const x = 105 + ((i * 29) % 180);
              const y = 90 + ((i * 37) % 120);
              return <Path key={i} d={`M${x} ${y} q-3 8 0 12 q3 -4 0 -12z`} fill="#A9D8F0" />;
            })}
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
});

// الشعار الدائري الصغير للشجرة في الرئيسية
export function TreeBadge({ state, size = 64 }: { state: TreeState; size?: number }) {
  const { colors } = useStore();
  const h = state.health;
  const leaf = h === 1 ? '#2F8A63' : h >= 0.6 ? '#6F8A3A' : '#8A6A3A';
  const blooms: [number, number][] = h === 1 ? [[36, 20], [28, 27], [44, 26], [22, 35], [50, 34], [36, 33], [30, 40], [42, 39]] : h >= 0.6 ? [[36, 22], [26, 34], [46, 32]] : [];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.gold, backgroundColor: '#0B2E24', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 72 72">
        <Defs>
          <RadialGradient id="tb" cx="50%" cy="45%" r="60%">
            <Stop offset="0" stopColor="#145A45" />
            <Stop offset="1" stopColor="#0B2E24" />
          </RadialGradient>
        </Defs>
        <Circle cx={36} cy={36} r={36} fill="url(#tb)" />
        {[[10, 14], [60, 12], [8, 40], [64, 44], [54, 22]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={0.9} fill="#FFF6DA" opacity={0.8} />)}
        <Ellipse cx={36} cy={64} rx={18} ry={3} fill={colors.gold} opacity={0.35} />
        <G transform={state.fallen ? 'rotate(-70 36 64)' : undefined}>
          <Path d="M34 64 C35 54 34 48 32 42 M36 64 C37 52 39 46 42 40 M35 52 C30 48 26 46 22 44 M36 50 C41 47 45 45 50 43" stroke="#6B4428" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Circle cx={36} cy={28} r={15 * (0.6 + h * 0.4)} fill={leaf} />
          <Circle cx={24} cy={36} r={11 * (0.6 + h * 0.4)} fill={leaf} />
          <Circle cx={48} cy={35} r={11 * (0.6 + h * 0.4)} fill={leaf} />
          {blooms.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={2.8} fill={i % 2 ? '#F7B8D0' : '#FFFFFF'} />)}
        </G>
      </Svg>
    </View>
  );
}
