import {useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Switch} from 'react-native';
import {router, useRouter} from 'expo-router';
import {Camera, Image as ImageIcon, X} from 'lucide-react-native';

export default function TipTubeUploadScreen() {
  const router = useRouter();
  const [isEarningEnabled, setIsEarningEnabled] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false); // State to toggle between upload and earnings views

  const handleCameraPress = () => {
    console.log('Opening camera to record video');
  };

  const handleGalleryPress = () => {
    console.log('Picking video from gallery');
  };

  const handleUploadPress = () => {
    console.log('Uploading video');
  };

  const handleEarningToggle = () => {
    if (!isEarningEnabled) {
      setShowEarnings(true); // Switch to earnings view
    }
    setIsEarningEnabled(!isEarningEnabled);
  };

  const handleBackFromEarnings = () => {
    setShowEarnings(false); // Return to upload view
    setIsEarningEnabled(false); // Reset toggle
  };

  if (showEarnings) {
    // Earnings Screen (Image 2)
    return (
      <View style={earningStyles.container}>
        <View style={earningStyles.header}>
          <TouchableOpacity onPress={handleBackFromEarnings}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={earningStyles.headerTitle}>Our Packages</Text>
        </View>

        <View style={earningStyles.packagesContainer}>
          <View style={[earningStyles.packageCard, earningStyles.freeCard]}>
            <Text style={[earningStyles.packageTitle, {color: '#ff4d4f'}]}>
              Free
            </Text>
            <View style={earningStyles.packageItem}>
              <Text style={[earningStyles.checkmark, {color: '#ff4d4f'}]}>
                ✗
              </Text>
              <Text style={earningStyles.packageText}>
                No earnings for uploads on TipTube & TipShort
              </Text>
            </View>
            <View style={earningStyles.packageItem}>
              <Text style={[earningStyles.checkmark, {color: '#24d05a'}]}>
                ✓
              </Text>
              <Text style={earningStyles.packageText}>
                Free Video upload only
              </Text>
            </View>
            <View style={earningStyles.packageItem}>
              <Text style={[earningStyles.checkmark, {color: '#24d05a'}]}>
                ✓
              </Text>
              <Text style={earningStyles.packageText}>
                Earn 0.06 paisa per ad view
              </Text>
            </View>
            <View style={earningStyles.packageItem}>
              <Text style={[earningStyles.checkmark, {color: '#24d05a'}]}>
                ✓
              </Text>
              <Text style={earningStyles.packageText}>
                Fan Call to earn 0.60 paisa (coming soon)
              </Text>
            </View>
            <View style={earningStyles.packageItem}>
              <Text style={[earningStyles.checkmark, {color: '#24d05a'}]}>
                ✓
              </Text>
              <Text style={earningStyles.packageText}>
                Fan Video to earn 1 rs/- (coming soon)
              </Text>
            </View>
          </View>

          <View style={[earningStyles.packageCard, earningStyles.premiumCard]}>
            <Text style={[earningStyles.packageTitle, {color: '#24d05a'}]}>
              Premium
            </Text>
            <View style={earningStyles.packageItem}>
              <Text style={[earningStyles.checkmark, {color: '#24d05a'}]}>
                ✓
              </Text>
              <Text style={earningStyles.packageText}>
                Earnings for uploads on TipTube & TipShort
              </Text>
            </View>
            <View style={earningStyles.packageItem}>
              <Text style={[earningStyles.checkmark, {color: '#24d05a'}]}>
                ✓
              </Text>
              <Text style={earningStyles.packageText}>
                Free & Paid video upload
              </Text>
            </View>
            <View style={earningStyles.packageItem}>
              <Text style={[earningStyles.checkmark, {color: '#24d05a'}]}>
                ✓
              </Text>
              <Text style={earningStyles.packageText}>
                To earn upto 10000/- rs per ad view
              </Text>
            </View>
            <View style={earningStyles.packageItem}>
              <Text style={[earningStyles.checkmark, {color: '#24d05a'}]}>
                ✓
              </Text>
              <Text style={earningStyles.packageText}>
                Fan call to earn 4 rs/- (coming soon)
              </Text>
            </View>
            <View style={earningStyles.packageItem}>
              <Text style={[earningStyles.checkmark, {color: '#24d05a'}]}>
                ✓
              </Text>
              <Text style={earningStyles.packageText}>
                Fan Video to earn 8 rs/- (coming soon)
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={earningStyles.buyButton}>
          <Text style={earningStyles.buyButtonText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Upload Screen (Image 1)
  return (
    <View style={uploadStyles.container}>
      <View style={uploadStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={uploadStyles.headerTitle}>Upload TipTube Video</Text>
      </View>

      <View style={uploadStyles.videoPreview}>
        <Text style={uploadStyles.previewText}>Select TipTube Video</Text>
      </View>

      <TouchableOpacity style={uploadStyles.button} onPress={handleCameraPress}>
        <Camera size={20} color="#fff" style={uploadStyles.buttonIcon} />
        <Text style={uploadStyles.buttonText}>Open Camera & Record</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[uploadStyles.button, uploadStyles.galleryButton]}
        onPress={handleGalleryPress}>
        <ImageIcon size={20} color="#fff" style={uploadStyles.buttonIcon} />
        <Text style={uploadStyles.buttonText}>Pick Video from Gallery</Text>
      </TouchableOpacity>

      <View style={uploadStyles.earningContainer}>
        <Text style={uploadStyles.earningText}>Do you want to earn money?</Text>
        <Switch
          value={isEarningEnabled}
          onValueChange={handleEarningToggle}
          trackColor={{false: '#767577', true: '#24d05a'}}
          thumbColor={isEarningEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      <TouchableOpacity
        style={uploadStyles.uploadButton}
        onPress={handleUploadPress}>
        <Text style={uploadStyles.uploadButtonText}>Upload</Text>
      </TouchableOpacity>
    </View>
  );
}

const uploadStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6b48ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 16,
  },
  videoPreview: {
    backgroundColor: '#e6e1ff',
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  previewText: {
    fontSize: 16,
    color: '#6b48ff',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6b48ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  galleryButton: {
    backgroundColor: '#1e3a8a',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  earningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  earningText: {
    fontSize: 16,
    color: '#1f2937',
  },
  uploadButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

const earningStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6b48ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 16,
  },
  packagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  freeCard: {
    borderColor: '#ff4d4f',
    borderWidth: 1,
  },
  premiumCard: {
    borderColor: '#24d05a',
    borderWidth: 1,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkmark: {
    fontSize: 16,
    marginRight: 8,
  },
  packageText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  buyButton: {
    backgroundColor: '#24d05a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
