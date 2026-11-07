/**
 * ZUKAI RPC ERROR MAPPER
 * Location: /zukai/src/lib/rpcErrors.ts
 * Description: Translates backend SQL / RPC exception codes into user-friendly copy.
 */

export type RpcErrorCode =
  | 'QUOTA_EXCEEDED'
  | 'TOO_MANY_JOBS'
  | 'DOCUMENT_NOT_READY'
  | 'DOCUMENT_DELETED'
  | 'DOCUMENT_NOT_FOUND'
  | 'ACCESS_DENIED'
  | 'UNAUTHORIZED'
  | 'CANNOT_CANCEL'
  | 'CANNOT_REMOVE_LAST_OWNER'
  | 'CANNOT_DEMOTE_LAST_OWNER'
  | 'SOLE_OWNER_BLOCKED'
  | 'INVALID_INPUT'
  | 'UNKNOWN_ERROR';

export interface UserFriendlyError {
  code: RpcErrorCode;
  title: string;
  message: string;
  actionLabel?: string;
  isRetryable: boolean;
}

export function mapRpcError(rawError: unknown): UserFriendlyError {
  const errorMessage =
    typeof rawError === 'string'
      ? rawError
      : rawError && typeof rawError === 'object' && 'message' in rawError
      ? String((rawError as { message: unknown }).message)
      : '';

  if (errorMessage.includes('QUOTA_EXCEEDED')) {
    if (errorMessage.includes('File size')) {
      return {
        code: 'QUOTA_EXCEEDED',
        title: 'File Too Large',
        message: 'This document exceeds your plan upload limit. Upgrade your plan to process larger files.',
        actionLabel: 'Upgrade Plan',
        isRetryable: false,
      };
    }
    if (errorMessage.includes('pages')) {
      return {
        code: 'QUOTA_EXCEEDED',
        title: 'Page Limit Exceeded',
        message: 'This document has more pages than allowed on your current tier.',
        actionLabel: 'Upgrade Plan',
        isRetryable: false,
      };
    }
    return {
      code: 'QUOTA_EXCEEDED',
      title: 'Monthly Limit Reached',
      message: 'You have consumed all your monthly audio explanation minutes. Upgrade to keep generating audio.',
      actionLabel: 'Upgrade Plan',
      isRetryable: false,
    };
  }

  if (errorMessage.includes('TOO_MANY_JOBS')) {
    return {
      code: 'TOO_MANY_JOBS',
      title: 'Processing Queue Full',
      message: 'You already have active audio generation jobs in progress. Please wait for them to finish.',
      actionLabel: 'View Active Jobs',
      isRetryable: true,
    };
  }

  if (errorMessage.includes('DOCUMENT_NOT_READY')) {
    return {
      code: 'DOCUMENT_NOT_READY',
      title: 'Document Not Ready',
      message: 'This document could not be processed. Please check if it contains readable text and re-upload.',
      actionLabel: 'Re-upload',
      isRetryable: false,
    };
  }

  if (errorMessage.includes('DOCUMENT_DELETED')) {
    return {
      code: 'DOCUMENT_DELETED',
      title: 'Document Deleted',
      message: 'This document has already been removed.',
      isRetryable: false,
    };
  }

  if (errorMessage.includes('DOCUMENT_NOT_FOUND')) {
    return {
      code: 'DOCUMENT_NOT_FOUND',
      title: 'Document Missing',
      message: 'The requested document could not be found.',
      isRetryable: false,
    };
  }

  if (errorMessage.includes('ACCESS_DENIED') || errorMessage.includes('violates row-level security policy')) {
    return {
      code: 'ACCESS_DENIED',
      title: 'Access Restricted',
      message: 'You do not have permission to perform this action or access this resource.',
      isRetryable: false,
    };
  }

  if (errorMessage.includes('UNAUTHORIZED')) {
    return {
      code: 'UNAUTHORIZED',
      title: 'Sign In Required',
      message: 'Please sign in to access your documents and generate audio.',
      actionLabel: 'Sign In',
      isRetryable: false,
    };
  }

  if (errorMessage.includes('CANNOT_CANCEL')) {
    return {
      code: 'CANNOT_CANCEL',
      title: 'Unable to Cancel',
      message: 'This job has already finished or failed.',
      isRetryable: false,
    };
  }

  if (errorMessage.includes('CANNOT_REMOVE_LAST_OWNER') || errorMessage.includes('CANNOT_DEMOTE_LAST_OWNER') || errorMessage.includes('SOLE_OWNER_BLOCKED')) {
    return {
      code: 'CANNOT_REMOVE_LAST_OWNER',
      title: 'Owner Required',
      message: 'An organization must always have at least one owner. Transfer ownership before leaving or deleting.',
      isRetryable: false,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    title: 'Something Went Wrong',
    message: errorMessage || 'An unexpected error occurred. Please check your connection and try again.',
    isRetryable: true,
  };
}

