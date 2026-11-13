// Jest mock for expo-file-system (legacy API, v2 compat)
module.exports = {
  documentDirectory: 'file:///mock-documents/',
  cacheDirectory: 'file:///mock-cache/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false, uri: '', size: 0 }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(''),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  createDownloadResumable: jest.fn().mockReturnValue({
    downloadAsync: jest.fn().mockResolvedValue({ uri: 'file:///mock-cache/test.mp3', status: 200 }),
    pauseAsync: jest.fn().mockResolvedValue(undefined),
    resumeAsync: jest.fn().mockResolvedValue(undefined),
    savable: jest.fn().mockReturnValue({}),
  }),
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
  FileMode: { READ: 'r', WRITE: 'w', APPEND: 'a' },
};

