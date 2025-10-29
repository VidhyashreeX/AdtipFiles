// src/stores/cart.store.ts - World-class shopping cart state management
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  sellerId: number;
  sellerName: string;
  category: string;
  inStock: boolean;
  maxQuantity?: number;
}

interface CartState {
  // State
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;

  // Computed properties
  totalItems: number;
  totalPrice: number;
  totalSavings: number;
  hasItems: boolean;

  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setLoading: (loading: boolean) => void;

  // Advanced actions
  addMultipleItems: (items: (Omit<CartItem, 'id' | 'quantity'> & { quantity?: number })[]) => void;
  mergeCart: (items: CartItem[]) => void;
  validateCart: () => { valid: boolean; errors: string[] };
}

// Custom storage with cart validation
const cartStorage = {
  getItem: (name: string) => {
    const item = localStorage.getItem(name);
    if (!item) return null;

    try {
      const parsed = JSON.parse(item);
      // Validate cart items (remove invalid ones)
      if (parsed.state?.items) {
        const validItems = parsed.state.items.filter((item: CartItem) =>
          item.productId &&
          item.name &&
          item.price >= 0 &&
          item.quantity > 0
        );
        parsed.state.items = validItems;
      }
      return JSON.stringify(parsed);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        items: [],
        isOpen: false,
        isLoading: false,

        // Computed properties
        get totalItems() {
          return get().items.reduce((total, item) => total + item.quantity, 0);
        },

        get totalPrice() {
          return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
        },

        get totalSavings() {
          return get().items.reduce((total, item) => {
            const savings = (item.originalPrice || item.price) - item.price;
            return total + (savings * item.quantity);
          }, 0);
        },

        get hasItems() {
          return get().items.length > 0;
        },

        // Actions
        addItem: (itemData) => {
          const itemId = `cart-${itemData.productId}-${Date.now()}`;
          const newItem: CartItem = {
            id: itemId,
            quantity: 1,
            ...itemData,
          };

          set((state) => {
            const existingItem = state.items.find(item => item.productId === itemData.productId);

            if (existingItem) {
              // Update quantity if item exists
              const updatedItems = state.items.map(item =>
                item.productId === itemData.productId
                  ? { ...item, quantity: item.quantity + (itemData.quantity || 1) }
                  : item
              );
              return { items: updatedItems };
            } else {
              // Add new item
              return { items: [...state.items, newItem] };
            }
          }, false, 'cart/addItem');
        },

        removeItem: (productId) =>
          set((state) => ({
            items: state.items.filter(item => item.productId !== productId)
          }), false, 'cart/removeItem'),

        updateQuantity: (productId, quantity) => {
          if (quantity <= 0) {
            get().removeItem(productId);
            return;
          }

          set((state) => ({
            items: state.items.map(item =>
              item.productId === productId
                ? { ...item, quantity: Math.min(quantity, item.maxQuantity || 99) }
                : item
            )
          }), false, 'cart/updateQuantity');
        },

        clearCart: () => set({ items: [] }, false, 'cart/clearCart'),

        toggleCart: () =>
          set((state) => ({ isOpen: !state.isOpen }), false, 'cart/toggleCart'),

        openCart: () => set({ isOpen: true }, false, 'cart/openCart'),

        closeCart: () => set({ isOpen: false }, false, 'cart/closeCart'),

        setLoading: (isLoading) => set({ isLoading }, false, 'cart/setLoading'),

        // Advanced actions
        addMultipleItems: (items) => {
          const newItems = items.map(itemData => ({
            id: `cart-${itemData.productId}-${Date.now()}-${Math.random()}`,
            quantity: itemData.quantity || 1,
            ...itemData,
          }));

          set((state) => {
            const mergedItems = [...state.items];

            newItems.forEach(newItem => {
              const existingIndex = mergedItems.findIndex(item => item.productId === newItem.productId);
              if (existingIndex >= 0) {
                mergedItems[existingIndex].quantity += newItem.quantity;
              } else {
                mergedItems.push(newItem);
              }
            });

            return { items: mergedItems };
          }, false, 'cart/addMultipleItems');
        },

        mergeCart: (items) => {
          set((state) => {
            const mergedItems = [...state.items];

            items.forEach(newItem => {
              const existingIndex = mergedItems.findIndex(item => item.productId === newItem.productId);
              if (existingIndex >= 0) {
                // Keep the higher quantity
                mergedItems[existingIndex].quantity = Math.max(
                  mergedItems[existingIndex].quantity,
                  newItem.quantity
                );
              } else {
                mergedItems.push(newItem);
              }
            });

            return { items: mergedItems };
          }, false, 'cart/mergeCart');
        },

        validateCart: () => {
          const items = get().items;
          const errors: string[] = [];

          items.forEach(item => {
            if (!item.inStock) {
              errors.push(`${item.name} is out of stock`);
            }
            if (item.maxQuantity && item.quantity > item.maxQuantity) {
              errors.push(`${item.name} exceeds maximum quantity (${item.maxQuantity})`);
            }
          });

          return {
            valid: errors.length === 0,
            errors
          };
        },
      }),
      {
        name: 'cart-storage',
        storage: createJSONStorage(() => cartStorage),
        partialize: (state) => ({
          items: state.items,
        }),
      }
    ),
    {
      name: 'cart-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for optimized re-renders
export const useCartItems = () => useCartStore((state) => state.items);
export const useCartIsOpen = () => useCartStore((state) => state.isOpen);
export const useCartLoading = () => useCartStore((state) => state.isLoading);
export const useCartTotalItems = () => useCartStore((state) => state.totalItems);
export const useCartTotalPrice = () => useCartStore((state) => state.totalPrice);
export const useCartTotalSavings = () => useCartStore((state) => state.totalSavings);
export const useCartHasItems = () => useCartStore((state) => state.hasItems);

// Actions
export const useCartActions = () => useCartStore((state) => ({
  addItem: state.addItem,
  removeItem: state.removeItem,
  updateQuantity: state.updateQuantity,
  clearCart: state.clearCart,
  toggleCart: state.toggleCart,
  openCart: state.openCart,
  closeCart: state.closeCart,
  setLoading: state.setLoading,
  addMultipleItems: state.addMultipleItems,
  mergeCart: state.mergeCart,
  validateCart: state.validateCart,
}));