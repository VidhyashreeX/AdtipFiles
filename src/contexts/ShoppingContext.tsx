
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";

// Define types for our items
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  seller: string;
  quantity?: number;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: Product[];
}

interface ShoppingContextType {
  cart: Product[];
  favorites: Product[];
  orders: Order[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (id: number) => void;
  createOrder: () => void;
  buyAgain: (product: Product) => void;
}

const ShoppingContext = createContext<ShoppingContextType | undefined>(undefined);

export const ShoppingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [cart, setCart] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    const storedCart = localStorage.getItem('cartItems');
    const storedFavorites = localStorage.getItem('favorites');
    const storedOrders = localStorage.getItem('orders');
    
    if (storedCart) setCart(JSON.parse(storedCart));
    if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    if (storedOrders) setOrders(JSON.parse(storedOrders));
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  // Cart functions
  const addToCart = (product: Product) => {
    setCart(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: (item.quantity || 1) + 1 } 
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
    toast({ description: "Item added to cart" });
  };

  const removeFromCart = (id: number) => {
    setCart(prevItems => prevItems.filter(item => item.id !== id));
    toast({ description: "Item removed from cart" });
  };

  const updateQuantity = (id: number, quantity: number) => {
    setCart(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.max(1, quantity) } 
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    toast({ description: "Cart has been cleared" });
  };

  // Favorites functions
  const addToFavorites = (product: Product) => {
    if (!favorites.some(item => item.id === product.id)) {
      setFavorites(prevItems => [...prevItems, product]);
      toast({ description: "Item added to favorites" });
    } else {
      toast({ description: "Item is already in favorites" });
    }
  };

  const removeFromFavorites = (id: number) => {
    setFavorites(prevItems => prevItems.filter(item => item.id !== id));
    toast({ description: "Item removed from favorites" });
  };

  // Orders functions
  const createOrder = () => {
    if (cart.length === 0) {
      toast({ description: "Cannot place an empty order" });
      return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const shipping = 5.99;
    const total = subtotal + shipping;
    
    const newOrder = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      total,
      status: "Processing",
      items: [...cart]
    };
    
    setOrders(prevOrders => [newOrder, ...prevOrders]);
    setCart([]);
    toast({ description: "Order placed successfully" });
    
    // Store the new order in localStorage
    localStorage.setItem('checkoutComplete', JSON.stringify(newOrder));
  };

  const buyAgain = (product: Product) => {
    addToCart(product);
  };

  const value = {
    cart,
    favorites,
    orders,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    addToFavorites,
    removeFromFavorites,
    createOrder,
    buyAgain
  };

  return (
    <ShoppingContext.Provider value={value}>
      {children}
    </ShoppingContext.Provider>
  );
};

export const useShopping = () => {
  const context = useContext(ShoppingContext);
  if (context === undefined) {
    throw new Error('useShopping must be used within a ShoppingProvider');
  }
  return context;
};
