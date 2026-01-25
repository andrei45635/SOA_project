import React, { useState, useEffect } from 'react';
import { Order, OrderItem } from '../../types';
import { apiService } from '../../services/api.service';

const SAMPLE_PRODUCTS = [
  { id: 'prod-1', name: 'Margherita Pizza', price: 12.99 },
  { id: 'prod-2', name: 'Pepperoni Pizza', price: 14.99 },
  { id: 'prod-3', name: 'Caesar Salad', price: 8.99 },
  { id: 'prod-4', name: 'Garlic Bread', price: 4.99 },
  { id: 'prod-5', name: 'Tiramisu', price: 6.99 },
];

export function OrdersMicroFrontend() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await apiService.getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (productId: string) => {
    setCart(prev => {
      const newCart = new Map(prev);
      newCart.set(productId, (newCart.get(productId) || 0) + 1);
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = new Map(prev);
      const qty = newCart.get(productId) || 0;
      if (qty <= 1) {
        newCart.delete(productId);
      } else {
        newCart.set(productId, qty - 1);
      }
      return newCart;
    });
  };

  const placeOrder = async () => {
    try {
      const items: OrderItem[] = [];
      cart.forEach((qty, productId) => {
        const product = SAMPLE_PRODUCTS.find(p => p.id === productId);
        if (product) {
          items.push({
            productId: product.id,
            productName: product.name,
            quantity: qty,
            price: product.price,
          });
        }
      });

      await apiService.createOrder(items);
      setCart(new Map());
      setShowCart(false);
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await apiService.cancelOrder(orderId);
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    }
  };

  const getCartTotal = () => {
    let total = 0;
    cart.forEach((qty, productId) => {
      const product = SAMPLE_PRODUCTS.find(p => p.id === productId);
      if (product) total += product.price * qty;
    });
    return total.toFixed(2);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f39c12',
      confirmed: '#3498db',
      preparing: '#9b59b6',
      ready: '#2ecc71',
      delivered: '#27ae60',
      cancelled: '#e74c3c',
    };
    return colors[status] || '#666';
  };

  if (loading) return <div style={styles.loading}>Loading orders...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Orders</h1>
        <button style={styles.cartButton} onClick={() => setShowCart(!showCart)}>
          🛒 Cart ({Array.from(cart.values()).reduce((a, b) => a + b, 0)})
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showCart && (
        <div style={styles.cartPanel}>
          <h3>Your Cart</h3>
          {cart.size === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <>
              {SAMPLE_PRODUCTS.filter(p => cart.has(p.id)).map(product => (
                <div key={product.id} style={styles.cartItem}>
                  <span>{product.name} x {cart.get(product.id)}</span>
                  <span>${(product.price * (cart.get(product.id) || 0)).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(product.id)}>-</button>
                  <button onClick={() => addToCart(product.id)}>+</button>
                </div>
              ))}
              <div style={styles.cartTotal}>Total: ${getCartTotal()}</div>
              <button style={styles.placeOrderButton} onClick={placeOrder}>
                Place Order
              </button>
            </>
          )}
        </div>
      )}

      <div style={styles.productsSection}>
        <h2>Menu</h2>
        <div style={styles.productsGrid}>
          {SAMPLE_PRODUCTS.map(product => (
            <div key={product.id} style={styles.productCard}>
              <h3>{product.name}</h3>
              <p style={styles.price}>${product.price.toFixed(2)}</p>
              <button style={styles.addButton} onClick={() => addToCart(product.id)}>
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.ordersSection}>
        <h2>Your Orders</h2>
        {orders.length === 0 ? (
          <p>No orders yet</p>
        ) : (
          <div style={styles.ordersList}>
            {orders.map(order => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <span style={styles.orderId}>#{order.id.slice(0, 8)}</span>
                  <span style={{ ...styles.status, backgroundColor: getStatusColor(order.status) }}>
                    {order.status}
                  </span>
                </div>
                <div style={styles.orderItems}>
                  {order.items.map((item, i) => (
                    <div key={i}>
                      {item.productName} x {item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  ))}
                </div>
                <div style={styles.orderFooter}>
                  <span style={styles.total}>Total: ${order.totalAmount.toFixed(2)}</span>
                  <span style={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</span>
                  {order.status === 'pending' && (
                    <button style={styles.cancelButton} onClick={() => cancelOrder(order.id)}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  cartButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  cartPanel: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #eee',
    gap: '1rem',
  },
  cartTotal: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    marginTop: '1rem',
  },
  placeOrderButton: {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '1rem',
  },
  productsSection: {
    marginBottom: '2rem',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
  },
  productCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  price: {
    fontSize: '1.2rem',
    color: '#27ae60',
    fontWeight: 'bold',
  },
  addButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  ordersSection: {
    marginTop: '2rem',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  orderCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  status: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.85rem',
    textTransform: 'capitalize',
  },
  orderItems: {
    color: '#666',
    marginBottom: '1rem',
  },
  orderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #eee',
    paddingTop: '1rem',
  },
  total: {
    fontWeight: 'bold',
  },
  date: {
    color: '#666',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
