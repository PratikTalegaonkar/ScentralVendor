export type Screen = 'screensaver' | 'welcome' | 'products' | 'payment' | 'processing' | 'success' | 'thank-you' | 'admin-login' | 'admin-panel';

export interface SelectedProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export interface VendingMachineState {
  currentScreen: Screen;
  selectedProduct: SelectedProduct | null;
  selectedPaymentMethod: string | null;
  currentOrder: number | null;
}
