import { Timestamp } from 'firebase/firestore';

export type MediaType = 'image' | 'video';

export interface DateMemory {
  id?: string;
  title: string;
  date: string;
  mediaUrls: string[];
  mediaType: MediaType;
  musicUrl?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  author: 'duPO' | 'xurry';
  songTitle?: string;
  note?: string;
}

export interface PersonalPhoto {
  id?: string;
  category: 'dupo' | 'xurry';
  imageUrl: string;
  title?: string;
  createdAt: Timestamp;
}

export interface Settings {
  dupoCover?: string;
  xurryCover?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
