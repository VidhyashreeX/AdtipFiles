/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import firebase from '@react-native-firebase/app';
if (!firebase.apps.length) {
  console.log('Initializing Firebase app in index.js...');
  try {
    firebase.initializeApp();
    console.log('Firebase app initialized successfully from index.js.');
  } catch (e) {
    console.error('Firebase initialization failed in index.js:', e);
  }
} else {
  console.log('Firebase app already initialized (from native or earlier JS) in index.js.');
}

AppRegistry.registerComponent(appName, () => App);
