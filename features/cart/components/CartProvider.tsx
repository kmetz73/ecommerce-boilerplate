'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@clerk/nextjs';

import {
  addCartItemAction,
  fetchCartAction,
  removeCartItemAction,
  updateCartItemAction,
} from '../actions/cart';

import type { getCartView } from '../services/cart';

export type CartView = Awaited<ReturnType<typeof getCartView>>;

type CartResult = { success: true } | { success: false; message: string };

type CartMutationResponse = Awaited<ReturnType<typeof addCartItemAction>>;

type CartContextValue = {
  cart: CartView;
  loading: boolean;
  pending: boolean;
  error: string | null;
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  addItem: (
    productUuid: string,
    variantUuid: string | null
  ) => Promise<CartResult>;
  updateQuantity: (itemUuid: string, quantity: number) => Promise<CartResult>;
  removeItem: (itemUuid: string) => Promise<CartResult>;
};

const EMPTY_CART: CartView = {
  items: [],
  itemCount: 0,
  subtotalCents: 0,
  canCheckout: false,
};

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
  children: ReactNode;
};

const CartProvider = ({ children }: CartProviderProps) => {
  const { isLoaded, userId } = useAuth();

  const [cart, setCart] = useState<CartView>(EMPTY_CART);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setOpen] = useState(false);

  // Load cart when Clerk finishes initializing or user changes.
  useEffect(() => {
    if (!isLoaded) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchCartAction();

        if (active) {
          setCart(result);
        }
      } catch {
        if (active) {
          setError('Unable to load your cart.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [isLoaded, userId]);

  const runMutation = useCallback(
    async (
      operation: () => Promise<CartMutationResponse>,
      openAfterSuccess = false
    ): Promise<CartResult> => {
      setPending(true);
      setError(null);

      try {
        const result = await operation();

        if (!result.success) {
          setError(result.message);
          return result;
        }

        setCart(result.cart);

        if (openAfterSuccess) {
          setOpen(true);
        }

        return { success: true };
      } catch {
        const message = 'Unable to update your cart. Try again.';

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setPending(false);
      }
    },
    []
  );

  const addItem = useCallback(
    (productUuid: string, variantUuid: string | null) =>
      runMutation(
        () =>
          addCartItemAction({
            productUuid,
            variantUuid,
            quantity: 1,
          }),
        true
      ),
    [runMutation]
  );

  const updateQuantity = useCallback(
    (itemUuid: string, quantity: number) =>
      runMutation(() =>
        updateCartItemAction({
          itemUuid,
          quantity,
        })
      ),
    [runMutation]
  );

  const removeItem = useCallback(
    (itemUuid: string) =>
      runMutation(() =>
        removeCartItemAction({
          itemUuid,
        })
      ),
    [runMutation]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        pending,
        error,
        isOpen,
        setOpen,
        addItem,
        updateQuantity,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider.');
  }

  return context;
};

export default CartProvider;
