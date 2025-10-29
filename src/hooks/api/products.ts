// src/hooks/api/products.ts - React Query hooks for product/marketplace API calls
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Product, ApiResponse, OrderData } from '@/types';

// Query keys for consistent caching
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
  userProducts: (userId: number) => [...productKeys.all, 'user', userId] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  cart: () => [...productKeys.all, 'cart'] as const,
  orders: () => [...productKeys.all, 'orders'] as const,
  favorites: () => [...productKeys.all, 'favorites'] as const,
};

// API base URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7082';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('UserLoggedIn');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fetch products with pagination and filters
export const useProducts = (params?: {
  page?: number;
  limit?: number;
  category?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}) => {
  return useInfiniteQuery({
    queryKey: productKeys.list(params || {}),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/api/getallproduct', {
        params: { ...params, page: pageParam }
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      return pagination.current_page < pagination.total_page
        ? pagination.current_page + 1
        : undefined;
    },
    initialPageParam: 1,
  });
};

// Fetch single product by ID
export const useProduct = (id: number, enabled = true) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const userId = localStorage.getItem('UserId') || 0;
      const response = await api.get(`/api/productbyproductid/${id}/${userId}`);
      return response.data.data;
    },
    enabled: enabled && !!id,
  });
};

// Fetch products by user/company
export const useUserProducts = (userId: number, params?: { page?: number; limit?: number }) => {
  return useInfiniteQuery({
    queryKey: productKeys.userProducts(userId),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(`/api/getProductlist/${userId}`, {
        params: { ...params, page: pageParam }
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      return pagination.current_page < pagination.total_page
        ? pagination.current_page + 1
        : undefined;
    },
    enabled: !!userId,
    initialPageParam: 1,
  });
};

// Create new product
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: Record<string, unknown>) => {
      const response = await api.post('/api/addproduct', productData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch products
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

// Update product
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      const response = await api.post('/api/updateproduct', { ...data, id });
      return response.data;
    },
    onSuccess: (result, variables) => {
      // Update the specific product in cache
      queryClient.setQueryData(productKeys.detail(variables.id), result.data);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

// Delete product
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: Record<string, unknown>) => {
      const response = await api.post('/api/deleteProduct', productData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate products lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

// Get shopping cart
export const useCart = () => {
  return useQuery({
    queryKey: productKeys.cart(),
    queryFn: async () => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.get(`/api/cart/${userId}`);
      return response.data.data;
    },
    enabled: !!localStorage.getItem('UserId'),
  });
};

// Add to cart
export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: number; quantity?: number }) => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.post('/api/add-to-cart', {
        userId: Number(userId),
        productId,
        quantity
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate cart
      queryClient.invalidateQueries({ queryKey: productKeys.cart() });
    },
  });
};

// Remove from cart
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartItemId: number) => {
      const response = await api.delete(`/api/cart/${cartItemId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate cart
      queryClient.invalidateQueries({ queryKey: productKeys.cart() });
    },
  });
};

// Get user orders
export const useOrders = (params?: { page?: number; limit?: number; status?: string }) => {
  return useInfiniteQuery({
    queryKey: productKeys.orders(),
    queryFn: async ({ pageParam = 1 }) => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.get(`/api/getUserOrders/${userId}`, {
        params: { ...params, page: pageParam }
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      return pagination.current_page < pagination.total_page
        ? pagination.current_page + 1
        : undefined;
    },
    enabled: !!localStorage.getItem('UserId'),
    initialPageParam: 1,
  });
};

// Get seller orders
export const useSellerOrders = (params?: { page?: number; limit?: number; status?: string }) => {
  return useInfiniteQuery({
    queryKey: [...productKeys.orders(), 'seller'],
    queryFn: async ({ pageParam = 1 }) => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.get(`/api/getSellerOrders/${userId}`, {
        params: { ...params, page: pageParam }
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      return pagination.current_page < pagination.total_page
        ? pagination.current_page + 1
        : undefined;
    },
    enabled: !!localStorage.getItem('UserId'),
    initialPageParam: 1,
  });
};

// Create order
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: {
      items: Array<{ productId: number; quantity: number }>;
      shippingAddress: Record<string, unknown>;
      paymentMethod: string;
    }) => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.post('/api/create-order', {
        ...orderData,
        userId: Number(userId)
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate cart and orders
      queryClient.invalidateQueries({ queryKey: productKeys.cart() });
      queryClient.invalidateQueries({ queryKey: productKeys.orders() });
    },
  });
};

// Get favorites
export const useFavorites = () => {
  return useQuery({
    queryKey: productKeys.favorites(),
    queryFn: async () => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.get(`/api/favorites/${userId}`);
      return response.data.data;
    },
    enabled: !!localStorage.getItem('UserId'),
  });
};

// Add to favorites
export const useAddToFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.post('/api/add-to-favorites', {
        userId: Number(userId),
        productId
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate favorites
      queryClient.invalidateQueries({ queryKey: productKeys.favorites() });
    },
  });
};

// Remove from favorites
export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      const userId = localStorage.getItem('UserId');
      if (!userId) throw new Error('User not logged in');

      const response = await api.delete(`/api/favorites/${productId}`, {
        data: { userId: Number(userId) }
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate favorites
      queryClient.invalidateQueries({ queryKey: productKeys.favorites() });
    },
  });
};