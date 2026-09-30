import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

export type RealtimeCallback<T = any> = (payload: T) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private connectPromise: Promise<void> | null = null;
  private joinedRooms = new Set<string>();
  private messageCallbacks = new Set<RealtimeCallback>();
  private updateCallbacks = new Set<RealtimeCallback>();
  private readCallbacks = new Set<RealtimeCallback>();
  private typingCallbacks = new Set<RealtimeCallback>();

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return;
    if (this.connectPromise) return this.connectPromise;
    if (!this.connection) {
      const hubUrl = API_URL.replace(/\/api\/?$/, '') + '/chathub';
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, { accessTokenFactory: async () => (await AsyncStorage.getItem('user_jwt_token')) || '' })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(__DEV__ ? signalR.LogLevel.Information : signalR.LogLevel.Warning)
        .build();
      this.connection.on('ReceiveMessage', payload => this.messageCallbacks.forEach(cb => cb(payload)));
      this.connection.on('MessageUpdated', payload => this.updateCallbacks.forEach(cb => cb(payload)));
      this.connection.on('MessagesRead', payload => this.readCallbacks.forEach(cb => cb(payload)));
      this.connection.on('TypingChanged', payload => this.typingCallbacks.forEach(cb => cb(payload)));
      this.connection.onreconnected(() => { void this.rejoinRooms(); });
    }
    this.connectPromise = this.connection.start().then(() => undefined).finally(() => { this.connectPromise = null; });
    return this.connectPromise;
  }

  private async rejoinRooms() {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) return;
    await Promise.all([...this.joinedRooms].map(roomId => this.connection!.invoke('JoinRoom', roomId)));
  }

  async joinRoom(roomId: string) {
    this.joinedRooms.add(roomId);
    await this.connect();
    await this.connection!.invoke('JoinRoom', roomId);
  }

  async leaveRoom(roomId: string) {
    this.joinedRooms.delete(roomId);
    if (this.connection?.state === signalR.HubConnectionState.Connected) await this.connection.invoke('LeaveRoom', roomId);
  }

  async setTyping(roomId: string, isTyping: boolean) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) await this.connection.invoke('Typing', roomId, isTyping);
  }

  onMessageReceived(callback: RealtimeCallback) { this.messageCallbacks.add(callback); return () => { this.messageCallbacks.delete(callback); }; }
  onMessageUpdated(callback: RealtimeCallback) { this.updateCallbacks.add(callback); return () => { this.updateCallbacks.delete(callback); }; }
  onMessagesRead(callback: RealtimeCallback) { this.readCallbacks.add(callback); return () => { this.readCallbacks.delete(callback); }; }
  onTypingChanged(callback: RealtimeCallback) { this.typingCallbacks.add(callback); return () => { this.typingCallbacks.delete(callback); }; }

  async disconnect() {
    this.joinedRooms.clear();
    if (this.connection) await this.connection.stop();
    this.connection = null;
  }
}

export const signalRService = new SignalRService();
