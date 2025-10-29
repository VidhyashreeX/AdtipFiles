// src/stores/index.ts - Centralized store exports
export * from './auth.store';
export * from './ui.store';
export * from './cart.store';
export * from './theme.store';
export * from './notification.store';

// Re-export Zustand utilities for convenience
export { create, createStore } from 'zustand';
export { devtools, persist, createJSONStorage } from 'zustand/middleware';