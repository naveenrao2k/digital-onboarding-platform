import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const region = process.env.AWS_REGION;
const bucketName = process.env.S3_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

async function checkS3Credentials() {
  console.log('\n🔍 Starting S3 Credentials Check...\n');
  
  // Validate environment variables
  if (!region || !bucketName || !accessKeyId || !secretAccessKey) {
    console.error('❌ Missing required environment variables:');
    !region && console.log('   - AWS_REGION');
    !bucketName && console.log('   - S3_BUCKET_NAME');
    !accessKeyId && console.log('   - AWS_ACCESS_KEY_ID');
    !secretAccessKey && console.log('   - AWS_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    }
  });

  try {
    // Test 1: List Buckets (tests credentials)
    console.log('📋 Testing AWS credentials...');
    const listBucketsResponse = await s3Client.send(new ListBucketsCommand({}));
    console.log('✅ AWS credentials are valid');
    console.log(`   Found ${listBucketsResponse.Buckets?.length} buckets`);

    // Test 2: Upload test file
    console.log('\n📤 Testing upload permissions...');
    const testKey = `test/s3-check-${Date.now()}.txt`;
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: 'S3 credentials check test file',
      ContentType: 'text/plain'
    }));
    console.log('✅ Upload successful');

    // Test 3: Download test file
    console.log('\n📥 Testing download permissions...');
    const getObjectResponse = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey
    }));
    const streamToString = await getObjectResponse.Body?.transformToString();
    console.log('✅ Download successful');

    // Test 4: Delete test file
    console.log('\n🗑️  Testing delete permissions...');
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey
    }));
    console.log('✅ Delete successful');

    // Final Report
    console.log('\n✨ S3 Credentials Check Summary:');
    console.log('----------------------------');
    console.log('🔐 Credentials: Valid');
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`🌎 Region: ${region}`);
    console.log('📝 Permissions:');
    console.log('   ✓ List Buckets');
    console.log('   ✓ Upload Objects');
    console.log('   ✓ Download Objects');
    console.log('   ✓ Delete Objects');
    console.log('\n🎉 All tests passed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error during S3 credentials check:');
    console.error('----------------------------');
    console.error(`Error: ${error.message}`);
    if (error.Code) console.error(`AWS Error Code: ${error.Code}`);
    if (error.$metadata) {
      console.error('Metadata:', {
        httpStatusCode: error.$metadata.httpStatusCode,
        requestId: error.$metadata.requestId
      });
    }
    process.exit(1);
  }
}

// Run the check
checkS3Credentials();
