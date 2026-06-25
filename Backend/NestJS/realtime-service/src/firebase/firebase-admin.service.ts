import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private firebaseApp: App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || projectId === 'your-firebase-project-id' || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase credentials are not fully configured or are default placeholders. Custom token generation is disabled.',
      );
      return;
    }

    try {
      // Replace literal \n sequence with real newlines in private key
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

      this.firebaseApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error.stack);
    }
  }

  async createCustomToken(uid: string, additionalClaims?: any): Promise<string> {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin SDK is not initialized. Please configure valid credentials.');
    }
    return getAuth(this.firebaseApp).createCustomToken(uid, additionalClaims);
  }

  getFirestore(): Firestore {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin SDK is not initialized. Please configure valid credentials.');
    }
    return getFirestore(this.firebaseApp);
  }
}

