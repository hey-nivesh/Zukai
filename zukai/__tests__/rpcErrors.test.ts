import { mapRpcError } from '../src/lib/rpcErrors';

describe('RPC Error Mapper', () => {
  it('maps QUOTA_EXCEEDED file size error correctly', () => {
    const error = mapRpcError('QUOTA_EXCEEDED: File size exceeds the 10 MB limit for free tier');
    expect(error.code).toBe('QUOTA_EXCEEDED');
    expect(error.title).toBe('File Too Large');
    expect(error.isRetryable).toBe(false);
  });

  it('maps QUOTA_EXCEEDED page limit error correctly', () => {
    const error = mapRpcError('QUOTA_EXCEEDED: Document has 25 pages which exceeds the 20 page limit');
    expect(error.code).toBe('QUOTA_EXCEEDED');
    expect(error.title).toBe('Page Limit Exceeded');
  });

  it('maps QUOTA_EXCEEDED monthly minutes correctly', () => {
    const error = mapRpcError('QUOTA_EXCEEDED: Monthly audio limit reached');
    expect(error.code).toBe('QUOTA_EXCEEDED');
    expect(error.title).toBe('Monthly Limit Reached');
  });

  it('maps TOO_MANY_JOBS concurrency limit correctly', () => {
    const error = mapRpcError('TOO_MANY_JOBS: Concurrency limit reached (1 max active jobs on free tier)');
    expect(error.code).toBe('TOO_MANY_JOBS');
    expect(error.title).toBe('Processing Queue Full');
    expect(error.isRetryable).toBe(true);
  });

  it('maps DOCUMENT_NOT_READY error correctly', () => {
    const error = mapRpcError('DOCUMENT_NOT_READY: Document processing failed');
    expect(error.code).toBe('DOCUMENT_NOT_READY');
    expect(error.title).toBe('Document Not Ready');
  });

  it('maps ACCESS_DENIED error correctly', () => {
    const error = mapRpcError('ACCESS_DENIED: You do not have permission to access this document');
    expect(error.code).toBe('ACCESS_DENIED');
    expect(error.title).toBe('Access Restricted');
  });

  it('maps CANNOT_REMOVE_LAST_OWNER correctly', () => {
    const error = mapRpcError('CANNOT_REMOVE_LAST_OWNER: Organization must retain at least one owner');
    expect(error.code).toBe('CANNOT_REMOVE_LAST_OWNER');
    expect(error.title).toBe('Owner Required');
  });

  it('handles unknown generic errors gracefully', () => {
    const error = mapRpcError(new Error('Network request failed'));
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.title).toBe('Something Went Wrong');
    expect(error.isRetryable).toBe(true);
  });
});

