// Appwrite Web SDK foundation. The API key is never used or exposed here.
import { Client, Account, ID, OAuthProvider } from "https://cdn.jsdelivr.net/npm/appwrite@26.2.0/+esm";

const endpoint = window.HELORA_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = window.HELORA_APPWRITE_PROJECT_ID || '6a9e7d7e0002521430e1';

export const appwriteClient = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

export { ID, OAuthProvider };

export const appwriteAccount = new Account(appwriteClient);