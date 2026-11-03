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
  SharedBuildData,
} from './types';

// Safe default spawn in the Town Center Plaza
export const DEFAULT_SPAWN_POSITION: [number, number, number] = [-8, 0.08, 6];

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
        try {
          const col = localStorage.getItem('3dworld_avatar_color') as AvatarColor;
          if (col) savedColor = col;
          const sty = localStorage.getItem('3dworld_avatar_style') as AvatarType;
          if (sty) savedStyle = sty;
        } catch {}

        const displayName = user.displayName || (user.isAnonymous ? `Guest_${user.uid.slice(-4)}` : user.email?.split('@')[0] || 'Player');

        this.currentUser = {
          uid: user.uid,
          email: user.email,
          isAnonymous: user.isAnonymous,
          displayName,
          avatarColor: savedColor,
          avatarType: savedStyle,
        };
      } else {
        this.currentUser = null;
      }
      this.notifyState();
    });
  }

  public async signInAsGuest(displayName?: string, color: AvatarColor = 'cyan', style: AvatarType = 'casual'): Promise<MultiplayerUser> {
    this.connectionState = 'connecting';
    this.notifyState();

    try {
      const cred = await signInAnonymously(auth);
      const name = displayName?.trim() || `Guest_${cred.user.uid.slice(-4)}`;

      try {
        await updateProfile(cred.user, { displayName: name });
      } catch {}

      this.savePreferences(name, color, style);

      this.currentUser = {
        uid: cred.user.uid,
        email: null,
        isAnonymous: true,
        displayName: name,
        avatarColor: color,
        avatarType: style,
      };

      this.connectionState = 'connected';
      this.notifyState();
      return this.currentUser;
    } catch (err) {
      this.connectionState = 'error';
      this.notifyState();
      throw err;
    }
  }

  public async signUpWithEmail(
    email: string,
    pass: string,
    displayName: string,
    color: AvatarColor = 'cyan',
    style: AvatarType = 'casual'
  ): Promise<MultiplayerUser> {
    this.connectionState = 'connecting';
    this.notifyState();

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const name = displayName.trim() || email.split('@')[0];

      try {
        await updateProfile(cred.user, { displayName: name });
      } catch {}

      this.savePreferences(name, color, style);

      this.currentUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        isAnonymous: false,
        displayName: name,
        avatarColor: color,
        avatarType: style,
      };

      this.connectionState = 'connected';
      this.notifyState();
      return this.currentUser;
    } catch (err) {
      this.connectionState = 'error';
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
      try {
        const col = localStorage.getItem('3dworld_avatar_color') as AvatarColor;
        if (col) savedColor = col;
        const sty = localStorage.getItem('3dworld_avatar_style') as AvatarType;
        if (sty) savedStyle = sty;
      } catch {}

      const name = cred.user.displayName || email.split('@')[0];

      this.currentUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        isAnonymous: false,
        displayName: name,
        avatarColor: savedColor,
        avatarType: savedStyle,
      };

      this.connectionState = 'connected';
      this.notifyState();
      return this.currentUser;
    } catch (err) {
      this.connectionState = 'error';
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

  public updateProfileSettings(displayName: string, color: AvatarColor, style: AvatarType) {
    if (!this.currentUser) return;
    this.currentUser.displayName = displayName.trim() || this.currentUser.displayName;
    this.currentUser.avatarColor = color;
    this.currentUser.avatarType = style;
    this.savePreferences(displayName, color, style);

    if (auth.currentUser) {
      updateProfile(auth.currentUser, { displayName: this.currentUser.displayName }).catch(() => {});
    }

    // If currently in world, push presence update
    if (this.isMultiplayerActive) {
      this.pushPlayerPresence(this.lastSentPosition, this.lastSentRotation, false, true);
    }
    this.notifyState();
  }

  private savePreferences(name: string, color: AvatarColor, style: AvatarType) {
    try {
      localStorage.setItem('3dworld_player_name', name);
      localStorage.setItem('3dworld_avatar_color', color);
      localStorage.setItem('3dworld_avatar_style', style);
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

      // 4. Start heartbeat (every 15s)
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
