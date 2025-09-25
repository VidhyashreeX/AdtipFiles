// src/components/common/AccessibilityWrapper.tsx - Accessibility enhancement component

import React from 'react';
import {
  View,
  ViewProps,
  AccessibilityRole,
  AccessibilityState,
  AccessibilityProps,
} from 'react-native';

interface AccessibilityWrapperProps extends Omit<ViewProps, 'role'> {
  children: React.ReactNode;
  role?: AccessibilityRole;
  label?: string;
  hint?: string;
  state?: AccessibilityState;
  live?: 'none' | 'polite' | 'assertive';
  value?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  disabled?: boolean;
  selected?: boolean;
  expanded?: boolean;
  checked?: boolean | 'mixed';
  busy?: boolean;
  testID?: string;
}

export const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({
  children,
  role,
  label,
  hint,
  state,
  live = 'none',
  value,
  disabled = false,
  selected = false,
  expanded,
  checked,
  busy = false,
  testID,
  ...props
}) => {
  // Build accessibility props
  const accessibilityProps: any = {};

  if (role) accessibilityProps.accessibilityRole = role;
  if (label) accessibilityProps.accessibilityLabel = label;
  if (hint) accessibilityProps.accessibilityHint = hint;
  if (live !== 'none') accessibilityProps.accessibilityLiveRegion = live;
  if (testID) accessibilityProps.testID = testID;

  // Build accessibility state
  const accessibilityState: AccessibilityState = {
    disabled,
    selected,
    busy,
    ...state,
  };

  if (expanded !== undefined) accessibilityState.expanded = expanded;
  if (checked !== undefined) accessibilityState.checked = checked;

  accessibilityProps.accessibilityState = accessibilityState;

  // Build accessibility value
  if (value) {
    accessibilityProps.accessibilityValue = value;
  }

  return (
    <View {...props} {...accessibilityProps}>
      {children}
    </View>
  );
};

// Predefined accessibility wrappers for common components
export const ButtonAccessibility: React.FC<Omit<AccessibilityWrapperProps, 'role'> & { loading?: boolean }> = ({
  loading,
  disabled,
  ...props
}) => (
  <AccessibilityWrapper
    role="button"
    disabled={disabled || loading}
    busy={loading}
    {...props}
  />
);

export const TextInputAccessibility: React.FC<Omit<AccessibilityWrapperProps, 'role'> & { error?: boolean }> = ({
  error,
  ...props
}) => (
  <AccessibilityWrapper
    role="none" // TextInput has its own accessibility
    hint={error ? `${props.hint}. Error: ${error}` : props.hint}
    {...props}
  />
);

export const ImageAccessibility: React.FC<Omit<AccessibilityWrapperProps, 'role'>> = (props) => (
  <AccessibilityWrapper
    role="image"
    {...props}
  />
);

export const HeaderAccessibility: React.FC<Omit<AccessibilityWrapperProps, 'role'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }> = ({
  level = 1,
  ...props
}) => (
  <AccessibilityWrapper
    role="header"
    {...props}
  />
);

export const ListAccessibility: React.FC<Omit<AccessibilityWrapperProps, 'role'>> = (props) => (
  <AccessibilityWrapper
    role="list"
    {...props}
  />
);

export const ListItemAccessibility: React.FC<Omit<AccessibilityWrapperProps, 'role'>> = (props) => (
  <AccessibilityWrapper
    role="none" // listitem role not available in React Native
    {...props}
  />
);

export const TabAccessibility: React.FC<Omit<AccessibilityWrapperProps, 'role'>> = (props) => (
  <AccessibilityWrapper
    role="tab"
    {...props}
  />
);

export const TabListAccessibility: React.FC<Omit<AccessibilityWrapperProps, 'role'>> = (props) => (
  <AccessibilityWrapper
    role="tablist"
    {...props}
  />
);

export const AlertAccessibility: React.FC<Omit<AccessibilityWrapperProps, 'role' | 'live'>> = (props) => (
  <AccessibilityWrapper
    role="alert"
    live="assertive"
    {...props}
  />
);

export const StatusAccessibility: React.FC<Omit<AccessibilityWrapperProps, 'role' | 'live'>> = (props) => (
  <AccessibilityWrapper
    role="none"
    live="polite"
    {...props}
  />
);

export default AccessibilityWrapper;