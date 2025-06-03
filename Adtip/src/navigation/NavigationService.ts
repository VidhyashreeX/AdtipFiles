import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    // @ts-ignore
    navigationRef.navigate(name, params);
  }
}

export function resetTo(routeName: string) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{name: routeName as never}],
    });
  }
}
