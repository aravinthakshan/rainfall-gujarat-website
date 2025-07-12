const fs = require('fs');
const path = require('path');

async function testTmpWrite() {
  console.log('Testing /tmp directory write access...');
  
  const testFile = '/tmp/test-write-access.txt';
  const testContent = 'Test write access to /tmp directory';
  
  try {
    // Test writing to /tmp
    await fs.promises.writeFile(testFile, testContent);
    console.log('✅ Successfully wrote to /tmp directory');
    
    // Test reading from /tmp
    const readContent = await fs.promises.readFile(testFile, 'utf8');
    console.log('✅ Successfully read from /tmp directory');
    
    // Clean up
    await fs.promises.unlink(testFile);
    console.log('✅ Successfully deleted test file from /tmp');
    
    return true;
  } catch (error) {
    console.error('❌ Error accessing /tmp directory:', error.message);
    console.error('Error code:', error.code);
    console.error('Error path:', error.path);
    
    // Try alternative directories
    const alternatives = [
      '/var/tmp',
      '/tmp',
      process.cwd() + '/tmp',
      './tmp'
    ];
    
    console.log('\nTesting alternative directories...');
    for (const altDir of alternatives) {
      try {
        const testFileAlt = path.join(altDir, 'test-write-access.txt');
        await fs.promises.writeFile(testFileAlt, testContent);
        console.log(`✅ Successfully wrote to ${altDir}`);
        await fs.promises.unlink(testFileAlt);
        console.log(`✅ Successfully deleted from ${altDir}`);
        return true;
      } catch (altError) {
        console.log(`❌ Cannot write to ${altDir}: ${altError.message}`);
      }
    }
    
    return false;
  }
}

// Run the test
testTmpWrite().then(success => {
  if (success) {
    console.log('\n🎉 File system test passed! PDF processing should work.');
  } else {
    console.log('\n💥 File system test failed! PDF processing will not work in this environment.');
    console.log('Consider using external services or client-side processing.');
  }
}).catch(error => {
  console.error('Test failed with error:', error);
}); 