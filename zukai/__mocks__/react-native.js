// Minimal react-native mock for Jest (node environment)
const AppState = {
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  currentState: 'active',
};

const Alert = {
  alert: jest.fn(),
};

const Linking = {
  openURL: jest.fn().mockResolvedValue(undefined),
  canOpenURL: jest.fn().mockResolvedValue(true),
};

const Platform = {
  OS: 'android',
  Version: 33,
  select: (obj) => obj['android'] ?? obj['default'],
};

const Share = {
  share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
};

const PermissionsAndroid = {
  PERMISSIONS: {
    POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
  },
  RESULTS: { GRANTED: 'granted', DENIED: 'denied', NEVER_ASK_AGAIN: 'never_ask_again' },
  request: jest.fn().mockResolvedValue('granted'),
  check: jest.fn().mockResolvedValue('granted'),
};

module.exports = {
  AppState,
  Alert,
  Linking,
  Platform,
  Share,
  PermissionsAndroid,
  StyleSheet: { create: (s) => s, flatten: (s) => s, hairlineWidth: 1 },
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  Modal: 'Modal',
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  FlatList: 'FlatList',
  SectionList: 'SectionList',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  Animated: {
    View: 'AnimatedView',
    Text: 'AnimatedText',
    Value: class { constructor(v) { this._v = v; } setValue(v) { this._v = v; } addListener() {} removeAllListeners() {} },
    timing: jest.fn(() => ({ start: jest.fn() })),
    spring: jest.fn(() => ({ start: jest.fn() })),
    sequence: jest.fn(() => ({ start: jest.fn() })),
    parallel: jest.fn(() => ({ start: jest.fn() })),
    loop: jest.fn(() => ({ start: jest.fn() })),
    createAnimatedComponent: (c) => c,
  },
  NativeModules: {},
  NativeEventEmitter: class { addListener() { return { remove: jest.fn() }; } removeAllListeners() {} },
  DeviceEventEmitter: { addListener: jest.fn(() => ({ remove: jest.fn() })), emit: jest.fn() },
  Dimensions: { get: jest.fn(() => ({ width: 390, height: 844, scale: 3, fontScale: 1 })), addEventListener: jest.fn() },
  Keyboard: { dismiss: jest.fn(), addListener: jest.fn(() => ({ remove: jest.fn() })) },
};

