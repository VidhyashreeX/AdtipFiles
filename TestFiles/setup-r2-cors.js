// Setup CORS for Cloudflare R2 bucket
// Run this script to configure CORS for direct browser uploads

import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 Configuration
const config = {
  accountId: '94e2ffe1e7d5daf0d3de8d11c55dd2d6',
  accessKeyId: 'cee3aea0fa77a871fbc3d34a28897216',
  secretAccessKey: '686b7a165aa944fbd641de53bbbb277a07e9a284ace18c84a83237b330b63c1d',
  bucketName: 'adtip',
};

// Create S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  forcePathStyle: true,
});

// CORS configuration for browser uploads
const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:8081',
        'https://web.adtip.in',
        'https://adtip.in',
        'https://www.adtip.in'
      ],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function setupCORS() {
  try {
    console.log('🔧 Setting up CORS for Cloudflare R2 bucket...');
    
    const command = new PutBucketCorsCommand({
      Bucket: config.bucketName,
      CORSConfiguration: corsConfiguration,
    });
    
    await s3Client.send(command);
    
    console.log('✅ CORS configuration applied successfully!');
    console.log('📋 Configured origins:');
    corsConfiguration.CORSRules[0].AllowedOrigins.forEach(origin => {
      console.log(`   - ${origin}`);
    });
    console.log('🚀 You can now upload files directly from the browser!');
    
  } catch (error) {
    console.error('❌ Failed to set up CORS:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your Cloudflare R2 credentials');
    console.log('2. Ensure you have proper permissions on the bucket');
    console.log('3. Try setting CORS via Cloudflare Dashboard instead');
  }
}

// Run the setup
setupCORS();