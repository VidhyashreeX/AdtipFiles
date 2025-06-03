// src/screens/shop/TrackOrderScreen.tsx
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

interface OrderStatus {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

interface OrderInfo {
  orderId: string;
  status: string;
  orderDate: string;
  estimatedDelivery: string;
  trackingNumber?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };
  totalAmount: number;
}

const TrackOrderScreen: React.FC = () => {
  const route = useRoute();
  const {colors} = useTheme();
  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);

  const orderId = (route.params as any)?.orderId || 'AD123456789';

  // Fix: Move loadOrderDetails above useEffect and wrap in useCallback
  const loadOrderDetails = useCallback(async () => {
    try {
      setLoading(true);

      // Mock order data
      const mockOrderInfo: OrderInfo = {
        orderId,
        status: 'shipped',
        orderDate: '2024-05-25',
        estimatedDelivery: '2024-06-02',
        trackingNumber: 'TRK789456123',
        items: [
          {name: 'Adtip Premium T-Shirt', quantity: 2, price: 29.99},
          {name: 'Adtip Sticker Pack', quantity: 1, price: 9.99},
        ],
        shippingAddress: {
          name: 'John Doe',
          address: '123 Main Street, Apt 4B',
          city: 'New York',
          zipCode: '10001',
          country: 'United States',
        },
        totalAmount: 69.97,
      };

      const mockStatuses: OrderStatus[] = [
        {
          id: 'placed',
          title: 'Order Placed',
          description: 'Your order has been received and is being processed',
          timestamp: '2024-05-25 10:30 AM',
          completed: true,
          current: false,
        },
        {
          id: 'confirmed',
          title: 'Order Confirmed',
          description: 'Your order has been confirmed and payment processed',
          timestamp: '2024-05-25 11:15 AM',
          completed: true,
          current: false,
        },
        {
          id: 'processing',
          title: 'Processing',
          description: 'Your items are being prepared for shipment',
          timestamp: '2024-05-26 09:00 AM',
          completed: true,
          current: false,
        },
        {
          id: 'shipped',
          title: 'Shipped',
          description: 'Your order is on its way',
          timestamp: '2024-05-27 02:30 PM',
          completed: true,
          current: true,
        },
        {
          id: 'delivered',
          title: 'Delivered',
          description: 'Your order has been delivered',
          timestamp: '',
          completed: false,
          current: false,
        },
      ];

      setOrderInfo(mockOrderInfo);
      setOrderStatuses(mockStatuses);
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const getStatusIcon = (status: OrderStatus) => {
    if (status.completed) {
      return 'check-circle';
    } else if (status.current) {
      return 'clock';
    } else {
      return 'circle';
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    if (status.completed) {
      return colors.success;
    } else if (status.current) {
      return colors.primary;
    } else {
      return colors.text.tertiary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Track Order" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!orderInfo) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Track Order" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: colors.text.secondary}]}>
            Order not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Track Order" showBackButton />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <View style={[styles.orderHeader, {backgroundColor: colors.surface}]}>
          <Text style={[styles.orderId, {color: colors.text.primary}]}>
            Order #{orderInfo.orderId}
          </Text>
          <Text style={[styles.orderDate, {color: colors.text.secondary}]}>
            Placed on {new Date(orderInfo.orderDate).toLocaleDateString()}
          </Text>
          {orderInfo.trackingNumber && (
            <View style={styles.trackingContainer}>
              <Text
                style={[styles.trackingLabel, {color: colors.text.secondary}]}>
                Tracking Number:
              </Text>
              <Text style={[styles.trackingNumber, {color: colors.primary}]}>
                {orderInfo.trackingNumber}
              </Text>
            </View>
          )}
        </View>

        {/* Delivery Estimate */}
        <View
          style={[
            styles.deliveryEstimate,
            {backgroundColor: colors.primary + '10'},
          ]}>
          <Icon name="truck" size={24} color={colors.primary} />
          <View style={styles.deliveryInfo}>
            <Text style={[styles.deliveryTitle, {color: colors.text.primary}]}>
              Estimated Delivery
            </Text>
            <Text style={[styles.deliveryDate, {color: colors.primary}]}>
              {new Date(orderInfo.estimatedDelivery).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Order Status Timeline */}
        <View style={[styles.section, {backgroundColor: colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
            Order Status
          </Text>
          <View style={styles.timeline}>
            {orderStatuses.map((status, index) => (
              <View key={status.id} style={styles.timelineItem}>
                <View style={styles.timelineContent}>
                  <View
                    style={[
                      styles.timelineIcon,
                      {backgroundColor: getStatusColor(status) + '20'},
                    ]}>
                    <Icon
                      name={getStatusIcon(status)}
                      size={16}
                      color={getStatusColor(status)}
                    />
                  </View>
                  <View style={styles.timelineText}>
                    <Text
                      style={[
                        styles.statusTitle,
                        {color: colors.text.primary},
                      ]}>
                      {status.title}
                    </Text>
                    <Text
                      style={[
                        styles.statusDescription,
                        {color: colors.text.secondary},
                      ]}>
                      {status.description}
                    </Text>
                    {status.timestamp && (
                      <Text
                        style={[
                          styles.statusTimestamp,
                          {color: colors.text.tertiary},
                        ]}>
                        {status.timestamp}
                      </Text>
                    )}
                  </View>
                </View>
                {index < orderStatuses.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: status.completed
                          ? colors.success
                          : colors.border.light,
                      },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Order Items */}
        <View style={[styles.section, {backgroundColor: colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
            Order Items
          </Text>
          {orderInfo.items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.orderItem,
                {borderBottomColor: colors.border.light},
              ]}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, {color: colors.text.primary}]}>
                  {item.name}
                </Text>
                <Text
                  style={[styles.itemQuantity, {color: colors.text.secondary}]}>
                  Quantity: {item.quantity}
                </Text>
              </View>
              <Text style={[styles.itemPrice, {color: colors.text.primary}]}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View
            style={[styles.totalRow, {borderTopColor: colors.border.light}]}>
            <Text style={[styles.totalLabel, {color: colors.text.primary}]}>
              Total
            </Text>
            <Text style={[styles.totalAmount, {color: colors.text.primary}]}>
              ${orderInfo.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={[styles.section, {backgroundColor: colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
            Shipping Address
          </Text>
          <Text style={[styles.addressName, {color: colors.text.primary}]}>
            {orderInfo.shippingAddress.name}
          </Text>
          <Text style={[styles.addressLine, {color: colors.text.secondary}]}>
            {orderInfo.shippingAddress.address}
          </Text>
          <Text style={[styles.addressLine, {color: colors.text.secondary}]}>
            {orderInfo.shippingAddress.city},{' '}
            {orderInfo.shippingAddress.zipCode}
          </Text>
          <Text style={[styles.addressLine, {color: colors.text.secondary}]}>
            {orderInfo.shippingAddress.country}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryButton,
              {borderColor: colors.border.light},
            ]}
            onPress={() => {
              Alert.alert(
                'Contact Support',
                'How can we help you with this order?',
              );
            }}>
            <Icon name="help-circle" size={18} color={colors.text.primary} />
            <Text
              style={[styles.actionButtonText, {color: colors.text.primary}]}>
              Contact Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              {backgroundColor: colors.primary},
            ]}
            onPress={() => {
              // Handle reorder
              Alert.alert('Reorder', 'Would you like to reorder these items?');
            }}>
            <Icon name="refresh-cw" size={18} color={colors.white} />
            <Text style={[styles.actionButtonText, {color: colors.white}]}>
              Reorder
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  orderHeader: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackingLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  trackingNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  deliveryEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  deliveryInfo: {
    marginLeft: 12,
  },
  deliveryTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  deliveryDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
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
  statusTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  statusTimestamp: {
    fontSize: 11,
  },
  timelineLine: {
    position: 'absolute',
    left: 23,
    top: 32,
    width: 2,
    height: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 14,
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default TrackOrderScreen;
