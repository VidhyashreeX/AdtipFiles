/**
 * QuizModal Component
 * 
 * Modal for displaying quiz questions for QUIZ type ads.
 * Features question display, multiple choice options, answer submission,
 * and result feedback.
 * 
 * Features:
 * - Question text display
 * - Multiple choice options (A, B, C, D)
 * - Option selection with visual feedback
 * - Submit button
 * - Correct/Incorrect result display
 * - Bonus payout on correct answer
 * - Close button
 * 
 * @example
 * ```tsx
 * <QuizModal
 *   visible={showQuizModal}
 *   question="What is the capital of France?"
 *   options={['London', 'Paris', 'Berlin', 'Madrid']}
 *   correctAnswer="Paris"
 *   bonusAmount={2.00}
 *   onSubmit={handleQuizSubmit}
 *   onClose={handleQuizClose}
 * />
 * ```
 */

import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface QuizModalProps {
  visible: boolean;
  question: string;
  options: string[];
  correctAnswer?: string; // Optional, for client-side validation
  bonusAmount?: number;
  onSubmit: (selectedAnswer: string) => Promise<{ correct: boolean; earned?: number }>;
  onClose: () => void;
}

const QuizModal: React.FC<QuizModalProps> = ({
  visible,
  question,
  options,
  correctAnswer,
  bonusAmount = 2.0,
  onSubmit,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; earned?: number } | null>(null);

  const optionLabels = ['A', 'B', 'C', 'D'];

  const handleSubmit = async () => {
    if (!selectedOption) return;

    try {
      setIsSubmitting(true);
      const response = await onSubmit(selectedOption);
      setResult(response);
    } catch (error) {
      console.error('Quiz submission error:', error);
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setSelectedOption(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.overlay}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Icon name="quiz" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.headerTitle}>
              {result ? 'Quiz Result' : 'Answer Quiz'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {!result ? (
              <>
                {/* Question */}
                <View style={styles.questionContainer}>
                  <Text style={styles.questionLabel}>Question</Text>
                  <Text style={styles.questionText}>{question}</Text>
                </View>

                {/* Bonus Info */}
                <View style={styles.bonusInfo}>
                  <Icon name="stars" size={20} color="#F59E0B" />
                  <Text style={styles.bonusText}>
                    Answer correctly to earn ₹{bonusAmount.toFixed(2)} bonus!
                  </Text>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsLabel}>Select your answer:</Text>
                  {options.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        selectedOption === option && styles.optionButtonSelected,
                      ]}
                      onPress={() => setSelectedOption(option)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.optionLabel,
                        selectedOption === option && styles.optionLabelSelected,
                      ]}>
                        <Text style={[
                          styles.optionLabelText,
                          selectedOption === option && styles.optionLabelTextSelected,
                        ]}>
                          {optionLabels[index]}
                        </Text>
                      </View>
                      <Text style={[
                        styles.optionText,
                        selectedOption === option && styles.optionTextSelected,
                      ]}>
                        {option}
                      </Text>
                      {selectedOption === option && (
                        <Icon name="check-circle" size={24} color="#4F46E5" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !selectedOption && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!selectedOption || isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <Text style={styles.submitButtonText}>Submitting...</Text>
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Submit Answer</Text>
                      <Icon name="send" size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* Result Display */
              <View style={styles.resultContainer}>
                {result.correct ? (
                  <>
                    <Icon name="check-circle" size={80} color="#10B981" />
                    <Text style={styles.resultTitle}>Correct! 🎉</Text>
                    <Text style={styles.resultText}>
                      Great job! You earned the bonus.
                    </Text>
                    <View style={styles.earnedContainer}>
                      <Icon name="account-balance-wallet" size={24} color="#10B981" />
                      <Text style={styles.earnedAmount}>
                        +₹{(result.earned || bonusAmount).toFixed(2)}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Icon name="cancel" size={80} color="#EF4444" />
                    <Text style={styles.resultTitle}>Incorrect</Text>
                    <Text style={styles.resultText}>
                      Sorry, that's not the correct answer.
                    </Text>
                    {correctAnswer && (
                      <View style={styles.correctAnswerContainer}>
                        <Text style={styles.correctAnswerLabel}>
                          Correct answer:
                        </Text>
                        <Text style={styles.correctAnswerText}>
                          {correctAnswer}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 26,
  },
  bonusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 24,
  },
  bonusText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  optionButtonSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabelSelected: {
    backgroundColor: '#4F46E5',
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  optionLabelTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  resultTitle: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  resultText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  earnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
  },
  earnedAmount: {
    marginLeft: 8,
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
  },
  correctAnswerContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    width: '100%',
  },
  correctAnswerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  correctAnswerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#78350F',
  },
  doneButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 24,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default QuizModal;
