/**
 * useCart Hook
 * Manages shopping cart state and operations
 */

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  cartAtom,
  cartItemsAtom,
  cartTotalAtom,
  cartItemCountAtom,
  addToCartAtom,
  removeFromCartAtom,
  updateCartItemQuantityAtom,
  clearCartAtom,
  type ICartItem,
} from '@/store/atoms/cartAtom';
import type { IProduct } from '../types';

export const useCart = () => {
  const cart = useAtomValue(cartAtom);
  const items = useAtomValue(cartItemsAtom);
  const total = useAtomValue(cartTotalAtom);
  const itemCount = useAtomValue(cartItemCountAtom);

  const addToCart = useSetAtom(addToCartAtom);
  const removeFromCart = useSetAtom(removeFromCartAtom);
  const updateQuantity = useSetAtom(updateCartItemQuantityAtom);
  const clearCart = useSetAtom(clearCartAtom);

  /**
   * Add a product to the cart
   */
  const addProduct = (product: IProduct, quantity: number = 1, barberName: string = '') => {
    const cartItem: ICartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0],
      barberId: product.barberId || '',
      barberName: barberName || product.barberName || '',
    };
    addToCart(cartItem);
  };

  /**
   * Remove a product from the cart
   */
  const removeProduct = (productId: string) => {
    removeFromCart(productId);
  };

  /**
   * Update the quantity of a product in the cart
   */
  const updateProductQuantity = (productId: string, quantity: number) => {
    updateQuantity({ productId, quantity });
  };

  /**
   * Increment product quantity
   */
  const incrementQuantity = (productId: string) => {
    const item = items.find((i) => i.productId === productId);
    if (item) {
      updateQuantity({ productId, quantity: item.quantity + 1 });
    }
  };

  /**
   * Decrement product quantity
   */
  const decrementQuantity = (productId: string) => {
    const item = items.find((i) => i.productId === productId);
    if (item && item.quantity > 1) {
      updateQuantity({ productId, quantity: item.quantity - 1 });
    } else {
      removeFromCart(productId);
    }
  };

  /**
   * Check if a product is in the cart
   */
  const isInCart = (productId: string): boolean => {
    return items.some((item) => item.productId === productId);
  };

  /**
   * Get quantity of a specific product in cart
   */
  const getProductQuantity = (productId: string): number => {
    const item = items.find((i) => i.productId === productId);
    return item?.quantity || 0;
  };

  /**
   * Check if cart is empty
   */
  const isEmpty = items.length === 0;

  return {
    // State
    cart,
    items,
    total,
    itemCount,
    isEmpty,

    // Actions
    addProduct,
    removeProduct,
    updateProductQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,

    // Helpers
    isInCart,
    getProductQuantity,
  };
};
