export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig: FirebaseConfig = {
  apiKey: 'AIzaSyAR2J96kSwxwE59wwH9OP8KblX6_t1AzeY',
  authDomain: 'zerion-4e880.firebaseapp.com',
  databaseURL: 'https://zerion-4e880.firebaseio.com',
  projectId: 'zerion-4e880',
  storageBucket: 'zerion-4e880.appspot.com',
  messagingSenderId: '117325594555',
  appId: '1:117325594555:web:2bb8aeef0f8e182e39ce9e',
  measurementId: 'G-S3239QENFK',
};
