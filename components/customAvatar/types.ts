export type AvatarBuilderStep = 'capture' | 'select' | 'style' | 'final';

export type StyleCategory = 'shirt' | 'accessory' | 'hair';

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  category: StyleCategory;
}

export interface UserSelections {
  shirt?: StyleOption;
  accessory?: StyleOption;
  hair?: StyleOption;
}

export interface GeneratedCharacter {
  id: string;
  url: string;
  base64: string;
}

export const STYLE_OPTIONS: StyleOption[] = [
  { id: 'executive_blazer', name: 'Executive Blazer', description: 'Tailored dark blazer with crisp shirt.', category: 'shirt' },
  { id: 'streetwear_hoodie', name: 'Streetwear Hoodie', description: 'Premium hoodie with clean lines.', category: 'shirt' },
  { id: 'venture_vest', name: 'Venture Vest', description: 'Modern vest with a light shirt.', category: 'shirt' },
  { id: 'gold_watch', name: 'Gold Watch', description: 'Subtle gold watch on the wrist.', category: 'accessory' },
  { id: 'smart_glasses', name: 'Smart Glasses', description: 'Sleek smart glasses.', category: 'accessory' },
  { id: 'chain', name: 'Minimal Chain', description: 'Thin chain necklace.', category: 'accessory' },
  { id: 'clean_fade', name: 'Clean Fade', description: 'Sharp professional fade.', category: 'hair' },
  { id: 'long_wave', name: 'Long Wave', description: 'Soft, wavy hair.', category: 'hair' },
  { id: 'buzz', name: 'Buzz Cut', description: 'Short, clean buzz cut.', category: 'hair' }
];
