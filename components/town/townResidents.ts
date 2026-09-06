import * as THREE from 'three';
import type { Character } from '../../types';

export type Sex = 'f' | 'm';
export type ResidentStyle = {
  sex: Sex;
  hair: 'short' | 'long' | 'tail';
  beard?: boolean;
  cap?: boolean;
  colors?: Partial<Record<'shirt' | 'skin' | 'trousers' | 'hair' | 'skirt' | 'cap', string>>;
};

// Story characters carry their presentation in the roster; emoji-only avatars fall back to
// the pictured figure, and anything else settles deterministically on the name.
const KNOWN_SEX: Record<string, Sex> = { alex: 'm', maria: 'f', james: 'm', sarah: 'f', devon: 'f', marcus: 'm', linda: 'f', tyler: 'm' };
export function characterSex(character?: Pick<Character, 'id' | 'name' | 'avatarEmoji'> | null): Sex {
  if (!character) return 'm';
  const known = KNOWN_SEX[character.id]; if (known) return known;
  const emoji = character.avatarEmoji ?? '';
  if (/👩|♀|👧|💃|👸/u.test(emoji)) return 'f';
  if (/👨|♂|👦|🕺|🤴/u.test(emoji)) return 'm';
  let hash = 0; for (const ch of character.name ?? '') hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 2 ? 'f' : 'm';
}

const PALETTE = {
  shirt: ['#779fab', '#aa716a', '#7d9873', '#c7b58c', '#967caf', '#d98c5f', '#5f7fa8', '#b8637a'],
  skin: ['#bb805b', '#f0cba5', '#865d44', '#d4a57d', '#e2b78c', '#6e4a33'],
  trousers: ['#354955', '#4a5465', '#596555', '#687684', '#414f67', '#7a6a58'],
  hair: ['#322d2b', '#71503a', '#252a2e', '#b48e61', '#44302b', '#8a7f78'],
  skirt: ['#8c5a7e', '#4f6f86', '#b2704f', '#5d7a55', '#7d5f9c'],
  cap: ['#2f4a6d', '#5a3f3a', '#3c5a48'],
};
// Alternating sexes with staggered hair, beards and caps so a street of twelve reads as
// twelve different neighbours rather than one clone in different shirts.
export function residentStyle(index: number): ResidentStyle {
  const sex: Sex = index % 2 ? 'f' : 'm';
  const pick = (list: string[], salt: number) => list[(index * 7 + salt) % list.length];
  return {
    sex,
    hair: sex === 'f' ? (index % 4 === 1 ? 'tail' : 'long') : 'short',
    beard: sex === 'm' && index % 4 === 2,
    cap: sex === 'm' && index % 6 === 4,
    colors: { shirt: pick(PALETTE.shirt, 0), skin: pick(PALETTE.skin, 2), trousers: pick(PALETTE.trousers, 1), hair: pick(PALETTE.hair, 3), skirt: pick(PALETTE.skirt, 5), cap: pick(PALETTE.cap, 1) },
  };
}

// Applies a style to one cloned character: shows the sex-specific parts exported by
// scripts/build-town-extras.py, broadens or narrows the jacket, and recolours by material name.
// Materials are cloned before recolouring so the source model and other residents stay intact.
export function styleCharacter(root: THREE.Object3D, style: ResidentStyle) {
  const female = style.sex === 'f';
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const name = object.name;
    if (name.startsWith('Fem_HairLong') || name.startsWith('Fem_HairSide')) object.visible = female && style.hair === 'long';
    else if (name.startsWith('Fem_Ponytail')) object.visible = female && style.hair === 'tail';
    else if (name.startsWith('Fem_')) object.visible = female;
    else if (name.startsWith('Masc_Beard')) object.visible = !female && !!style.beard;
    else if (name.startsWith('Masc_Cap')) object.visible = !female && !!style.cap;
    else if (name.startsWith('Smile')) object.visible = !female;
    if (name.startsWith('Jacket')) object.scale.set(female ? .90 : 1.07, 1, female ? .95 : 1.02);
    if (name.startsWith('Tailored trousers')) object.scale.set(female ? 1.08 : 1, 1, 1);
    if (name.startsWith('Face')) object.scale.set(female ? .94 : 1, 1, 1);
    if (Array.isArray(object.material)) return;
    const colour = style.colors?.[object.material.name as keyof NonNullable<ResidentStyle['colors']>];
    if (!colour) return;
    const material = (object.material as THREE.MeshStandardMaterial).clone(); material.color.set(colour); object.material = material;
  });
}

// Seated pose for benches and café chairs. Two-bone legs reach the floor from the seat
// height instead of folding under the seat, so feet rest on the pavement.
export function seatActor(root: THREE.Object3D, thigh = -1.05, knee = .35) {
  for (const side of ['-1', '1']) {
    const leg = root.getObjectByName('Thigh' + side), joint = root.getObjectByName('Knee' + side), ankle = root.getObjectByName('Ankle' + side);
    if (leg) leg.rotation.x = thigh; if (joint) joint.rotation.x = knee; if (ankle) ankle.rotation.x = -thigh - knee;
  }
}
