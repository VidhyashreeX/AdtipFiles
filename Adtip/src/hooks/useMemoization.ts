import { useMemo, useCallback, useRef, useEffect } from 'react';
import Logger from '../utils/logger';

// Simple shallow equality check
const shallowEqual = (obj1: any, obj2: any): boolean => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
};

/**
 * Enhanced useMemo with deep comparison and performance tracking
 */
export const useDeepMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T => {
  const prevDeps = useRef<React.DependencyList | undefined>(undefined);
  const prevResult = useRef<T | undefined>(undefined);
  const computeCount = useRef(0);

  return useMemo(() => {
    const startTime = performance.now();
    
    // Check if dependencies have changed using deep comparison
    const depsChanged = !prevDeps.current || 
      prevDeps.current.length !== deps.length ||
      !shallowEqual(prevDeps.current, deps);

    if (depsChanged || prevResult.current === undefined) {
      computeCount.current++;
      const result = factory();
      prevDeps.current = deps;
      prevResult.current = result;
      
      const endTime = performance.now();
      
      if (__DEV__ && debugName) {
        Logger.debug('useMemoization', `useDeepMemo:${debugName} - Computed #${computeCount.current} in ${(endTime - startTime).toFixed(2)}ms`);
      }

      return result;
    }

    if (__DEV__ && debugName) {
      Logger.debug('useMemoization', `useDeepMemo:${debugName} - Cache hit #${computeCount.current}`);
    }

    return prevResult.current;
  }, deps);
};

/**
 * Enhanced useCallback with performance tracking
 */
export const useTrackedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  debugName?: string
): T => {
  const callCount = useRef(0);
  const createCount = useRef(0);

  return useCallback((...args: Parameters<T>) => {
    callCount.current++;
    
    if (__DEV__ && debugName && callCount.current % 10 === 0) {
      Logger.debug('useMemoization', `useTrackedCallback:${debugName} - Called ${callCount.current} times, recreated ${createCount.current} times`);
    }
    
    return callback(...args);
  }, deps) as T;
};

/**
 * Memoize expensive computations with TTL (Time To Live)
 */
export const useMemoWithTTL = <T>(
  factory: () => T,
  deps: React.DependencyList,
  ttlMs: number = 5000,
  debugName?: string
): T => {
  const cache = useRef<{
    value: T;
    timestamp: number;
    deps: React.DependencyList;
  } | undefined>(undefined);

  return useMemo(() => {
    const now = Date.now();
    
    // Check if cache is valid
    if (cache.current) {
      const isExpired = now - cache.current.timestamp > ttlMs;
      const depsChanged = !shallowEqual(cache.current.deps, deps);
      
      if (!isExpired && !depsChanged) {
        if (__DEV__ && debugName) {
          Logger.debug('useMemoization', `useMemoWithTTL:${debugName} - Cache hit (${Math.round((ttlMs - (now - cache.current.timestamp)) / 1000)}s remaining)`);
        }
        return cache.current.value;
      }
    }

    // Compute new value
    const startTime = performance.now();
    const value = factory();
    const endTime = performance.now();
    
    cache.current = {
      value,
      timestamp: now,
      deps: [...deps],
    };

    if (__DEV__ && debugName) {
      Logger.debug('useMemoization', `useMemoWithTTL:${debugName} - Computed in ${(endTime - startTime).toFixed(2)}ms`);
    }

    return value;
  }, deps);
};

/**
 * Memoize component props to prevent unnecessary re-renders
 */
export const useMemoizedProps = <T extends Record<string, any>>(
  props: T,
  debugName?: string
): T => {
  const prevProps = useRef<T | undefined>(undefined);
  const memoCount = useRef(0);

  return useMemo(() => {
    // Check if props have changed
    if (!prevProps.current || !shallowEqual(prevProps.current, props)) {
      memoCount.current++;
      prevProps.current = props;
      
      if (__DEV__ && debugName) {
        Logger.debug('useMemoization', `useMemoizedProps:${debugName} - Props changed #${memoCount.current}`);
      }

      return props;
    }

    if (__DEV__ && debugName && memoCount.current % 10 === 0) {
      Logger.debug('useMemoization', `useMemoizedProps:${debugName} - Props memoized ${memoCount.current} times`);
    }

    return prevProps.current;
  }, Object.values(props));
};

/**
 * Memoize array transformations
 */
export const useMemoizedArray = <T, R>(
  array: T[],
  transform: (item: T, index: number) => R,
  deps: React.DependencyList = [],
  debugName?: string
): R[] => {
  return useMemo(() => {
    const startTime = performance.now();
    const result = array.map(transform);
    const endTime = performance.now();
    
    if (__DEV__ && debugName) {
      Logger.debug('useMemoization', `useMemoizedArray:${debugName} - Transformed ${array.length} items in ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  }, [array.length, ...array.map(item => typeof item === 'object' ? JSON.stringify(item) : item), ...deps]);
};

/**
 * Memoize filtered arrays
 */
export const useMemoizedFilter = <T>(
  array: T[],
  predicate: (item: T, index: number) => boolean,
  deps: React.DependencyList = [],
  debugName?: string
): T[] => {
  return useMemo(() => {
    const startTime = performance.now();
    const result = array.filter(predicate);
    const endTime = performance.now();
    
    if (__DEV__ && debugName) {
      Logger.debug('useMemoization', `useMemoizedFilter:${debugName} - Filtered ${array.length} -> ${result.length} items in ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  }, [array.length, ...array.map(item => typeof item === 'object' ? JSON.stringify(item) : item), ...deps]);
};

/**
 * Memoize sorted arrays
 */
export const useMemoizedSort = <T>(
  array: T[],
  compareFn?: (a: T, b: T) => number,
  deps: React.DependencyList = [],
  debugName?: string
): T[] => {
  return useMemo(() => {
    const startTime = performance.now();
    const result = [...array].sort(compareFn);
    const endTime = performance.now();
    
    if (__DEV__ && debugName) {
      Logger.debug('useMemoization', `useMemoizedSort:${debugName} - Sorted ${array.length} items in ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  }, [array.length, ...array.map(item => typeof item === 'object' ? JSON.stringify(item) : item), ...deps]);
};

/**
 * Memoize grouped data
 */
export const useMemoizedGroupBy = <T, K extends string | number>(
  array: T[],
  keySelector: (item: T) => K,
  deps: React.DependencyList = [],
  debugName?: string
): Record<K, T[]> => {
  return useMemo(() => {
    const startTime = performance.now();
    const result = array.reduce((groups, item) => {
      const key = keySelector(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
    const endTime = performance.now();
    
    if (__DEV__ && debugName) {
      Logger.debug('useMemoization', `useMemoizedGroupBy:${debugName} - Grouped ${array.length} items into ${Object.keys(result).length} groups in ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  }, [array.length, ...array.map(item => typeof item === 'object' ? JSON.stringify(item) : item), ...deps]);
};

/**
 * Memoize expensive calculations with dependency tracking
 */
export const useExpensiveCalculation = <T>(
  calculation: () => T,
  deps: React.DependencyList,
  threshold: number = 10, // ms
  debugName?: string
): T => {
  const calculationCount = useRef(0);
  const totalTime = useRef(0);

  return useMemo(() => {
    const startTime = performance.now();
    const result = calculation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    calculationCount.current++;
    totalTime.current += duration;
    
    if (__DEV__ && debugName) {
      if (duration > threshold) {
        Logger.warn('useMemoization', `useExpensiveCalculation:${debugName} - Slow calculation: ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
      }

      if (calculationCount.current % 5 === 0) {
        Logger.debug('useMemoization', `useExpensiveCalculation:${debugName} - Average: ${(totalTime.current / calculationCount.current).toFixed(2)}ms over ${calculationCount.current} calculations`);
      }
    }
    
    return result;
  }, deps);
};

/**
 * Memoize component render count for debugging
 */
export const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;

    if (__DEV__) {
      Logger.debug('useMemoization', `${componentName} - Render #${renderCount.current} (+${timeSinceLastRender}ms)`);
    }
  });

  return renderCount.current;
};

/**
 * Create a memoized selector for complex state
 */
export const createMemoizedSelector = <State, Result>(
  selector: (state: State) => Result,
  debugName?: string
) => {
  let lastState: State;
  let lastResult: Result;
  let callCount = 0;
  let hitCount = 0;

  return (state: State): Result => {
    callCount++;
    
    if (lastState !== undefined && shallowEqual(lastState, state)) {
      hitCount++;
      
      if (__DEV__ && debugName && callCount % 10 === 0) {
        Logger.debug('useMemoization', `createMemoizedSelector:${debugName} - Hit rate: ${((hitCount / callCount) * 100).toFixed(1)}% (${hitCount}/${callCount})`);
      }
      
      return lastResult;
    }

    const startTime = performance.now();
    const result = selector(state);
    const endTime = performance.now();
    
    lastState = state;
    lastResult = result;

    if (__DEV__ && debugName) {
      Logger.debug('useMemoization', `createMemoizedSelector:${debugName} - Computed in ${(endTime - startTime).toFixed(2)}ms`);
    }

    return result;
  };
};
