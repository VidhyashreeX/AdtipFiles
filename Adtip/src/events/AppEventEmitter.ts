import { EventEmitter } from 'events';

class AppEventEmitter extends EventEmitter {}

export const appEventEmitter = new AppEventEmitter(); 