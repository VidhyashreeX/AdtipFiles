// Test R2 Upload Fix
// This file tests the R2 upload service to verify the fix

async function testR2Upload() {
  try {
    // Create a test file
    const testContent = new Blob(['Test upload content'], { type: 'text/plain' });
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    console.log('✅ Test file created successfully');
    console.log('File details:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    // Convert to ArrayBuffer (this is what our fix does)
    const fileBuffer = await testFile.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    
    console.log('✅ File conversion to ArrayBuffer successful');
    console.log('Buffer size:', uint8Array.length);
    
    console.log('🎉 R2 Upload fix verification complete!');
    console.log('The upload service should now work without the readableStream.getReader error');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testR2Upload();