import React from 'react';
import { View } from 'react-native';
import TransactionRowSkeleton from './TransactionRowSkeleton'; // Adjust path if necessary

interface TransactionListSkeletonProps {
  count?: number;
}

const TransactionListSkeleton: React.FC<TransactionListSkeletonProps> = ({ count = 3 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <TransactionRowSkeleton key={`trans-skel-${index}`} />
      ))}
    </View>
  );
};

export default TransactionListSkeleton;