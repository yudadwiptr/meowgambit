import Peer, { type DataConnection } from 'peerjs';
import type { OnlineMessage } from '../types/game';

const PEER_PREFIX = 'meowgambit-v1-';

// Fun 3-letter cat/dog prefixes + 2 digits -> crisp 5-char room codes like CAT88, PAW42, DOG79!
const CODE_PREFIXES = ['CAT', 'PAW', 'MEW', 'DOG', 'PUP', 'PUR', 'KNG', 'LION'.slice(0, 3), 'FOX', 'BARK'.slice(0, 3)];
const CODE_DIGITS = '23456789';

export function generateRoomCode(): string {
  const prefix = CODE_PREFIXES[Math.floor(Math.random() * CODE_PREFIXES.length)];
  const d1 = CODE_DIGITS[Math.floor(Math.random() * CODE_DIGITS.length)];
  const d2 = CODE_DIGITS[Math.floor(Math.random() * CODE_DIGITS.length)];
  return `${prefix}${d1}${d2}`;
}

export function normalizeRoomCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);
}

const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  },
};

export interface MultiplayerCallbacks {
  onRoomReady?: (code: string) => void;
  onConnected: () => void;
  onMessage: (msg: OnlineMessage) => void;
  onDisconnect: () => void;
  onError: (code: 'not-found' | 'network' | 'timeout' | 'busy') => void;
}

/**
 * PeerJS WebRTC P2P Manager for MeowGambit Online 1v1 Multiplayer (Mabar).
 * Zero external backend required; handles Host room creation, Guest joining,
 * JSON message transport, connection timeout, and clean teardown.
 */
export class MultiplayerManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private connectTimeout: number | null = null;
  private destroyed = false;

  public destroy(): void {
    this.destroyed = true;
    this.clearTimeout();
    try {
      this.conn?.close();
    } catch {
      // ignore
    }
    try {
      this.peer?.destroy();
    } catch {
      // ignore
    }
    this.conn = null;
    this.peer = null;
  }

  private clearTimeout(): void {
    if (this.connectTimeout !== null) {
      window.clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
  }

  public isConnected(): boolean {
    return Boolean(this.conn && this.conn.open);
  }

  public send(msg: OnlineMessage): boolean {
    if (!this.conn || !this.conn.open) return false;
    try {
      this.conn.send(msg);
      return true;
    } catch {
      return false;
    }
  }

  private attachConnection(conn: DataConnection, cb: MultiplayerCallbacks): void {
    this.conn = conn;

    conn.on('open', () => {
      if (this.destroyed) return;
      this.clearTimeout();
      cb.onConnected();
    });

    conn.on('data', (raw) => {
      if (this.destroyed) return;
      if (raw && typeof raw === 'object' && 'type' in raw) {
        cb.onMessage(raw as OnlineMessage);
      }
    });

    conn.on('close', () => {
      if (this.destroyed) return;
      this.clearTimeout();
      this.conn = null;
      cb.onDisconnect();
    });

    conn.on('error', () => {
      if (this.destroyed) return;
      this.clearTimeout();
      cb.onError('network');
    });
  }

  /** Host creates a 5-character room and waits for a Guest to connect */
  public createRoom(cb: MultiplayerCallbacks, attempt = 0): void {
    this.destroy();
    this.destroyed = false;

    const code = generateRoomCode();
    const peerId = `${PEER_PREFIX}${code}`;

    const peer = new Peer(peerId, PEER_CONFIG);
    this.peer = peer;

    peer.on('open', () => {
      if (this.destroyed) return;
      cb.onRoomReady?.(code);
    });

    peer.on('connection', (incoming) => {
      if (this.destroyed) return;
      // Only allow 1 opponent in a 1v1 match
      if (this.conn && this.conn.open) {
        incoming.close();
        return;
      }
      this.attachConnection(incoming, cb);
    });

    peer.on('error', (err) => {
      if (this.destroyed) return;
      if (err.type === 'unavailable-id' && attempt < 3) {
        this.createRoom(cb, attempt + 1);
        return;
      }
      cb.onError(err.type === 'unavailable-id' ? 'busy' : 'network');
    });
  }

  /** Guest connects to Host's 5-character room code */
  public joinRoom(rawCode: string, cb: MultiplayerCallbacks): void {
    this.destroy();
    this.destroyed = false;

    const code = normalizeRoomCode(rawCode);
    if (code.length < 4) {
      cb.onError('not-found');
      return;
    }

    const targetPeerId = `${PEER_PREFIX}${code}`;
    const peer = new Peer(PEER_CONFIG);
    this.peer = peer;

    this.connectTimeout = window.setTimeout(() => {
      if (!this.destroyed && !this.isConnected()) {
        cb.onError('timeout');
        this.destroy();
      }
    }, 15000);

    peer.on('open', () => {
      if (this.destroyed) return;
      const conn = peer.connect(targetPeerId, { reliable: true });
      this.attachConnection(conn, cb);
    });

    peer.on('error', (err) => {
      if (this.destroyed) return;
      this.clearTimeout();
      if (err.type === 'peer-unavailable') {
        cb.onError('not-found');
      } else {
        cb.onError('network');
      }
    });
  }
}
