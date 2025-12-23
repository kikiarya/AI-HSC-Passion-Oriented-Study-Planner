import { SESClient } from '@aws-sdk/client-ses';
import dotenv from 'dotenv';

dotenv.config();

let sesClient = null;

/**
 * Get or create AWS SES client instance
 * @returns {SESClient} The SES client instance
 */
export const getSESClient = () => {
  if (!sesClient) {
    // Validate required environment variables
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION is required in environment variables');
    }
    
    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('AWS_ACCESS_KEY_ID is required in environment variables');
    }
    
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS_SECRET_ACCESS_KEY is required in environment variables');
    }

    sesClient = new SESClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log('AWS SES client initialized successfully');
  }

  return sesClient;
};

/**
 * Reset the SES client instance (useful for testing)
 */
export const resetSESClient = () => {
  sesClient = null;
};

