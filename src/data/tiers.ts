// The scale ladder. Sizes are typical/representative values in metres.
// Facts were checked against standard references (NASA, encyclopaedic sources, peer-reviewed estimates).

export interface TierInfo {
  tier: number;
  name: string;
  /** used in sentences: "a Mouse", "the Moon" */
  article: 'a' | 'an' | 'the' | '';
  /** emoji, or the key of a custom SVG icon in icons.ts */
  icon: string;
  /** emoji used in share text (custom-SVG tiers fall back to a close emoji) */
  emoji: string;
  meters: number;
  label: string;
  /** what "size" means for this object */
  measure: string;
  fact: string;
  colors: [string, string];
}

const AU = 1.495978707e11;
const LY = 9.4607304725808e15;

export const TIERS: TierInfo[] = [
  {
    tier: 1, name: 'Hydrogen Atom', article: 'a', icon: '⚛️', emoji: '⚛️',
    meters: 1e-10, label: '0.1 nm', measure: 'diameter',
    fact: 'Hydrogen is the most common element in the universe: roughly three quarters of all normal matter by mass.',
    colors: ['#5B8CFF', '#3A55D0'],
  },
  {
    tier: 2, name: 'Virus', article: 'a', icon: '🦠', emoji: '🦠',
    meters: 1e-7, label: '100 nm', measure: 'typical diameter',
    fact: 'Most viruses are too small for an ordinary light microscope. Scientists need electron microscopes to see them.',
    colors: ['#44A6FF', '#2569CF'],
  },
  {
    tier: 3, name: 'Red Blood Cell', article: 'a', icon: '🩸', emoji: '🩸',
    meters: 8e-6, label: '8 µm', measure: 'diameter',
    fact: 'Your body makes about 2 million new red blood cells every second.',
    colors: ['#2FC4EE', '#1883BF'],
  },
  {
    tier: 4, name: 'Grain of Sand', article: 'a', icon: 'sand', emoji: '🏖️',
    meters: 5e-4, label: '0.5 mm', measure: 'diameter',
    fact: 'Geologists call a grain "sand" only if it is between 0.0625 mm and 2 mm across. Smaller is silt.',
    colors: ['#2DD4BF', '#0E9488'],
  },
  {
    tier: 5, name: 'Ant', article: 'an', icon: '🐜', emoji: '🐜',
    meters: 5e-3, label: '5 mm', measure: 'body length',
    fact: 'Scientists estimate there are about 20 quadrillion ants on Earth, around 2.5 million for every person.',
    colors: ['#34D399', '#0F9A66'],
  },
  {
    tier: 6, name: 'Mouse', article: 'a', icon: '🐭', emoji: '🐭',
    meters: 0.08, label: '8 cm', measure: 'body length',
    fact: 'A house mouse can squeeze through a gap about 6 mm wide, roughly the width of a pencil.',
    colors: ['#5BD36A', '#2B9A40'],
  },
  {
    tier: 7, name: 'Cat', article: 'a', icon: '🐈', emoji: '🐈',
    meters: 0.46, label: '46 cm', measure: 'body length',
    fact: 'Cats sleep 12 to 16 hours a day, so a 9-year-old cat has slept for about 5 years.',
    colors: ['#9BD645', '#619C1C'],
  },
  {
    tier: 8, name: 'Human', article: 'a', icon: '🧍', emoji: '🧍',
    meters: 1.7, label: '1.7 m', measure: 'height',
    fact: 'You are about 1 cm taller in the morning. Your spinal discs compress a little during the day.',
    colors: ['#F2BC2E', '#D18F07'],
  },
  {
    tier: 9, name: 'Giraffe', article: 'a', icon: '🦒', emoji: '🦒',
    meters: 5.5, label: '5.5 m', measure: 'height',
    fact: 'A giraffe’s neck has just seven vertebrae, the same number as yours. Each one is up to 25 cm long.',
    colors: ['#FFA53A', '#EB7B12'],
  },
  {
    tier: 10, name: 'Blue Whale', article: 'a', icon: '🐋', emoji: '🐋',
    meters: 30, label: '30 m', measure: 'length',
    fact: 'The largest animal known to have ever lived. Its heart alone weighs around 180 kg.',
    colors: ['#FF8550', '#E2502A'],
  },
  {
    tier: 11, name: 'Eiffel Tower', article: 'the', icon: '🗼', emoji: '🗼',
    meters: 330, label: '330 m', measure: 'height',
    fact: 'Iron expands in summer heat, so the tower can grow by up to 15 cm on a hot day.',
    colors: ['#FF6B6B', '#D63A55'],
  },
  {
    tier: 12, name: 'Mount Everest', article: '', icon: '🏔️', emoji: '🏔️',
    meters: 8849, label: '8.85 km', measure: 'height above sea level',
    fact: 'The summit is made of marine limestone. It was once the floor of an ancient sea.',
    colors: ['#F35B8C', '#C42F6C'],
  },
  {
    tier: 13, name: 'Moon', article: 'the', icon: '🌕', emoji: '🌕',
    meters: 3.4748e6, label: '3,474 km', measure: 'diameter',
    fact: 'The Moon drifts about 3.8 cm farther from Earth every year.',
    colors: ['#DC6BD2', '#A23AAE'],
  },
  {
    tier: 14, name: 'Earth', article: '', icon: '🌍', emoji: '🌍',
    meters: 1.2742e7, label: '12,742 km', measure: 'diameter',
    fact: 'Earth is the densest planet in the Solar System, thanks to its big iron-nickel core.',
    colors: ['#B47CFF', '#7C4BE0'],
  },
  {
    tier: 15, name: 'Jupiter', article: '', icon: 'jupiter', emoji: '🪐',
    meters: 1.3982e8, label: '139,820 km', measure: 'diameter',
    fact: 'Its Great Red Spot is a storm wider than the whole Earth, and it has raged for centuries.',
    colors: ['#9266FF', '#5838D2'],
  },
  {
    tier: 16, name: 'Sun', article: 'the', icon: '☀️', emoji: '☀️',
    meters: 1.3927e9, label: '1.39M km', measure: 'diameter',
    fact: 'About 1.3 million Earths could fit inside the Sun.',
    colors: ['#7457F0', '#3D2AB0'],
  },
  {
    tier: 17, name: 'Solar System', article: 'the', icon: 'solar', emoji: '☄️',
    meters: 60 * AU, label: '60 AU', measure: 'diameter of Neptune’s orbit',
    fact: 'Sunlight takes about 4 hours to reach Neptune. It reaches Earth in just over 8 minutes.',
    colors: ['#4C3DCB', '#1F176A'],
  },
  {
    tier: 18, name: 'Milky Way', article: 'the', icon: '🌌', emoji: '🌌',
    meters: 1e5 * LY, label: '100,000 ly', measure: 'diameter of the stellar disc',
    fact: 'The Sun takes about 230 million years to orbit the galaxy once. The last time it was here, dinosaurs were just appearing.',
    colors: ['#33237F', '#110A38'],
  },
  {
    tier: 19, name: 'Observable Universe', article: 'the', icon: 'universe', emoji: '✨',
    meters: 9.3e10 * LY, label: '93B ly', measure: 'diameter',
    fact: 'It is 93 billion light-years across even though it is only 13.8 billion years old, because space itself has been expanding.',
    colors: ['#1C1048', '#05020F'],
  },
];

/** Compact names that fit on a tile */
const SHORT = ['Hydrogen', 'Virus', 'Blood Cell', 'Sand Grain', 'Ant', 'Mouse', 'Cat', 'Human', 'Giraffe', 'Blue Whale',
  'Eiffel Tower', 'Everest', 'Moon', 'Earth', 'Jupiter', 'Sun', 'Solar System', 'Milky Way', 'Universe'];
export const shortName = (tier: number): string => SHORT[tier - 1] ?? '';

export const tierInfo = (tier: number): TierInfo => TIERS[Math.max(1, Math.min(TIERS.length, tier)) - 1];

export const withArticle = (t: TierInfo): string => (t.article ? `${t.article} ${t.name}` : t.name);

// ---------- number formatting ----------

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

/** Human-friendly number: plain for everyday magnitudes, a × 10ⁿ otherwise. */
export function fmt(n: number): string {
  const a = Math.abs(n);
  if (a >= 0.001 && a < 1e7) return n.toLocaleString('en-US', { maximumSignificantDigits: 3 });
  const e = Math.floor(Math.log10(a));
  let m = n / 10 ** e;
  let exp = e;
  if (Math.round(m * 10) / 10 >= 10) { m /= 10; exp += 1; }
  const ms = (Math.round(m * 10) / 10).toString();
  const sup = String(exp).split('').map((ch) => SUP[ch]).join('');
  return `${ms} × 10${sup}`;
}

/** "5.8", "62", "1,000", "105 million" */
export function fmtRatio(r: number): string {
  const sig3 = (x: number) => x.toLocaleString('en-US', { maximumSignificantDigits: 3 });
  if (r >= 1e12) return `${sig3(r / 1e12)} trillion`;
  if (r >= 1e9) return `${sig3(r / 1e9)} billion`;
  if (r >= 1e6) return `${sig3(r / 1e6)} million`;
  if (r < 10) return (Math.round(r * 10) / 10).toString();
  return sig3(r);
}

export interface UnitRow { unit: string; value: string; fun?: boolean }

const UNITS: { unit: string; m: number; fun?: boolean }[] = [
  { unit: 'nanometres', m: 1e-9 },
  { unit: 'micrometres', m: 1e-6 },
  { unit: 'millimetres', m: 1e-3 },
  { unit: 'metres', m: 1 },
  { unit: 'kilometres', m: 1e3 },
  { unit: 'miles', m: 1609.344 },
  { unit: 'light-years', m: LY },
  { unit: 'bananas 🍌', m: 0.18, fun: true },
  { unit: 'football fields 🏈', m: 91.44, fun: true },
  { unit: 'Earths side by side 🌍', m: 1.2742e7, fun: true },
];

export const conversions = (t: TierInfo): UnitRow[] =>
  UNITS.map((u) => ({ unit: u.unit, value: fmt(t.meters / u.m), fun: u.fun }));

/** "5.8× bigger than a Mouse" */
export function jumpText(tier: number): string | null {
  if (tier <= 1) return null;
  const cur = tierInfo(tier);
  const prev = tierInfo(tier - 1);
  return `${fmtRatio(cur.meters / prev.meters)}× bigger than ${withArticle(prev)}`;
}

/** How many times bigger than the hydrogen atom */
export const timesAtom = (tier: number): string => fmtRatio(tierInfo(tier).meters / TIERS[0].meters);
