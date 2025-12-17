import { AppRegistry } from 'react-native';
import App from './App'; // Using the ORIGINAL App.tsx
import appConfig from './app.json';

console.log('Starting ORIGINAL AdTip application...');

const appName = appConfig.name;

// Register the original app for web
AppRegistry.registerComponent(appName, () => App);

// Run the original app
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});

console.log('Original AdTip app registered and running!');