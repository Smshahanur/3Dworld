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

export type AvatarType = 'casual' | 'explorer' | 'builder' | 'cyber';

export interface AvatarStyleConfig {
  id: AvatarType;
  label: string;
  description: string;
  iconName: string;
}

export const AVATAR_STYLES: AvatarStyleConfig[] = [
  { id: 'casual', label: 'Casual', description: 'Modern village resident style', iconName: 'User' },
  { id: 'explorer', label: 'Explorer', description: 'Hiking gear & backpack', iconName: 'Compass' },
  { id: 'builder', label: 'Architect', description: 'Hard hat & work vest', iconName: 'Hammer' },
  { id: 'cyber', label: 'Futuristic', description: 'Neon visor & sleek jacket', iconName: 'Sparkles' },
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

export interface PlayerData {
  uid: string;
  displayName: string;
  avatarColor: AvatarColor;
  avatarType: AvatarType;
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
