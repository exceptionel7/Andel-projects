'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // Open / close cart drawer
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      // Add item — if variant already in cart, increment quantity
      addItem: (product) => {
        const items = get().items;
        const existing = items.find(
          (i) => i.variant_id === product.variant_id
        );

        if (existing) {
          set({
            items: items.map((i) =>
              i.variant_id === product.variant_id
                ? { ...i, quantity: i.quantity + (product.quantity || 1) }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: product.quantity || 1 }] });
        }
        set({ isOpen: true });
      },

      // Remove item by variant_id
      removeItem: (variant_id) =>
        set({ items: get().items.filter((i) => i.variant_id !== variant_id) }),

      // Update quantity
      updateQuantity: (variant_id, quantity) => {
        if (quantity < 1) {
          get().removeItem(variant_id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variant_id === variant_id ? { ...i, quantity } : i
          ),
        });
      },

      // Clear cart
      clearCart: () => set({ items: [] }),

      // Computed totals
      get total() {
        return get().items.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0
        );
      },
      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: 'exceptionel-cart',
    }
  )
);
