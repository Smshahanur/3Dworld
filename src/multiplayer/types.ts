/**
 * 3DWorld Multiplayer Data Model & State Types
 */

export type AvatarColor =
  | 'cyan'
  | 'emerald'
  | 'purple'
  | 'orange'
  | 'rose'
  | 'gold'
  | 'blue'
  | 'amber';

export type AvatarType = 'casual' | 'explorer' | 'builder' | 'cyber' | 'formal' | 'traditional';

export type GenderType = 'male' | 'female';

export interface AvatarStyleConfig {
  id: AvatarType;
  label: string;
  description: string;
  iconName: string;
}

export const AVATAR_STYLES: AvatarStyleConfig[] = [
  { id: 'casual', label: 'Casual', description: 'Modern fitted hoodie & denim', iconName: 'User' },
  { id: 'formal', label: 'Formal', description: 'Tailored suit blazer & trousers', iconName: 'Briefcase' },
  { id: 'traditional', label: 'Traditional', description: 'Natural linen tunic & trousers', iconName: 'Sparkles' },
  { id: 'explorer', label: 'Explorer', description: 'Hiking gear & utility vest', iconName: 'Compass' },
  { id: 'builder', label: 'Architect', description: 'Work vest & utility boots', iconName: 'Hammer' },
  { id: 'cyber', label: 'Futuristic', description: 'Neon techwear & sleek visor', iconName: 'Zap' },
];

export const AVATAR_SKIN_TONES = [
  { id: 'fair', label: 'Fair Porcelain', hex: '#fce4d6' },
  { id: 'warmBeige', label: 'Warm Beige', hex: '#f1c27d' },
  { id: 'olive', label: 'Golden Olive', hex: '#e0ac69' },
  { id: 'bronze', label: 'Warm Bronze', hex: '#c68642' },
  { id: 'chestnut', label: 'Deep Chestnut', hex: '#8d5524' },
  { id: 'espresso', label: 'Rich Espresso', hex: '#4a2a16' },
];

export const AVATAR_HAIRSTYLES = [
  { id: 'short_crop', label: 'Modern Crop / Fade' },
  { id: 'pompadour', label: 'Classic Quiff' },
  { id: 'long_flowing', label: 'Long Waves' },
  { id: 'bun', label: 'Chic Bun' },
  { id: 'braided', label: 'Braided' },
  { id: 'beanie', label: 'Urban Beanie' },
];

export const AVATAR_HAIR_COLORS = [
  { id: 'black', label: 'Jet Black', hex: '#18181b' },
  { id: 'darkBrown', label: 'Dark Espresso', hex: '#271c19' },
  { id: 'chestnut', label: 'Warm Chestnut', hex: '#4a2e1b' },
  { id: 'auburn', label: 'Auburn Copper', hex: '#6d2a1b' },
  { id: 'blonde', label: 'Golden Blonde', hex: '#b58b4c' },
  { id: 'silver', label: 'Silver Ash', hex: '#94a3b8' },
];

export const AVATAR_EYE_COLORS = [
  { id: 'brown', label: 'Deep Brown', hex: '#45220c' },
  { id: 'hazel', label: 'Warm Hazel', hex: '#5c4827' },
  { id: 'amber', label: 'Amber Gold', hex: '#82521c' },
  { id: 'green', label: 'Forest Green', hex: '#235338' },
  { id: 'blue', label: 'Ocean Blue', hex: '#1d4ed8' },
  { id: 'charcoal', label: 'Slate Charcoal', hex: '#1f2937' },
];

export const AVATAR_COLORS: { id: AvatarColor; hex: string; label: string }[] = [
  { id: 'cyan', hex: '#06b6d4', label: 'Neon Cyan' },
  { id: 'emerald', hex: '#10b981', label: 'Emerald' },
  { id: 'purple', hex: '#a855f7', label: 'Violet' },
  { id: 'orange', hex: '#f97316', label: 'Sunset Orange' },
  { id: 'rose', hex: '#f43f5e', label: 'Rose Pink' },
  { id: 'gold', hex: '#eab308', label: 'Solar Gold' },
  { id: 'blue', hex: '#3b82f6', label: 'Cobalt Blue' },
  { id: 'amber', hex: '#d97706', label: 'Warm Amber' },
];

export interface LocalAvatarConfig {
  displayName: string;
  avatarColor: AvatarColor;
  avatarType: AvatarType;
  gender: GenderType;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
}

export interface PlayerData {
  uid: string;
  displayName: string;
  avatarColor: AvatarColor;
  avatarType: AvatarType;
  gender?: GenderType;
  skinTone?: string;
  hairStyle?: string;
  hairColor?: string;
  eyeColor?: string;
  position: [number, number, number];
  rotation: number;
  isMoving: boolean;
  lastSeen: number;
  online: boolean;
  status?: 'online' | 'idle' | 'building';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatarColor: AvatarColor;
  text: string;
  timestamp: number;
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface MultiplayerUser {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  displayName: string;
  avatarColor: AvatarColor;
  avatarType: AvatarType;
  gender?: GenderType;
  skinTone?: string;
  hairStyle?: string;
  hairColor?: string;
  eyeColor?: string;
}

export type CameraFollowMode = 'third_person' | 'free_orbit';

export interface SharedBuildData {
  id: string;
  ownerId: string;
  ownerName: string;
  typeId: string;
  position: [number, number, number];
  rotation: number;
  cost: number;
  createdAt: number;
}
