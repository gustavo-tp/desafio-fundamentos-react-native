import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProduts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storagedProduts) {
        setProducts(JSON.parse(storagedProduts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(product =>
        product.id === id
          ? {
              ...product,
              quantity: product.quantity + 1,
            }
          : product,
      );

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(
        productInCart => productInCart.id === product.id,
      );

      if (productExists) {
        increment(productExists.id);

        return;
      }

      const newProduct: Product = {
        ...product,
        quantity: 1,
      };

      const newProducts = [...products, newProduct];

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProducts = products.reduce((allProducs, product) => {
        if (product.id === id) {
          if (product.quantity > 1) {
            return [
              ...allProducs,
              {
                ...product,
                quantity: product.quantity - 1,
              },
            ];
          }

          return allProducs;
        }

        return [...allProducs, product];
      }, [] as Product[]);

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
