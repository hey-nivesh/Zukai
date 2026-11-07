import { useUploadStore } from '../src/features/upload/uploadManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'fake_jwt_token',
            user: { id: '00000000-0000-0000-0000-000000000001' },
          },
        },
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: '00000000-0000-0000-0000-000000000001' } },
      }),
    },
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'doc_123',
              title: 'Test Document',
              original_filename: 'test.pdf',
              mime_type: 'application/pdf',
              file_size_bytes: 1048576,
              storage_path: 'user_1/temp/original.pdf',
              status: 'uploading',
            },
            error: null,
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    rpc: jest.fn().mockResolvedValue({
      data: {
        id: 'doc_123',
        status: 'uploaded',
      },
      error: null,
    }),
  },
}));

describe('Upload Manager State Machine', () => {
  beforeEach(() => {
    useUploadStore.getState().clearUpload();
    jest.clearAllMocks();
  });

  it('initializes in idle state', () => {
    const state = useUploadStore.getState();
    expect(state.status).toBe('idle');
    expect(state.activeDocument).toBeNull();
    expect(state.progress.percent).toBe(0);
  });

  it('transitions through cancelUpload and purges persisted storage', async () => {
    useUploadStore.setState({
      status: 'uploading',
      activeDocument: {
        id: 'doc_123',
        owner_id: 'user_1',
        org_id: null,
        title: 'Doc',
        original_filename: 'doc.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 100,
        storage_path: 'path',
        page_count: 1,
        word_count: 100,
        source_language: 'en',
        status: 'uploading',
        error_code: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });

    await useUploadStore.getState().cancelUpload();

    expect(useUploadStore.getState().status).toBe('canceled');
    expect(useUploadStore.getState().activeDocument).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });

  it('detects pending cold-start uploads from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ documentId: 'doc_cold_start', fileName: 'cold.pdf' })
    );

    const hasPending = await useUploadStore.getState().checkPendingUpload();
    expect(hasPending).toBe(true);
  });
});

