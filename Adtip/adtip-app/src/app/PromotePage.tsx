import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const genders = ['Male', 'Female', 'Others', 'All'];

export default function PromotePost() {
  const [location, setLocation] = useState('');
  const [gender, setGender] = useState('All');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(65);
  const [payPerView, setPayPerView] = useState('');
  const [reach, setReach] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [platformFee, setPlatformFee] = useState('');
  const [totalPay, setTotalPay] = useState('');

  const calculateDays = () =>
    Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));

  const calculateFees = () => {
    const total = (parseFloat(payPerView || '0') * parseInt(reach || '0')) || 0;
    const calculatedPlatformFee = total * 0.1;
    setPlatformFee(calculatedPlatformFee.toFixed(2));
    setTotalPay((total + calculatedPlatformFee).toFixed(2));
  };

  // Recalculate fees whenever payPerView or reach changes
  React.useEffect(() => {
    calculateFees();
  }, [payPerView, reach]);

  // Handle minAge change and ensure it doesn't exceed maxAge
  const handleMinAgeChange = (value: number) => {
    if (value <= maxAge) {
      setMinAge(value);
    } else {
      setMinAge(maxAge);
    }
  };

  // Handle maxAge change and ensure it isn't less than minAge
  const handleMaxAgeChange = (value: number) => {
    if (value >= minAge) {
      setMaxAge(value);
    } else {
      setMaxAge(minAge);
    }
  };

  // Handle Promote button click
  const handlePromote = () => {
    // The image URL to pass to index.tsx (replace with your actual image source)
    const promotedImage = 'https://images.pexels.com/photos/1237119/pexels-photo-1237119.jpeg';
    
    // Redirect to index.tsx and pass the image URL as a parameter
    router.push({
      pathname: '/',
      params: { promotedImage },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.postWithoutPromoteButton}
          onPress={() => router.push('/')} // Redirect to index.tsx
        >
          <Text style={styles.postWithoutPromoteText}>Post without Promote</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Which Location do you reach this post (Target Location)?</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter location"
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.title}>Target Gender</Text>
      <View style={styles.genderRow}>
        {genders.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
            onPress={() => setGender(g)}
          >
            <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.title}>Target Age Range</Text>
      <View style={styles.sliderWrap}>
        <View style={styles.ageSliderRow}>
          <View style={styles.sliderContainer}>
            <Text style={styles.ageLabel}>Min Age: {minAge}</Text>
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={100}
              step={1}
              value={minAge}
              onValueChange={handleMinAgeChange}
            />
          </View>
          <View style={styles.sliderContainer}>
            <Text style={styles.ageLabel}>Max Age: {maxAge}</Text>
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={100}
              step={1}
              value={maxAge}
              onValueChange={handleMaxAgeChange}
            />
          </View>
        </View>
      </View>

      <Text style={styles.title}>How Much will you pay per View?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 0.01"
        keyboardType="numeric"
        value={payPerView}
        onChangeText={setPayPerView}
      />

      <Text style={styles.title}>How many people do you want to reach?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 1000"
        keyboardType="numeric"
        value={reach}
        onChangeText={setReach}
      />

      <Text style={styles.title}>Campaign start date</Text>
      <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateInput}>
        <Text>{startDate.toDateString()}</Text>
        <Ionicons name="calendar" size={20} color="#333" />
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (selected) setStartDate(selected);
          }}
        />
      )}

      <Text style={styles.title}>Campaign end date</Text>
      <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateInput}>
        <Text>{endDate.toDateString()}</Text>
        <Ionicons name="calendar" size={20} color="#333" />
      </TouchableOpacity>
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (selected) setEndDate(selected);
          }}
        />
      )}

      <Text style={styles.title}>How many days to continue Campaign?</Text>
      <TextInput style={styles.input} value={calculateDays().toString()} editable={false} />

      <Text style={styles.title}>Platform Fee</Text>
      <TextInput
        style={styles.input}
        value={platformFee}
        onChangeText={setPlatformFee}
        keyboardType="numeric"
      />

      <Text style={styles.title}>Total Pay</Text>
      <TextInput
        style={styles.input}
        value={totalPay}
        onChangeText={setTotalPay}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.submitButton} onPress={handlePromote}>
        <Text style={styles.submitText}>Promote</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 20, // Move content down by 1 inch (96 pixels)
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#111827',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    marginBottom: 16,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  genderBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderBtnActive: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  genderText: {
    fontSize: 14,
    color: '#374151',
  },
  genderTextActive: {
    color: '#065f46',
    fontWeight: 'bold',
  },
  sliderWrap: {
    marginBottom: 16,
  },
  ageSliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  ageLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postWithoutPromoteButton: {
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  postWithoutPromoteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});