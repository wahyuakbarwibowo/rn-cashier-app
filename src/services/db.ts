import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('kasir.db');

export const initDB = () => {
  db.transaction((tx: unknown) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kode TEXT,
        nama TEXT,
        harga_beli_satuan REAL,
        harga_beli_paket REAL,
        qty_paket INTEGER,
        harga_jual_satuan REAL,
        harga_jual_paket REAL,
        stok INTEGER,
        diskon REAL,
        foto TEXT
      );`,
      [],
      () => { console.log('Table products ready'); },
      (_, error) => { console.log('DB Error', error); return false; }
    );
  });
};

export const addProduct = (product: any, callback: () => void) => {
  const {
    kode, nama,
    harga_beli_satuan, harga_beli_paket, qty_paket,
    harga_jual_satuan, harga_jual_paket,
    stok, diskon, foto
  } = product;

  db.transaction(tx => {
    tx.executeSql(
      `INSERT INTO products (kode,nama,harga_beli_satuan,harga_beli_paket,qty_paket,harga_jual_satuan,harga_jual_paket,stok,diskon,foto) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [kode,nama,harga_beli_satuan,harga_beli_paket,qty_paket,harga_jual_satuan,harga_jual_paket,stok,diskon,foto],
      () => { callback(); },
      (_, error) => { console.log(error); return false; }
    );
  });
};

export default db;
