import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api'; // Ensure this exports the base URL

export type MessageReceivedCallback = (message: any) => void;

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private onMessageReceivedCallbacks: MessageReceivedCallback[] = [];

    public async connect() {
        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
            return;
        }

        const token = await AsyncStorage.getItem('user_jwt_token');
        
        // Remove trailing /api if present, and add /chathub
        const hubUrl = API_URL.replace('/api', '') + '/chathub';

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token || '',
            })
            .withAutomaticReconnect()
            .build();

        this.connection.on('ReceiveMessage', (message) => {
            this.onMessageReceivedCallbacks.forEach(cb => cb(message));
        });

        try {
            await this.connection.start();
            console.log('SignalR Connected.');
        } catch (err) {
            console.error('SignalR Connection Error: ', err);
            setTimeout(() => this.connect(), 5000);
        }
    }

    public getConnectionId(): string | null {
        return this.connection?.connectionId || null;
    }

    public onMessageReceived(callback: MessageReceivedCallback) {
        this.onMessageReceivedCallbacks.push(callback);
    }

    public offMessageReceived(callback: MessageReceivedCallback) {
        this.onMessageReceivedCallbacks = this.onMessageReceivedCallbacks.filter(cb => cb !== callback);
    }

    public async disconnect() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }
    }
}

export const signalRService = new SignalRService();
