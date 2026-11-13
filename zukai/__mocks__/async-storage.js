// Mock for @react-native-async-storage/async-storage
const storage = new Map();
const AsyncStorage = {
  getItem: jest.fn((key) => Promise.resolve(storage.get(key) ?? null)),
  setItem: jest.fn((key, value) => { storage.set(key, value); return Promise.resolve(); }),
  removeItem: jest.fn((key) => { storage.delete(key); return Promise.resolve(); }),
  clear: jest.fn(() => { storage.clear(); return Promise.resolve(); }),
  getAllKeys: jest.fn(() => Promise.resolve([...storage.keys()])),
  multiGet: jest.fn((keys) => Promise.resolve(keys.map(k => [k, storage.get(k) ?? null]))),
  multiSet: jest.fn((pairs) => { pairs.forEach(([k, v]) => storage.set(k, v)); return Promise.resolve(); }),
  multiRemove: jest.fn((keys) => { keys.forEach(k => storage.delete(k)); return Promise.resolve(); }),
};
module.exports = AsyncStorage;
module.exports.default = AsyncStorage;

