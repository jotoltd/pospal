export interface Category {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  price: number;
  description: string;
  available: number;
  stock_count: number;
  track_stock: number;
  low_stock_threshold: number;
  modifiers: string; // JSON string of ModifierOption[]
  sort_order: number;
  created_at: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  menu_item_id?: number;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  modifiers: string; // JSON string of {id:string,name:string,price:number}[]
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  order_type: "collection" | "delivery" | "eat_in";
  status: "pending" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled" | "refunded";
  subtotal: number;
  tax: number;
  discount: number;
  delivery_fee: number;
  service_charge: number;
  tip: number;
  split_cash: number;
  split_card: number;
  total: number;
  payment_method: string;
  transaction_code?: string;
  notes: string;
  created_at: string;
  completed_at: string | null;
  table_number: string;
  delivery_address: string;
  staff_id: number | null;
  staff_name?: string;
  refund_amount: number;
  refund_reason: string;
  items?: OrderItem[];
}

export interface Settings {
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  tax_rate: string;
  currency_symbol: string;
  printer_type: string;
  printer_width: string;
  printer_brand: string;
  auto_print: string;
  order_counter: string;
  setup_complete: string;
  cash_drawer_enabled: string;
  cash_drawer_on_card: string;
  kitchen_printer: string;
  kitchen_printer_enabled: string;
  table_service_enabled: string;
  staff_login_required: string;
  manager_pin: string;
  current_staff_id: string;
  current_staff_name: string;
  delivery_fee_enabled: string;
  delivery_fee_amount: string;
  service_charge_enabled: string;
  service_charge_percent: string;
  tips_enabled: string;
  receipt_header: string;
  receipt_footer: string;
  logo_url: string;
  primary_color: string;
  accent_color: string;
  [key: string]: string;
}

export interface CartItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  modifiers: { id: string; name: string; price: number }[];
}

export interface Staff {
  id: number;
  name: string;
  pin: string;
  role: string;
  is_manager: number;
  active: number;
  hourly_rate?: number;
  created_at: string;
}

export interface Refund {
  id: number;
  order_id: number;
  amount: number;
  reason: string;
  staff_id: number;
  staff_name?: string;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  is_vip: number;
  allergies: string;
  notes: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
  last_order_date?: string;
}

export interface DiscountCode {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  is_happy_hour: number;
  happy_hour_start: string | null;
  happy_hour_end: string | null;
  active: number;
  created_at: string;
}
