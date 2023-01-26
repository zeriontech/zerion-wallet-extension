import { firebaseConfig } from './config';

// Firebase Installation Id
const FID = 'dGJKrFY0eS17nAuIX-u2US';
// Firebase Installation Token
const FIT =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjE6MTE3MzI1NTk0NTU1OndlYjoyYmI4YWVlZjBmOGUxODJlMzljZTllIiwiZXhwIjoxNjc1MzQ2MTIxLCJmaWQiOiJkR0pLckZZMGVTMTduQXVJWC11MlVTIiwicHJvamVjdE51bWJlciI6MTE3MzI1NTk0NTU1fQ.AB2LPV8wRAIgD-mtLFsq7Jcjcp4V3I5yjXlFb4R7cXB4Rh27PlAoKOoCIEyu8h9CGVuN4GVdB_BYHDfmgYzL-1JFqzjd7nw82zoz';

interface FetchRequest {
  sdk_version: string;
  app_instance_id: string;
  app_instance_id_token: string;
  app_id: string;
  language_code: string;
}

export type FirebaseRemoteConfig = Record<string, string>;

export async function fetchRemoteConfig(): Promise<FirebaseRemoteConfig | null> {
  const baseURL = 'https://firebaseremoteconfig.googleapis.com';
  const namespace = 'firebase';
  const url = `${baseURL}/v1/projects/${firebaseConfig.projectId}/namespaces/${namespace}:fetch?key=${firebaseConfig.apiKey}`;
  const headers = {
    'Content-Type': 'application/json',
    'Content-Encoding': 'gzip',
    'If-None-Match': '*',
  };

  const request: FetchRequest = {
    sdk_version: '7.20.0',
    app_instance_id: FID,
    app_instance_id_token: FIT,
    app_id: firebaseConfig.appId,
    language_code: 'en-US',
  };
  const options = {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  };

  const response = await fetch(url, options);
  if (response.status === 200) {
    const body = await response.json();
    return body['entries'] as FirebaseRemoteConfig;
  }
  return null;
}
