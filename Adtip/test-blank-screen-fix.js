/**
 * Test script to verify the blank screen fix
 * This script helps diagnose and test the CallKeep initialization issues
 */

// Test 1: Verify CallKeep service can be imported without blocking
console.log('🧪 Test 1: Testing CallKeep service import...');
try {
  const startTime = Date.now();
  
  // This should not block
  import('./src/services/calling/CallKeepService.js').then((module) => {
    const endTime = Date.now();
    console.log(`✅ CallKeep service imported successfully in ${endTime - startTime}ms`);
    
    const CallKeepService = module.default;
    const service = CallKeepService.getInstance();
    
    // Test device detection
    const deviceInfo = service.getDeviceInfo();
    console.log('📱 Device info:', deviceInfo);
    
    // Test emergency disable
    console.log('🚫 Testing emergency disable...');
    CallKeepService.setCallKeepEnabled(false);
    
    // Test initialization with disabled flag
    service.initialize().then((result) => {
      console.log(`🔄 Initialization result with disabled flag: ${result}`);
      
      // Re-enable for normal operation
      CallKeepService.setCallKeepEnabled(true);
      console.log('✅ CallKeep re-enabled');
    }).catch((error) => {
      console.error('❌ Initialization error:', error);
    });
    
  }).catch((error) => {
    console.error('❌ Import error:', error);
  });
  
} catch (error) {
  console.error('❌ Test 1 failed:', error);
}

// Test 2: Verify non-blocking timeout behavior
console.log('🧪 Test 2: Testing timeout behavior...');
const testTimeout = () => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Simulate a potentially blocking operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 1000);
    });
    
    const quickResolve = new Promise((resolve) => {
      setTimeout(() => resolve('Quick success'), 500);
    });
    
    Promise.race([timeoutPromise, quickResolve])
      .then((result) => {
        const endTime = Date.now();
        console.log(`✅ Timeout test completed in ${endTime - startTime}ms with result: ${result}`);
        resolve(true);
      })
      .catch((error) => {
        const endTime = Date.now();
        console.log(`⚠️ Timeout test failed in ${endTime - startTime}ms:`, error.message);
        resolve(false);
      });
  });
};

testTimeout();

// Test 3: Verify setImmediate behavior
console.log('🧪 Test 3: Testing setImmediate behavior...');
const testSetImmediate = () => {
  console.log('📝 Before setImmediate');
  
  setImmediate(() => {
    console.log('✅ setImmediate executed - this should not block UI');
    
    setTimeout(() => {
      console.log('✅ setTimeout after setImmediate executed');
    }, 100);
  });
  
  console.log('📝 After setImmediate (should execute immediately)');
};

testSetImmediate();

// Test 4: Memory and performance check
console.log('🧪 Test 4: Memory and performance check...');
const testPerformance = () => {
  const startMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
  const startTime = Date.now();
  
  // Simulate multiple rapid operations
  for (let i = 0; i < 1000; i++) {
    setImmediate(() => {
      // Lightweight operation
      const temp = { id: i, timestamp: Date.now() };
    });
  }
  
  setTimeout(() => {
    const endTime = Date.now();
    const endMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    const memoryDiff = endMemory - startMemory;
    
    console.log(`✅ Performance test completed:`);
    console.log(`   Time: ${endTime - startTime}ms`);
    console.log(`   Memory change: ${memoryDiff} bytes`);
    
    if (endTime - startTime < 100) {
      console.log('✅ Performance test PASSED - operations completed quickly');
    } else {
      console.log('⚠️ Performance test WARNING - operations took longer than expected');
    }
  }, 200);
};

testPerformance();

console.log('🏁 All tests initiated. Check console output for results.');
console.log('');
console.log('📋 Manual Testing Instructions:');
console.log('1. Run the app on a Vivo device');
console.log('2. Check that the app loads without a blank screen');
console.log('3. Verify that CallKeep initialization logs appear after 3+ seconds');
console.log('4. Confirm that the app remains functional even if CallKeep fails');
console.log('5. Test making calls to ensure the app works with or without CallKeep');
console.log('');
console.log('🚨 Emergency Commands (if issues persist):');
console.log('- To disable CallKeep: CallKeepService.setCallKeepEnabled(false)');
console.log('- To re-enable CallKeep: CallKeepService.setCallKeepEnabled(true)');
console.log('- Check device info: CallKeepService.getInstance().getDeviceInfo()');
