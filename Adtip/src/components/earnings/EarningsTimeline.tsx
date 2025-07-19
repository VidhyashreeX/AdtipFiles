// src/components/earnings/EarningsTimeline.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  getEarningsCreditTimeline, 
  formatDate, 
  getRelativeTime,
  getEarningsCreditStatus 
} from '../../utils/businessDayUtils';

interface EarningsTimelineProps {
  isPremium: boolean;
  earningDate?: Date;
  showFullTimeline?: boolean;
  compact?: boolean;
}

interface TimelineStepProps {
  step: {
    id: string;
    title: string;
    description: string;
    date: Date | null;
    completed: boolean;
    current: boolean;
    icon: string;
  };
  isLast: boolean;
  colors: any;
}

const TimelineStep: React.FC<TimelineStepProps> = ({ step, isLast, colors }) => {
  const getStepColor = () => {
    if (step.completed) return colors.success;
    if (step.current) return colors.primary;
    return colors.border;
  };

  const getIconName = () => {
    switch (step.icon) {
      case 'dollar-sign': return 'dollar-sign';
      case 'clock': return 'clock';
      case 'check-circle': return 'check-circle';
      default: return 'circle';
    }
  };

  return (
    <View style={styles.timelineStep}>
      <View style={styles.timelineContent}>
        <View style={[styles.timelineIcon, { backgroundColor: getStepColor() + '20' }]}>
          <Icon
            name={getIconName()}
            size={16}
            color={getStepColor()}
          />
        </View>
        <View style={styles.timelineText}>
          <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
            {step.title}
          </Text>
          <Text style={[styles.stepDescription, { color: colors.text.secondary }]}>
            {step.description}
          </Text>
          {step.date && (
            <Text style={[styles.stepDate, { color: colors.text.tertiary }]}>
              {formatDate(step.date)} ({getRelativeTime(step.date)})
            </Text>
          )}
        </View>
      </View>
      {!isLast && (
        <View
          style={[
            styles.timelineLine,
            {
              backgroundColor: step.completed ? colors.success : colors.border,
            },
          ]}
        />
      )}
    </View>
  );
};

const EarningsTimeline: React.FC<EarningsTimelineProps> = ({
  isPremium,
  earningDate = new Date(),
  showFullTimeline = true,
  compact = false
}) => {
  const { colors } = useTheme();
  const timeline = getEarningsCreditTimeline(isPremium, earningDate);

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.card }]}>
        <View style={styles.compactHeader}>
          <Icon 
            name="clock" 
            size={16} 
            color={isPremium ? colors.success : colors.warning} 
          />
          <Text style={[styles.compactTitle, { color: colors.text.primary }]}>
            Credit Timeline
          </Text>
        </View>
        <Text style={[styles.compactStatus, { color: colors.text.secondary }]}>
          {getEarningsCreditStatus(isPremium, earningDate)}
        </Text>
        <View style={styles.compactDetails}>
          <Text style={[styles.compactLabel, { color: colors.text.tertiary }]}>
            Processing Time:
          </Text>
          <Text style={[styles.compactValue, { color: isPremium ? colors.success : colors.warning }]}>
            {timeline.processingDays} business days ({isPremium ? 'Premium' : 'Regular'})
          </Text>
        </View>
        {!timeline.isCreditable && (
          <View style={styles.compactDetails}>
            <Text style={[styles.compactLabel, { color: colors.text.tertiary }]}>
              Available on:
            </Text>
            <Text style={[styles.compactValue, { color: colors.text.primary }]}>
              {formatDate(timeline.creditDate)}
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (!showFullTimeline) {
    return (
      <View style={[styles.summaryContainer, { backgroundColor: colors.card }]}>
        <View style={styles.summaryHeader}>
          <View style={[styles.summaryIcon, { backgroundColor: isPremium ? colors.success + '20' : colors.warning + '20' }]}>
            <Icon 
              name="clock" 
              size={20} 
              color={isPremium ? colors.success : colors.warning} 
            />
          </View>
          <View style={styles.summaryText}>
            <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
              Earnings Credit Timeline
            </Text>
            <Text style={[styles.summarySubtitle, { color: colors.text.secondary }]}>
              {isPremium ? 'Premium User' : 'Regular User'} • {timeline.processingDays} business days
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryStatus}>
          <Text style={[styles.statusText, { color: colors.text.primary }]}>
            {getEarningsCreditStatus(isPremium, earningDate)}
          </Text>
          {!timeline.isCreditable && (
            <Text style={[styles.statusDate, { color: colors.text.secondary }]}>
              Available: {formatDate(timeline.creditDate)}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Earnings Credit Timeline
        </Text>
        <View style={[styles.badge, { backgroundColor: isPremium ? colors.success + '20' : colors.warning + '20' }]}>
          <Text style={[styles.badgeText, { color: isPremium ? colors.success : colors.warning }]}>
            {isPremium ? 'Premium' : 'Regular'} User
          </Text>
        </View>
      </View>

      <View style={styles.processingInfo}>
        <Text style={[styles.processingText, { color: colors.text.secondary }]}>
          Processing Time: <Text style={{ fontWeight: '600', color: colors.text.primary }}>
            {timeline.processingDays} business days
          </Text>
        </Text>
        {!timeline.isCreditable && timeline.businessDaysRemaining > 0 && (
          <Text style={[styles.remainingText, { color: colors.text.tertiary }]}>
            {timeline.businessDaysRemaining} business days remaining
          </Text>
        )}
      </View>

      <View style={styles.timeline}>
        {timeline.timeline.map((step, index) => (
          <TimelineStep
            key={step.id}
            step={step}
            isLast={index === timeline.timeline.length - 1}
            colors={colors}
          />
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
          * Business days exclude weekends and public holidays
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  processingInfo: {
    marginBottom: 16,
  },
  processingText: {
    fontSize: 14,
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 12,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineStep: {
    position: 'relative',
  },
  timelineContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  stepDate: {
    fontSize: 11,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: 16,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
  },
  
  // Summary styles
  summaryContainer: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: 12,
  },
  summaryStatus: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  statusDate: {
    fontSize: 11,
  },
  
  // Compact styles
  compactContainer: {
    borderRadius: 6,
    padding: 8,
    marginVertical: 2,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  compactStatus: {
    fontSize: 11,
    marginBottom: 4,
  },
  compactDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  compactLabel: {
    fontSize: 10,
  },
  compactValue: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default EarningsTimeline;
