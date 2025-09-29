const fs = require('fs');
const path = require('path');

console.log('Testing CPX Research provider fix...');

const homeScreenPath = path.join(__dirname, 'Adtip', 'src', 'screens', 'home', 'HomeScreen.tsx');

try {
  const content = fs.readFileSync(homeScreenPath, 'utf8');
  
  // Check imports
  const hasCorrectImport = content.includes("import SurveyBanner from '../../components/home/SurveyBanner';");
  const hasContextProvider = content.includes("import { CPXResearchProvider } from '../../contexts/CPXResearchContext';");
  
  // Check provider usage
  const hasProviderWrapper = content.includes('<CPXResearchProvider>');
  const hasClosingProvider = content.includes('</CPXResearchProvider>');
  
  // Check SurveyBanner props
  const hasSurveyBannerProps = content.includes('isPremium={isPremium}') && 
                               content.includes('onRewardEarned=');
  
  console.log('✅ Import checks:');
  console.log(`  - SurveyBanner import: ${hasCorrectImport ? '✅' : '❌'}`);
  console.log(`  - CPXResearchProvider import: ${hasContextProvider ? '✅' : '❌'}`);
  
  console.log('✅ Provider wrapper checks:');
  console.log(`  - Provider opening tag: ${hasProviderWrapper ? '✅' : '❌'}`);
  console.log(`  - Provider closing tag: ${hasClosingProvider ? '✅' : '❌'}`);
  
  console.log('✅ SurveyBanner props:');
  console.log(`  - Has required props: ${hasSurveyBannerProps ? '✅' : '❌'}`);
  
  if (hasCorrectImport && hasContextProvider && hasProviderWrapper && hasClosingProvider && hasSurveyBannerProps) {
    console.log('\n🎉 CPX Research provider fix appears to be successful!');
    console.log('The "useCPXResearch must be used within a CPXResearchProvider" error should now be resolved.');
  } else {
    console.log('\n⚠️ Some issues may still exist. Please check the implementation.');
  }
  
} catch (error) {
  console.error('Error reading HomeScreen.tsx:', error.message);
}