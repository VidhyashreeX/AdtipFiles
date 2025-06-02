declare module 'react-native-vector-icons/Ionicons' {
  import { IconProps } from 'react-native-vector-icons/Icon';
  import { Component } from 'react';
  
  export interface IoniconsProps extends IconProps {}
  
  export default class Ionicons extends Component<IoniconsProps> {}
}

declare module 'react-native-vector-icons/MaterialIcons' {
  import { IconProps } from 'react-native-vector-icons/Icon';
  import { Component } from 'react';
  
  export interface MaterialIconsProps extends IconProps {}
  
  export default class MaterialIcons extends Component<MaterialIconsProps> {}
}

declare module 'react-native-vector-icons/FontAwesome' {
  import { IconProps } from 'react-native-vector-icons/Icon';
  import { Component } from 'react';
  
  export interface FontAwesomeProps extends IconProps {}
  
  export default class FontAwesome extends Component<FontAwesomeProps> {}
}

declare module 'react-native-vector-icons/FontAwesome5' {
  import { IconProps } from 'react-native-vector-icons/Icon';
  import { Component } from 'react';
  
  export interface FontAwesome5Props extends IconProps {}
  
  export default class FontAwesome5 extends Component<FontAwesome5Props> {}
}

declare module 'react-native-vector-icons/Feather' {
  import { IconProps } from 'react-native-vector-icons/Icon';
  import { Component } from 'react';
  
  export interface FeatherProps extends IconProps {}
  
  export default class Feather extends Component<FeatherProps> {}
}

declare module 'react-native-vector-icons/Icon' {
  import { Component } from 'react';
  import { TextStyle, ViewStyle } from 'react-native';
  
  export interface IconProps {
    size?: number;
    name: string;
    color?: string;
    style?: TextStyle | ViewStyle;
    onPress?: () => void;
    allowFontScaling?: boolean;
  }
  
  export default class Icon extends Component<IconProps> {}
}
