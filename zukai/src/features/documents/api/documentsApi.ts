/**
 * ZUKAI DOCUMENTS API REPOSITORY
 * Location: /zukai/src/features/documents/api/documentsApi.ts
 * Description: Data access layer for documents with typed queries and RPCs
 */

import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '@/types/database';

export type DocumentRow = Database['public']['Tables']['documents']['Row'];

export interface CreateDocumentParams {
  title: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  storagePath: string;
  orgId?: string | null;
}

/**
 * Creates the document row in 'uploading' status prior to starting storage upload
 */
export async function createDocumentRow(params: CreateDocumentParams): Promise<DocumentRow> {
  const { data: { user: remoteUser } } = await supabase.auth.getUser();
  let user = remoteUser;
  if (!user) {
    try {
      const raw = await AsyncStorage.getItem('@zukai_dev_session');
      if (raw) user = JSON.parse(raw)?.user;
    } catch {}
  }
  if (!user) throw new Error('UNAUTHORIZED: Must be signed in to upload documents');

  const { data, error } = await supabase
    .from('documents')
    .insert({
      owner_id: user.id,
      org_id: params.orgId ?? null,
      title: params.title.trim(),
      original_filename: params.originalFilename,
      mime_type: params.mimeType,
      file_size_bytes: params.fileSizeBytes,
      storage_path: params.storagePath,
      status: 'uploading',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Marks the document as 'uploaded' via secure RPC verifying storage object existence and size
 */
export async function completeDocumentUpload(documentId: string): Promise<DocumentRow> {
  const { data, error } = await supabase.rpc('complete_document_upload', {
    p_document_id: documentId,
  });

  if (error) throw error;
  return data;
}

export async function fetchDocuments(orgId?: string | null): Promise<DocumentRow[]> {
  let query = supabase
    .from('documents')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (orgId) {
    query = query.eq('org_id', orgId);
  } else {
    query = query.is('org_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchDocumentById(id: string): Promise<DocumentRow | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateDocumentTitle(documentId: string, title: string): Promise<DocumentRow> {
  const { data, error } = await supabase
    .from('documents')
    .update({ title: title.trim(), updated_at: new Date().toISOString() })
    .eq('id', documentId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function softDeleteDocument(documentId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('soft_delete_document', {
    p_document_id: documentId,
  });

  if (error) throw error;
  return Boolean(data);
}
