import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Screensaver from '@/components/screensaver';
import WelcomeScreen from '@/components/welcome-screen';
import ProductSelection from '@/components/product-selection';
import PaymentModal from '@/components/payment-modal';
import ProcessingScreen from '@/components/processing-screen';
import SuccessScreen from '@/components/success-screen';
import ThankYouScreen from '@/components/thank-you-screen';
import AdminLogin from '@/components/admin-login';
import AdminPanel from '@/components/admin-panel';
import ComprehensiveAdminDashboard from '@/components/comprehensive-admin-dashboard';
import HomeButton from '@/components/home-button';
import type { Screen, SelectedProduct, VendingMachineState } from '@/lib/types';

export default function VendingMachine() {
  const [state, setState] = useState<VendingMachineState>({
    currentScreen: 'screensaver',
    selectedProduct: null,
    selectedPaymentMethod: null,
    currentOrder: null,
  });

  const updateScreen = (screen: Screen) => {
    setState(prev => ({ ...prev, currentScreen: screen }));
  };

  const selectProduct = (product: SelectedProduct | null) => {
    setState(prev => ({ ...prev, selectedProduct: product }));
  };

  const selectPaymentMethod = (method: string) => {
    setState(prev => ({ ...prev, selectedPaymentMethod: method }));
  };

  const setCurrentOrder = (orderId: number) => {
    setState(prev => ({ ...prev, currentOrder: orderId }));
  };

  const resetState = () => {
    setState({
      currentScreen: 'screensaver',
      selectedProduct: null,
      selectedPaymentMethod: null,
      currentOrder: null,
    });
  };

  const resetToProducts = () => {
    setState(prev => ({
      ...prev,
      currentScreen: 'products',
      selectedProduct: null,
      selectedPaymentMethod: null,
      currentOrder: null,
    }));
  };

  // Auto-return to screensaver after inactivity
  useEffect(() => {
    if (state.currentScreen === 'screensaver' || state.currentScreen === 'admin-login' || state.currentScreen === 'admin-panel') return;

    const timer = setTimeout(() => {
      resetState();
    }, 100000); // 100 seconds

    return () => clearTimeout(timer);
  }, [state.currentScreen]);

  const goToHome = () => {
    resetState();
  };

  return (
    <div className="vending-screen bg-charcoal relative">
      {/* Home Button - Show on all screens except screensaver, admin, and success */}
      {state.currentScreen !== 'screensaver' && state.currentScreen !== 'admin-login' && state.currentScreen !== 'admin-panel' && state.currentScreen !== 'success' && (
        <HomeButton onHome={goToHome} />
      )}
      
      <AnimatePresence mode="wait">
        {state.currentScreen === 'screensaver' && (
          <motion.div
            key="screensaver"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Screensaver 
              onActivate={() => updateScreen('welcome')} 
              onAdminAccess={() => updateScreen('admin-login')}
            />
          </motion.div>
        )}

        {state.currentScreen === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <WelcomeScreen 
              onTryFragrance={() => updateScreen('products')}
              onExploreCollection={() => updateScreen('thank-you')}
            />
          </motion.div>
        )}

        {state.currentScreen === 'products' && (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <ProductSelection
              selectedProduct={state.selectedProduct}
              onSelectProduct={selectProduct}
              onProceedToPayment={() => updateScreen('payment')}
            />
          </motion.div>
        )}

        {state.currentScreen === 'payment' && state.selectedProduct && (
          <PaymentModal
            product={state.selectedProduct}
            selectedPaymentMethod={state.selectedPaymentMethod}
            onSelectPaymentMethod={selectPaymentMethod}
            onCancel={() => updateScreen('products')}
            onConfirm={(orderId) => {
              setCurrentOrder(orderId);
              updateScreen('processing');
            }}
          />
        )}

        {state.currentScreen === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProcessingScreen
              onComplete={() => updateScreen('success')}
            />
          </motion.div>
        )}

        {state.currentScreen === 'success' && state.selectedProduct && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <SuccessScreen
              product={state.selectedProduct}
              onNewOrder={() => {
                setState(prev => ({
                  ...prev,
                  currentScreen: 'products',
                  selectedProduct: null,
                  selectedPaymentMethod: null,
                  currentOrder: null,
                }));
              }}
              onExploreBottles={() => updateScreen('thank-you')}
              onExit={() => {
                setState(prev => ({
                  ...prev,
                  currentScreen: 'screensaver',
                  selectedProduct: null,
                  selectedPaymentMethod: null,
                  currentOrder: null,
                }));
              }}
            />
          </motion.div>
        )}

        {state.currentScreen === 'thank-you' && (
          <motion.div
            key="thank-you"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <ThankYouScreen
              product={state.selectedProduct}
              onNewOrder={() => {
                setState(prev => ({
                  ...prev,
                  currentScreen: 'products',
                  selectedProduct: null,
                  selectedPaymentMethod: null,
                  currentOrder: null,
                }));
              }}
              onExploreBottles={() => updateScreen('thank-you')}
              onExit={() => {
                setState(prev => ({
                  ...prev,
                  currentScreen: 'screensaver',
                  selectedProduct: null,
                  selectedPaymentMethod: null,
                  currentOrder: null,
                }));
              }}
            />
          </motion.div>
        )}

        {state.currentScreen === 'admin-login' && (
          <motion.div
            key="admin-login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <AdminLogin
              onLogin={() => updateScreen('admin-panel')}
              onBack={() => updateScreen('screensaver')}
            />
          </motion.div>
        )}

        {state.currentScreen === 'admin-panel' && (
          <motion.div
            key="admin-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <ComprehensiveAdminDashboard
              onLogout={() => updateScreen('screensaver')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
