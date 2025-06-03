import {StyleSheet, Text, View, TouchableOpacity, Image} from 'react-native';
import {ChevronRight} from 'lucide-react-native';

interface PromotionCardProps {
  title: string;
  description: string;
  image?: string;
  buttonText?: string;
  onPress: () => void;
  backgroundColor?: string;
  gradientColors?: string[];
}

export default function PromotionCard({
  title,
  description,
  image,
  buttonText = 'Learn More',
  onPress,
  backgroundColor = '#E1F5FE',
}: PromotionCardProps) {
  return (
    <View style={[styles.container, {backgroundColor}]}>
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          {buttonText && (
            <TouchableOpacity style={styles.button} onPress={onPress}>
              <Text style={styles.buttonText}>{buttonText}</Text>
              <ChevronRight size={16} color="#FF0000" />
            </TouchableOpacity>
          )}
        </View>

        {image && (
          <Image
            source={{uri: image}}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF0000',
    marginRight: 4,
  },
  image: {
    width: 100,
    height: 100,
    marginLeft: 12,
  },
});
