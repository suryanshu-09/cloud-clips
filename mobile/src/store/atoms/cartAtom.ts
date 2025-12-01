import { atom } from 'jotai';
import { atomWithStorage, unwrap } from 'jotai/utils';
import { storage } from '../utils/storage';

export interface ICartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  barberId: string;
  barberName: string;
}

export interface ICart {
  items: ICartItem[];
  total: number;
  itemCount: number;
}

const initialCartState: ICart = {
  items: [],
  total: 0,
  itemCount: 0,
};

const calculateCartTotals = (items: ICartItem[]): Pick<ICart, 'total' | 'itemCount'> => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

// Persistent cart atom
export const cartAtom = atomWithStorage<ICart>('cart', initialCartState, storage, {
  getOnInit: true,
});

// Unwrapped atom for synchronous access
const cartAtomSync = unwrap(cartAtom, (prev) => prev ?? initialCartState);

// Derived atoms
export const cartItemsAtom = atom((get) => get(cartAtomSync).items);
export const cartTotalAtom = atom((get) => get(cartAtomSync).total);
export const cartItemCountAtom = atom((get) => get(cartAtomSync).itemCount);

// Actions
export const addToCartAtom = atom(null, (get, set, item: ICartItem) => {
  const cart = get(cartAtomSync);
  const existingItemIndex = cart.items.findIndex((i: ICartItem) => i.productId === item.productId);

  let newItems: ICartItem[];
  if (existingItemIndex >= 0) {
    // Update quantity if item already exists
    newItems = cart.items.map((i: ICartItem, index: number) =>
      index === existingItemIndex ? { ...i, quantity: i.quantity + item.quantity } : i
    );
  } else {
    // Add new item
    newItems = [...cart.items, item];
  }

  const totals = calculateCartTotals(newItems);
  set(cartAtom, { items: newItems, ...totals });
});

export const removeFromCartAtom = atom(null, (get, set, productId: string) => {
  const cart = get(cartAtomSync);
  const newItems = cart.items.filter((item: ICartItem) => item.productId !== productId);
  const totals = calculateCartTotals(newItems);
  set(cartAtom, { items: newItems, ...totals });
});

export const updateCartItemQuantityAtom = atom(
  null,
  (get, set, { productId, quantity }: { productId: string; quantity: number }) => {
    const cart = get(cartAtomSync);
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      set(removeFromCartAtom, productId);
      return;
    }

    const newItems = cart.items.map((item: ICartItem) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    const totals = calculateCartTotals(newItems);
    set(cartAtom, { items: newItems, ...totals });
  }
);

export const clearCartAtom = atom(null, (get, set) => {
  set(cartAtom, initialCartState);
});
