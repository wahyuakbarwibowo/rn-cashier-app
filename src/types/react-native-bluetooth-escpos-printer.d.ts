declare module 'react-native-bluetooth-escpos-printer' {
  import { EventEmitter } from 'react-native';

  export interface BluetoothConnectOption {
    [key: string]: any;
  }

  export interface PrintOption {
    [key: string]: any;
  }

  export default class BluetoothEscposPrinter {
    static connect(address: string, options: BluetoothConnectOption): Promise<void>;
    static disconnect(): Promise<void>;
    static printText(text: string, options: PrintOption): Promise<void>;
    static printColumn(columns: any[], options: PrintOption): Promise<void>;
    static scan(): Promise<void>;
    static stopScan(): Promise<void>;
    static addListener(eventName: string, callback: (data: any) => void): any;
  }
}
