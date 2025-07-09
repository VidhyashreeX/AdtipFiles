import React from 'react'
import { TouchableOpacity, ActivityIndicator, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'

interface Props {
  isDndEnabled: boolean
  onToggle: () => void
  isLoading: boolean
  colors: any
  size?: number
}

const DndToggleSwitch: React.FC<Props> = ({ isDndEnabled, onToggle, isLoading, colors, size = 50 }) => {
  const switchWidth = size
  const switchHeight = size * 0.52
  const circleSize = switchHeight - 4
  const circleOffset = 2

  return (
    <TouchableOpacity
      style={{
        width: switchWidth,
        height: switchHeight,
        borderRadius: switchHeight / 2,
        backgroundColor: isDndEnabled ? '#EF4444' : '#22C55E',
        justifyContent: 'center',
        paddingHorizontal: circleOffset,
        opacity: isLoading ? 0.6 : 1,
      }}
      onPress={onToggle}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : (
        <View
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            backgroundColor: '#FFFFFF',
            transform: [{ translateX: isDndEnabled ? 0 : switchWidth - circleSize - circleOffset * 2 }],
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 2,
          }}
        >
          <Icon name="moon" size={12} color="#666" />
        </View>
      )}
    </TouchableOpacity>
  )
}

export default DndToggleSwitch 