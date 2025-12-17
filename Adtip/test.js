console.log('JavaScript bundle is loading...');

// Test if DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM is ready');
  
  const root = document.getElementById('root');
  if (root) {
    console.log('Root element found');
    root.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center;">
        <h1 style="color: #4CAF50;">✅ JavaScript is Working!</h1>
        <p>The webpack bundle is loading and executing properly.</p>
        <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>🎯 AdTip Web App</h2>
          <p>Ready to load React components!</p>
        </div>
      </div>
    `;
    console.log('Content injected successfully');
  } else {
    console.error('Root element not found');
  }
});

// Also try immediate execution in case DOM is already ready
const root = document.getElementById('root');
if (root) {
  console.log('Root element found immediately');
  root.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center;">
      <h1 style="color: #4CAF50;">✅ JavaScript is Working!</h1>
      <p>The webpack bundle is loading and executing properly.</p>
      <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2>🎯 AdTip Web App</h2>
        <p>Ready to load React components!</p>
      </div>
    </div>
  `;
  console.log('Content injected immediately');
}