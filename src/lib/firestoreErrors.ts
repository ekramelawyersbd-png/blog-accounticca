import { fallbackAuth, customDomainAuth } from './firebase';

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || '';
  const isOfflineError =
    errCode === 'unavailable' ||
    errMessage.toLowerCase().includes('offline') ||
    errMessage.toLowerCase().includes('could not reach cloud firestore backend');

  const firestoreUser = fallbackAuth.currentUser;
  const isUnbridgedCrossProjectSession = !firestoreUser && Boolean(customDomainAuth.currentUser);

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: firestoreUser?.uid ?? null,
      email: firestoreUser?.email ?? null,
      emailVerified: firestoreUser?.emailVerified ?? null,
      isAnonymous: firestoreUser?.isAnonymous ?? null,
      tenantId: firestoreUser?.tenantId ?? null,
      providerInfo: firestoreUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isOfflineError || isUnbridgedCrossProjectSession) {
    console.warn('Firestore operating in local cache / unbridged session mode:', errInfo.path);
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
