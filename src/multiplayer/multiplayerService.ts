import {
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  addDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import {
  PlayerData,
  ChatMessage,
  ConnectionState,
  MultiplayerUser,
  AvatarColor,
  AvatarType,
  GenderType,
  SharedBuildData,
} from './types';

// Safe default spawn in the Town Center Plaza
export const DEFAULT_SPAWN_POSITION: [number, number, number] = [-8, 0.08, 6];

/**
 * Translates Firebase Auth error codes into clean, actionable user feedback
 */
export function getFriendlyAuthErrorMessage(err: unknown): string {
  if (!err) return 'Authentication failed. Please check your credentials.';
  const code = (err as { code?: string })?.code || '';
  const msg = (err as Error)?.message || '';

  if (code === 'auth/invalid-credential' || msg.includes('auth/invalid-credential')) {
    return 'Incorrect email or password. If you do not have an account yet, please click "Register" or join via "Guest Play".';
  }
  if (code === 'auth/user-not-found' || msg.includes('auth/user-not-found')) {
    return 'No account was found for this email address. Please register a new account or join as Guest.';
  }
  if (code === 'auth/wrong-password' || msg.includes('auth/wrong-password')) {
    return 'Incorrect password. Please verify your password and try again.';
  }
  if (code === 'auth/email-already-in-use' || msg.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (code === 'auth/weak-password' || msg.includes('auth/weak-password')) {
    return 'Password is too short. Please choose a password with at least 6 characters.';
  }
  if (code === 'auth/invalid-email' || msg.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/too-many-requests' || msg.includes('auth/too-many-requests')) {
    return 'Access temporarily disabled due to multiple failed attempts. Please wait a few moments or join as Guest.';
  }
  if (code === 'auth/network-request-failed' || msg.includes('auth/network-request-failed')) {
    return 'Network connection error. Please check your connection and try again.';
  }
  if (code === 'auth/operation-not-allowed' || msg.includes('auth/operation-not-allowed')) {
    return 'Email authentication is currently unavailable. You can enter the village immediately via Guest Play!';
  }

  return 'Unable to authenticate. Please check your email and password, or enter as Guest.';
}

class MultiplayerService {
  private currentUser: MultiplayerUser | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private remotePlayers: Map<string, PlayerData> = new Map();
  private chatMessages: ChatMessage[] = [];
  private sharedBuilds: Map<string, SharedBuildData> = new Map();

  // Firestore listeners
  private playersUnsub: Unsubscribe | null = null;
  private chatUnsub: Unsubscribe | null = null;
  private sharedBuildsUnsub: Unsubscribe | null = null;
  private authUnsub: Unsubscribe | null = null;

  // Throttled movement updater
  private lastSentTime: number = 0;
  private lastSentPosition: [number, number, number] = [0, 0, 0];
  private lastSentRotation: number = 0;
  private pendingUpdateTimeout: number | null = null;
  private heartbeatInterval: number | null = null;
  private isMultiplayerActive: boolean = false;

  // Event callbacks
  private onStateChangeCallbacks: Set<() => void> = new Set();
  private onRemotePlayersUpdateCallbacks: Set<(players: PlayerData[]) => void> = new Set();
  private onChatUpdateCallbacks: Set<(messages: ChatMessage[]) => void> = new Set();
  private onSharedBuildsUpdateCallbacks: Set<(builds: SharedBuildData[]) => void> = new Set();

  constructor() {
    this.initAuthListener();
    this.setupUnloadHandler();
  }

  private setupUnloadHandler() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.isMultiplayerActive && this.currentUser) {
          this.leaveMultiplayerWorldSync();
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 1. AUTHENTICATION
  // ---------------------------------------------------------------------------
  private initAuthListener() {
    this.authUnsub = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        // Read stored profile preferences or set defaults
        let savedColor: AvatarColor = 'cyan';
        let savedStyle: AvatarType = 'casual';
        let savedGender: GenderType = 'male';
        let savedSkinTone: string = 'warmBeige';
        let savedHairStyle: string = 'short_crop';
        let savedHairColor: string = 'darkBrown';
        let savedEyeColor: string = 'brown';
        try {
          const col = localStorage.getItem('3dworld_avatar_color') as AvatarColor;
          if (col) savedColor = col;
          const sty = localStorage.getItem('3dworld_avatar_style') as AvatarType;
          if (sty) savedStyle = sty;
          const gen = localStorage.getItem('3dworld_avatar_gender') as GenderType;
          if (gen) savedGender = gen;
          const sk = localStorage.getItem('3dworld_avatar_skin_tone');
          if (sk) savedSkinTone = sk;
          const hr = localStorage.getItem('3dworld_avatar_hair_style');
          if (hr) savedHairStyle = hr;
          const hc = localStorage.getItem('3dworld_avatar_hair_color');
          if (hc) savedHairColor = hc;
          const ec = localStorage.getItem('3dworld_avatar_eye_color');
          if (ec) savedEyeColor = ec;
        } catch {}

        const displayName = user.displayName || (user.isAnonymous ? `Guest_${user.uid.slice(-4)}` : user.email?.split('@')[0] || 'Player');

        this.currentUser = {
          uid: user.uid,
          email: user.email,
          isAnonymous: user.isAnonymous,
          displayName,
          avatarColor: savedColor,
          avatarType: savedStyle,
          gender: savedGender,
          skinTone: savedSkinTone,
          hairStyle: savedHairStyle,
          hairColor: savedHairColor,
          eyeColor: savedEyeColor,
        };
      } else {
        this.currentUser = null;
      }
      this.notifyState();
    });
  }

  public async signInAsGuest(
    displayName?: string,
    color: AvatarColor = 'cyan',
    style: AvatarType = 'casual',
    gender: GenderType = 'male',
    skinTone: string = 'warmBeige',
    hairStyle: string = 'short_crop',
    hairColor: string = 'darkBrown',
    eyeColor: string = 'brown'
  ): Promise<MultiplayerUser> {
    this.connectionState = 'connecting';
    this.notifyState();

    try {
      const cred = await signInAnonymously(auth);
      const name = displayName?.trim() || `Guest_${cred.user.uid.slice(-4)}`;

      try {
        await updateProfile(cred.user, { displayName: name });
      } catch {}

      this.savePreferences(name, color, style, gender, skinTone, hairStyle, hairColor, eyeColor);

      this.currentUser = {
        uid: cred.user.uid,
        email: null,
        isAnonymous: true,
        displayName: name,
        avatarColor: color,
        avatarType: style,
        gender,
        skinTone,
        hairStyle,
        hairColor,
        eyeColor,
      };

      this.connectionState = 'connected';
      this.notifyState();
      return this.currentUser;
    } catch (err) {
      this.connectionState = 'disconnected';
      this.notifyState();
      throw err;
    }
  }

  public async signUpWithEmail(
    email: string,
    pass: string,
    displayName: string,
    color: AvatarColor = 'cyan',
    style: AvatarType = 'casual',
    gender: GenderType = 'male',
    skinTone: string = 'warmBeige',
    hairStyle: string = 'short_crop',
    hairColor: string = 'darkBrown',
    eyeColor: string = 'brown'
  ): Promise<MultiplayerUser> {
    this.connectionState = 'connecting';
    this.notifyState();

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const name = displayName.trim() || email.split('@')[0];

      try {
        await updateProfile(cred.user, { displayName: name });
      } catch {}

      this.savePreferences(name, color, style, gender, skinTone, hairStyle, hairColor, eyeColor);

      this.currentUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        isAnonymous: false,
        displayName: name,
        avatarColor: color,
        avatarType: style,
        gender,
        skinTone,
        hairStyle,
        hairColor,
        eyeColor,
      };

      this.connectionState = 'connected';
      this.notifyState();
      return this.currentUser;
    } catch (err) {
      this.connectionState = 'disconnected';
      this.notifyState();
      throw err;
    }
  }

  public async signInWithEmail(email: string, pass: string): Promise<MultiplayerUser> {
    this.connectionState = 'connecting';
    this.notifyState();

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      let savedColor: AvatarColor = 'cyan';
      let savedStyle: AvatarType = 'casual';
      let savedGender: GenderType = 'male';
      let savedSkinTone: string = 'warmBeige';
      let savedHairStyle: string = 'short_crop';
      let savedHairColor: string = 'darkBrown';
      let savedEyeColor: string = 'brown';
      try {
        const col = localStorage.getItem('3dworld_avatar_color') as AvatarColor;
        if (col) savedColor = col;
        const sty = localStorage.getItem('3dworld_avatar_style') as AvatarType;
        if (sty) savedStyle = sty;
        const gen = localStorage.getItem('3dworld_avatar_gender') as GenderType;
        if (gen) savedGender = gen;
        const sk = localStorage.getItem('3dworld_avatar_skin_tone');
        if (sk) savedSkinTone = sk;
        const hr = localStorage.getItem('3dworld_avatar_hair_style');
        if (hr) savedHairStyle = hr;
        const hc = localStorage.getItem('3dworld_avatar_hair_color');
        if (hc) savedHairColor = hc;
        const ec = localStorage.getItem('3dworld_avatar_eye_color');
        if (ec) savedEyeColor = ec;
      } catch {}

      const name = cred.user.displayName || email.split('@')[0];

      this.currentUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        isAnonymous: false,
        displayName: name,
        avatarColor: savedColor,
        avatarType: savedStyle,
        gender: savedGender,
        skinTone: savedSkinTone,
        hairStyle: savedHairStyle,
        hairColor: savedHairColor,
        eyeColor: savedEyeColor,
      };

      this.connectionState = 'connected';
      this.notifyState();
      return this.currentUser;
    } catch (err) {
      this.connectionState = 'disconnected';
      this.notifyState();
      throw err;
    }
  }

  public async signOutUser() {
    await this.leaveMultiplayerWorld();
    await signOut(auth);
    this.currentUser = null;
    this.connectionState = 'disconnected';
    this.notifyState();
  }

  public updateProfileSettings(
    displayName: string,
    color: AvatarColor,
    style: AvatarType,
    gender: GenderType = 'male',
    skinTone: string = 'warmBeige',
    hairStyle: string = 'short_crop',
    hairColor: string = 'darkBrown',
    eyeColor: string = 'brown'
  ) {
    this.savePreferences(displayName, color, style, gender, skinTone, hairStyle, hairColor, eyeColor);
    if (!this.currentUser) return;
    this.currentUser.displayName = displayName.trim() || this.currentUser.displayName;
    this.currentUser.avatarColor = color;
    this.currentUser.avatarType = style;
    this.currentUser.gender = gender;
    this.currentUser.skinTone = skinTone;
    this.currentUser.hairStyle = hairStyle;
    this.currentUser.hairColor = hairColor;
    this.currentUser.eyeColor = eyeColor;

    if (auth.currentUser) {
      updateProfile(auth.currentUser, { displayName: this.currentUser.displayName }).catch(() => {});
    }

    // If currently in world, push presence update
    if (this.isMultiplayerActive) {
      this.pushPlayerPresence(this.lastSentPosition, this.lastSentRotation, false, true);
    }
    this.notifyState();
  }

  private savePreferences(
    name: string,
    color: AvatarColor,
    style: AvatarType,
    gender: GenderType = 'male',
    skinTone: string = 'warmBeige',
    hairStyle: string = 'short_crop',
    hairColor: string = 'darkBrown',
    eyeColor: string = 'brown'
  ) {
    try {
      localStorage.setItem('3dworld_player_name', name);
      localStorage.setItem('3dworld_avatar_color', color);
      localStorage.setItem('3dworld_avatar_style', style);
      localStorage.setItem('3dworld_avatar_gender', gender);
      localStorage.setItem('3dworld_avatar_skin_tone', skinTone);
      localStorage.setItem('3dworld_avatar_hair_style', hairStyle);
      localStorage.setItem('3dworld_avatar_hair_color', hairColor);
      localStorage.setItem('3dworld_avatar_eye_color', eyeColor);
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // 2. JOIN & LEAVE MULTIPLAYER REALM
  // ---------------------------------------------------------------------------
  public async joinMultiplayerWorld(initialPosition: [number, number, number] = DEFAULT_SPAWN_POSITION): Promise<boolean> {
    if (!this.currentUser) {
      return false;
    }

    this.isMultiplayerActive = true;
    this.connectionState = 'connecting';
    this.lastSentPosition = [...initialPosition];
    this.lastSentRotation = 0;
    this.notifyState();

    try {
      // 1. Initial presence publish
      await this.pushPlayerPresence(initialPosition, 0, false, true);

      // 2. Subscribe to remote players
      this.subscribeToPlayers();

      // 3. Subscribe to global chat
      this.subscribeToChat();

      // 4. Subscribe to community shared structures
      this.subscribeToSharedBuilds();

      // 5. Start heartbeat (every 15s)
      this.startHeartbeat();

      this.connectionState = 'connected';
      this.notifyState();
      return true;
    } catch (err) {
      console.error('[Multiplayer] Failed to join world:', err);
      this.connectionState = 'error';
      this.notifyState();
      return false;
    }
  }

  public async leaveMultiplayerWorld() {
    this.isMultiplayerActive = false;

    // Clear timers
    if (this.pendingUpdateTimeout) {
      window.clearTimeout(this.pendingUpdateTimeout);
      this.pendingUpdateTimeout = null;
    }
    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Unsubscribe listeners
    if (this.playersUnsub) {
      this.playersUnsub();
      this.playersUnsub = null;
    }
    if (this.chatUnsub) {
      this.chatUnsub();
      this.chatUnsub = null;
    }
    if (this.sharedBuildsUnsub) {
      this.sharedBuildsUnsub();
      this.sharedBuildsUnsub = null;
    }

    // Mark player offline in Firestore
    if (this.currentUser) {
      try {
        const playerRef = doc(db, 'players', this.currentUser.uid);
        await setDoc(playerRef, { online: false, lastSeen: Date.now() }, { merge: true });
      } catch (err) {
        console.warn('[Multiplayer] Could not mark offline:', err);
      }
    }

    this.remotePlayers.clear();
    this.connectionState = this.currentUser ? 'connected' : 'disconnected';
    this.notifyRemotePlayersUpdate();
    this.notifyState();
  }

  private leaveMultiplayerWorldSync() {
    if (!this.currentUser) return;
    try {
      // Best-effort cleanup using sendBeacon or firestore setDoc
      const playerRef = doc(db, 'players', this.currentUser.uid);
      setDoc(playerRef, { online: false, lastSeen: Date.now() }, { merge: true }).catch(() => {});
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // 3. REAL-TIME SUBSCRIPTIONS (PLAYERS & CHAT)
  // ---------------------------------------------------------------------------
  private subscribeToPlayers() {
    if (this.playersUnsub) {
      this.playersUnsub();
    }

    const playersRef = collection(db, 'players');
    const q = query(playersRef, where('online', '==', true));

    this.playersUnsub = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const currentUid = this.currentUser?.uid;
        const activeList: PlayerData[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as PlayerData;
          if (!data || !data.uid) return;

          // Exclude local player from remote list
          if (data.uid === currentUid) return;

          // Filter out stale players whose lastSeen heartbeat is > 60 seconds old
          if (now - (data.lastSeen || 0) > 60000) return;

          // Sanitize coordinates
          if (!Array.isArray(data.position) || data.position.length !== 3) return;

          this.remotePlayers.set(data.uid, data);
          activeList.push(data);
        });

        // Prune disconnected players not in snapshot
        const currentDocUids = new Set(snapshot.docs.map((d) => d.id));
        for (const [uid] of this.remotePlayers) {
          if (!currentDocUids.has(uid) || (currentUid && uid === currentUid)) {
            this.remotePlayers.delete(uid);
          }
        }

        this.notifyRemotePlayersUpdate();
      },
      (error) => {
        console.warn('[Multiplayer] Players snapshot error:', error);
      }
    );
  }

  private subscribeToChat() {
    if (this.chatUnsub) {
      this.chatUnsub();
    }

    const chatRef = collection(db, 'messages');
    const q = query(chatRef, orderBy('timestamp', 'desc'), limit(40));

    this.chatUnsub = onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          msgs.push({
            id: docSnap.id,
            senderId: d.senderId,
            senderName: d.senderName || 'Neighbor',
            avatarColor: d.avatarColor || 'cyan',
            text: d.text || '',
            timestamp: typeof d.timestamp === 'number' ? d.timestamp : Date.now(),
          });
        });

        // Store sorted chronologically
        this.chatMessages = msgs.reverse();
        this.notifyChatUpdate();
      },
      (error) => {
        console.warn('[Multiplayer] Chat snapshot error:', error);
      }
    );
  }

  // ---------------------------------------------------------------------------
  // 4. THROTTLED POSITION SYNCHRONIZATION
  // ---------------------------------------------------------------------------
  public queuePositionUpdate(position: [number, number, number], rotation: number, isMoving: boolean) {
    if (!this.isMultiplayerActive || !this.currentUser) return;

    const now = performance.now();
    const MIN_INTERVAL_MS = 140; // ~7 Hz update rate: smooth for interpolation without spamming writes

    // Compute delta movement
    const dx = position[0] - this.lastSentPosition[0];
    const dz = position[2] - this.lastSentPosition[2];
    const distSq = dx * dx + dz * dz;
    const drot = Math.abs(rotation - this.lastSentRotation);

    // Skip update if avatar has not moved significantly
    if (distSq < 0.04 && drot < 0.05 && !isMoving) {
      return;
    }

    if (now - this.lastSentTime >= MIN_INTERVAL_MS) {
      this.lastSentTime = now;
      this.lastSentPosition = [...position];
      this.lastSentRotation = rotation;
      this.pushPlayerPresence(position, rotation, isMoving, false);
    } else if (!this.pendingUpdateTimeout) {
      // Schedule trailing update to guarantee final resting position is sent
      const delay = MIN_INTERVAL_MS - (now - this.lastSentTime);
      this.pendingUpdateTimeout = window.setTimeout(() => {
        this.pendingUpdateTimeout = null;
        this.lastSentTime = performance.now();
        this.lastSentPosition = [...position];
        this.lastSentRotation = rotation;
        this.pushPlayerPresence(position, rotation, isMoving, false);
      }, delay);
    }
  }

  private async pushPlayerPresence(
    position: [number, number, number],
    rotation: number,
    isMoving: boolean,
    force: boolean = false
  ) {
    if (!this.currentUser) return;

    try {
      const playerRef = doc(db, 'players', this.currentUser.uid);
      const payload: PlayerData = {
        uid: this.currentUser.uid,
        displayName: this.currentUser.displayName,
        avatarColor: this.currentUser.avatarColor,
        avatarType: this.currentUser.avatarType,
        gender: this.currentUser.gender,
        skinTone: this.currentUser.skinTone,
        hairStyle: this.currentUser.hairStyle,
        hairColor: this.currentUser.hairColor,
        eyeColor: this.currentUser.eyeColor,
        position: [
          Math.round(position[0] * 100) / 100,
          Math.round(position[1] * 100) / 100,
          Math.round(position[2] * 100) / 100,
        ],
        rotation: Math.round(rotation * 1000) / 1000,
        isMoving,
        lastSeen: Date.now(),
        online: true,
        status: 'online',
      };

      await setDoc(playerRef, payload, { merge: true });
    } catch (err) {
      if (force) {
        console.warn('[Multiplayer] Error pushing presence:', err);
      }
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isMultiplayerActive && this.currentUser) {
        const playerRef = doc(db, 'players', this.currentUser.uid);
        setDoc(playerRef, { lastSeen: Date.now(), online: true }, { merge: true }).catch(() => {});
      }
    }, 15000); // 15 second heartbeat
  }

  // ---------------------------------------------------------------------------
  // 5. CHAT MESSAGING
  // ---------------------------------------------------------------------------
  public async sendChatMessage(text: string): Promise<boolean> {
    if (!this.currentUser || !text.trim()) return false;

    const trimmed = text.trim().slice(0, 160); // Enforce 160 char boundary
    try {
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        senderId: this.currentUser.uid,
        senderName: this.currentUser.displayName,
        avatarColor: this.currentUser.avatarColor,
        text: trimmed,
        timestamp: Date.now(),
      });
      return true;
    } catch (err) {
      console.warn('[Multiplayer] Failed to send chat message:', err);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // 6. GETTERS & SUBSCRIPTION CALLBACKS
  // ---------------------------------------------------------------------------
  public getCurrentUser(): MultiplayerUser | null {
    return this.currentUser;
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public getIsMultiplayerActive(): boolean {
    return this.isMultiplayerActive;
  }

  public getRemotePlayers(): PlayerData[] {
    return Array.from(this.remotePlayers.values());
  }

  public getChatMessages(): ChatMessage[] {
    return [...this.chatMessages];
  }

  public onStateChange(cb: () => void): () => void {
    this.onStateChangeCallbacks.add(cb);
    return () => this.onStateChangeCallbacks.delete(cb);
  }

  public onRemotePlayersUpdate(cb: (players: PlayerData[]) => void): () => void {
    this.onRemotePlayersUpdateCallbacks.add(cb);
    return () => this.onRemotePlayersUpdateCallbacks.delete(cb);
  }

  public onChatUpdate(cb: (messages: ChatMessage[]) => void): () => void {
    this.onChatUpdateCallbacks.add(cb);
    return () => this.onChatUpdateCallbacks.delete(cb);
  }

  // ---------------------------------------------------------------------------
  // 7. SHARED BUILDS (COMMUNITY PERSISTENCE)
  // ---------------------------------------------------------------------------
  public subscribeToSharedBuilds() {
    if (this.sharedBuildsUnsub) return;

    try {
      const buildsRef = collection(db, 'shared_builds');
      this.sharedBuildsUnsub = onSnapshot(
        buildsRef,
        (snapshot) => {
          this.sharedBuilds.clear();
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            if (d && d.id && Array.isArray(d.position) && d.position.length === 3) {
              this.sharedBuilds.set(d.id, {
                id: d.id,
                ownerId: d.ownerId || '',
                ownerName: d.ownerName || 'Resident',
                typeId: d.typeId,
                position: [d.position[0], d.position[1], d.position[2]],
                rotation: typeof d.rotation === 'number' ? d.rotation : 0,
                cost: typeof d.cost === 'number' ? d.cost : 0,
                createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
              });
            }
          });
          this.notifySharedBuildsUpdate();
        },
        (err) => {
          console.warn('[Multiplayer] Shared builds snapshot error:', err);
        }
      );
    } catch (e) {
      console.warn('[Multiplayer] Failed to subscribe to shared builds:', e);
    }
  }

  public async publishSharedBuild(item: {
    id: string;
    typeId: string;
    position: [number, number, number];
    rotation: number;
    cost: number;
  }): Promise<boolean> {
    if (!this.currentUser) {
      throw new Error('You must enter multiplayer to publish to the community virtual world.');
    }

    // Strict perimeter coordinate validation
    if (Math.abs(item.position[0]) > 96 || Math.abs(item.position[2]) > 96) {
      throw new Error('Structure coordinates are outside the permitted village area.');
    }

    // Anti-spam quota: up to 10 community structures per user
    let userCount = 0;
    for (const b of this.sharedBuilds.values()) {
      if (b.ownerId === this.currentUser.uid) userCount++;
    }
    if (userCount >= 10) {
      throw new Error('You have reached the limit of 10 community structures.');
    }

    const payload: SharedBuildData = {
      id: item.id,
      ownerId: this.currentUser.uid,
      ownerName: this.currentUser.displayName,
      typeId: item.typeId,
      position: [
        Math.round(item.position[0] * 100) / 100,
        Math.round(item.position[1] * 100) / 100,
        Math.round(item.position[2] * 100) / 100,
      ],
      rotation: Math.round(item.rotation * 1000) / 1000,
      cost: item.cost,
      createdAt: Date.now(),
    };

    const docRef = doc(db, 'shared_builds', item.id);
    await setDoc(docRef, payload);
    return true;
  }

  public async deleteSharedBuild(buildId: string): Promise<boolean> {
    if (!this.currentUser) return false;
    const existing = this.sharedBuilds.get(buildId);
    if (!existing || existing.ownerId !== this.currentUser.uid) {
      throw new Error('You can only remove community structures you created.');
    }

    const docRef = doc(db, 'shared_builds', buildId);
    await deleteDoc(docRef);
    return true;
  }

  public getSharedBuilds(): SharedBuildData[] {
    return Array.from(this.sharedBuilds.values());
  }

  public onSharedBuildsUpdate(cb: (builds: SharedBuildData[]) => void): () => void {
    this.onSharedBuildsUpdateCallbacks.add(cb);
    cb(this.getSharedBuilds());
    return () => this.onSharedBuildsUpdateCallbacks.delete(cb);
  }

  private notifySharedBuildsUpdate() {
    const list = this.getSharedBuilds();
    for (const cb of this.onSharedBuildsUpdateCallbacks) cb(list);
  }

  private notifyState() {
    for (const cb of this.onStateChangeCallbacks) cb();
  }

  private notifyRemotePlayersUpdate() {
    const list = this.getRemotePlayers();
    for (const cb of this.onRemotePlayersUpdateCallbacks) cb(list);
  }

  private notifyChatUpdate() {
    const msgs = this.getChatMessages();
    for (const cb of this.onChatUpdateCallbacks) cb(msgs);
  }

  public dispose() {
    this.leaveMultiplayerWorld();
    if (this.authUnsub) this.authUnsub();
    this.onStateChangeCallbacks.clear();
    this.onRemotePlayersUpdateCallbacks.clear();
    this.onChatUpdateCallbacks.clear();
  }
}

export const multiplayerService = new MultiplayerService();
