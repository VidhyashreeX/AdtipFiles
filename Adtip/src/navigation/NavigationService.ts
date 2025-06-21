import {createNavigationContainerRef} from '@react-navigation/native';
import { MainNavigatorParamList } from '../types/navigation';

// Type the navigationRef with your RootStackParamList
export const navigationRef = createNavigationContainerRef<MainNavigatorParamList>();

// Update helper functions to be more type-safe or rely on direct, typed navigationRef usage
export function navigate<RouteName extends keyof MainNavigatorParamList>(
  name: RouteName,
  params?: MainNavigatorParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params as any);
  }
}

export function resetTo<RouteName extends keyof MainNavigatorParamList>(
  routeName: RouteName,
  // This assumes params are optional or match the structure.
  // For routes that are navigators (like 'Main' or 'Auth'), params would be NavigatorScreenParams
  params?: MainNavigatorParamList[RouteName] 
) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      // @ts-ignore
      routes: [{name: routeName, params: params}],
    });
  }
}
