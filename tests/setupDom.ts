import { Window } from 'happy-dom';
import { mock } from 'node:test';

// 1. Initialize Happy DOM window
const window = new Window();
globalThis.window = window as any;
globalThis.document = window.document as any;
globalThis.navigator = window.navigator as any;
globalThis.location = window.location as any;
globalThis.CustomEvent = window.CustomEvent as any;
globalThis.Event = window.Event as any;

// Copy properties from window to globalThis to expose browser globals
const windowKeys = Object.getOwnPropertyNames(window);
for (const key of windowKeys) {
  if (!(key in globalThis)) {
    try {
      (globalThis as any)[key] = (window as any)[key];
    } catch {
      // Ignore read-only properties
    }
  }
}

// 2. Stub requestAnimationFrame and cancelAnimationFrame
globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(() => callback(Date.now()), 0);
};
globalThis.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// 3. Stub SpeechSynthesis
class SpeechSynthesisUtteranceMock {
  text = '';
  lang = '';
  voice = null;
  volume = 1;
  rate = 1;
  pitch = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text?: string) {
    this.text = text || '';
  }
}
globalThis.SpeechSynthesisUtterance = SpeechSynthesisUtteranceMock as any;

const speechSynthesisMock = {
  speak(utterance: any) {
    setTimeout(() => {
      if (utterance.onend) utterance.onend();
    }, 0);
  },
  cancel() {},
  getVoices() {
    return [
      { name: 'Google Cloud Polish', lang: 'pl-PL', default: true },
      { name: 'Google Cloud English', lang: 'en-US', default: false }
    ];
  },
  onvoiceschanged: null,
  paused: false,
  pending: false,
  speaking: false,
};
globalThis.speechSynthesis = speechSynthesisMock as any;
window.speechSynthesis = speechSynthesisMock as any;

// 4. Stub Clipboard
let clipboardText = '';
const clipboardMock = {
  writeText: async (text: string) => {
    clipboardText = text;
    return Promise.resolve();
  },
  readText: async () => {
    return Promise.resolve(clipboardText);
  }
};
Object.defineProperty(globalThis.navigator, 'clipboard', {
  value: clipboardMock,
  configurable: true,
  writable: true
});

// 5. Stub LocalStorage
const localStore = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => localStore.get(key) || null,
  setItem: (key: string, value: string) => localStore.set(key, value),
  removeItem: (key: string) => localStore.delete(key),
  clear: () => localStore.clear(),
  get length() { return localStore.size; },
  key: (index: number) => Array.from(localStore.keys())[index] || null
};
globalThis.localStorage = localStorageMock as any;
window.localStorage = localStorageMock as any;

// 6. Stub Canvas Element getContext
const originalCreateElement = globalThis.document.createElement;
globalThis.document.createElement = function(tagName: string, options?: any) {
  const element = originalCreateElement.call(this, tagName, options);
  if (tagName.toLowerCase() === 'canvas') {
    (element as any).getContext = () => ({
      drawImage: () => {},
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray() }),
      putImageData: () => {},
      createImageData: () => ({}),
      setTransform: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
    });
    (element as any).toDataURL = () => 'data:image/png;base64,';
  }
  return element;
} as any;

// 7. Stub ResizeObserver and IntersectionObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

globalThis.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// 8. Firebase Mock SDK In-Memory Database and Auth
export const firestoreDb: Record<string, Record<string, any>> = {};

export const clearFirestoreDb = () => {
  for (const key of Object.keys(firestoreDb)) {
    delete firestoreDb[key];
  }
};

export const authState = {
  currentUser: null as any
};

export const resetAuth = () => {
  authState.currentUser = null;
};

// Mock firebase/app
mock.module('firebase/app', {
  namedExports: {
    initializeApp: () => ({ name: '[MockApp]' }),
    getApps: () => [],
    getApp: () => ({ name: '[MockApp]' }),
  }
});

// Mock firebase/auth
mock.module('firebase/auth', {
  namedExports: {
    getAuth: () => ({
      currentUser: authState.currentUser,
      signOut: async () => {
        authState.currentUser = null;
      }
    }),
    signInWithPopup: async (authInstance: any, provider: any) => {
      const user = {
        uid: 'demo_tycoon_user',
        email: 'hubi666hubi@gmail.com',
        displayName: 'Tycoon Sandbox User',
        emailVerified: true,
        isAnonymous: false,
        providerId: 'google.com',
      };
      authState.currentUser = user;
      authInstance.currentUser = user;
      return { user, credential: { accessToken: 'dummy_demo_token' } };
    },
    GoogleAuthProvider: class GoogleAuthProvider {
      static credentialFromResult(result: any) {
        return result?.credential || null;
      }
      addScope() {}
    },
    onAuthStateChanged: (authInstance: any, callback: any) => {
      callback(authState.currentUser);
      return () => {};
    }
  }
});

// Mock firebase/firestore
mock.module('firebase/firestore', {
  namedExports: {
    getFirestore: () => ({ type: 'firestore' }),
    collection: (db: any, path: string) => {
      return { type: 'collection', path };
    },
    doc: (dbOrCol: any, ...paths: string[]) => {
      let collectionPath = '';
      let docId = '';
      if (dbOrCol && dbOrCol.type === 'collection') {
        collectionPath = dbOrCol.path;
        docId = paths[0];
      } else if (dbOrCol && dbOrCol.type === 'firestore') {
        collectionPath = paths[0];
        docId = paths[1];
      } else {
        collectionPath = dbOrCol;
        docId = paths[0];
      }
      return { type: 'doc', collectionPath, docId };
    },
    addDoc: async (collectionRef: any, data: any) => {
      const path = collectionRef.path;
      if (!firestoreDb[path]) firestoreDb[path] = {};
      const id = Math.random().toString(36).substring(7);
      const docData = { ...data, id };
      firestoreDb[path][id] = docData;
      return { id, get: () => docData };
    },
    setDoc: async (docRef: any, data: any) => {
      const { collectionPath, docId } = docRef;
      if (!firestoreDb[collectionPath]) firestoreDb[collectionPath] = {};
      firestoreDb[collectionPath][docId] = { ...data, id: docId };
      return Promise.resolve();
    },
    getDocs: async (queryRef: any) => {
      const collectionPath = queryRef.type === 'query' ? queryRef.collectionPath : queryRef.path;
      const docsMap = firestoreDb[collectionPath] || {};
      let docsList = Object.values(docsMap);

      if (queryRef.type === 'query' && queryRef.wheres) {
        for (const w of queryRef.wheres) {
          const { field, op, value } = w;
          docsList = docsList.filter(doc => {
            const val = doc[field];
            if (op === '==') return val === value;
            if (op === '!=') return val !== value;
            return true;
          });
        }
      }

      return {
        docs: docsList.map(doc => ({
          id: doc.id,
          data: () => doc,
          exists: () => true
        }))
      };
    },
    query: (collectionRef: any, ...constraints: any[]) => {
      const wheres = constraints.filter(c => c && c.type === 'where');
      return {
        type: 'query',
        collectionPath: collectionRef.path,
        wheres
      };
    },
    where: (field: string, op: string, value: any) => {
      return { type: 'where', field, op, value };
    },
    orderBy: (field: string, direction?: string) => {
      return { type: 'orderBy', field, direction };
    },
    deleteDoc: async (docRef: any) => {
      const { collectionPath, docId } = docRef;
      if (firestoreDb[collectionPath] && firestoreDb[collectionPath][docId]) {
        delete firestoreDb[collectionPath][docId];
      }
      return Promise.resolve();
    }
  }
});
