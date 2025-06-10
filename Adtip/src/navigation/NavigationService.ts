import {createNavigationContainerRef} from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation'; // Import the updated RootStackParamList

// Type the navigationRef with your RootStackParamList
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Update helper functions to be more type-safe or rely on direct, typed navigationRef usage
export function navigate<RouteName extends keyof RootStackParamList>(
  // The type for params needs to be conditional based on whether the route expects params
  ...args: undefined extends RootStackParamList[RouteName] 
    ? [RouteName] | [RouteName, RootStackParamList[RouteName]] 
    // @ts-ignore - This complex conditional type for args can sometimes still need an ignore
    // depending on the exact overload structure React Navigation's navigate expects.
    // A simpler approach for the helper might be to type name and params separately.
    : [RouteName, RootStackParamList[RouteName]]
) {
  if (navigationRef.isReady()) {
    // @ts-ignore
    navigationRef.navigate(...args);
  }
}

export function resetTo<RouteName extends keyof RootStackParamList>(
  routeName: RouteName,
  // This assumes params are optional or match the structure.
  // For routes that are navigators (like 'Main' or 'Auth'), params would be NavigatorScreenParams
  params?: RootStackParamList[RouteName] 
) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      // @ts-ignore
      routes: [{name: routeName, params: params}],
    });
  }
}
