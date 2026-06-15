import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal,
  StyleSheet, Dimensions, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  cream: '#FFF8EC', paper: '#FFFFFF', maroon: '#5B1A2B', maroonDark: '#3F0F1C',
  marigold: '#E8871E', marigoldLight: '#FBD9A8', gold: '#C9941F',
  pista: '#8FAE5D', pistaLight: '#E3EDD3', kumkum: '#C2304B', kumkumLight: '#F7DBE0',
  indigo: '#4F46E5', indigoLight: '#EEF2FF', text: '#3A1F16', textMuted: '#8A6F63', border: '#EFDFC8',
};

const CATEGORIES = ['सभी', 'लड्डू', 'बर्फी', 'बंगाली', 'अन्य'];
const CAT_COLORS = { 'लड्डू': COLORS.marigold, 'बर्फी': COLORS.gold, 'बंगाली': COLORS.pista, 'अन्य': COLORS.kumkum };

const SEED_PRODUCTS = [
  { id: 'p1', name: 'गुलाब जामुन', nameEn: 'Gulab Jamun', category: 'बंगाली', price: 360, stock: 12, restockTime: '' },
  { id: 'p2', name: 'काजू कतली', nameEn: 'Kaju Katli', category: 'बर्फी', price: 820, stock: 6, restockTime: '' },
  { id: 'p3', name: 'रसगुल्ला', nameEn: 'Rasgulla', category: 'बंगाली', price: 320, stock: 18, restockTime: '' },
  { id: 'p4', name: 'बेसन लड्डू', nameEn: 'Besan Ladoo', category: 'लड्डू', price: 400, stock: 10, restockTime: '' },
  { id: 'p5', name: 'मोतीचूर लड्डू', nameEn: 'Motichoor Ladoo', category: 'लड्डू', price: 380, stock: 1.5, restockTime: '' },
  { id: 'p6', name: 'सोन पापड़ी', nameEn: 'Soan Papdi', category: 'अन्य', price: 280, stock: 15, restockTime: '' },
  { id: 'p7', name: 'कलाकंद', nameEn: 'Kalakand', category: 'बर्फी', price: 450, stock: 8, restockTime: '' },
  { id: 'p8', name: 'जलेबी', nameEn: 'Jalebi', category: 'अन्य', price: 260, stock: 0, restockTime: '2 घंटे में' },
  { id: 'p9', name: 'मिल्क केक', nameEn: 'Milk Cake', category: 'बर्फी', price: 420, stock: 9, restockTime: '' },
  { id: 'p10', name: 'पिस्ता बर्फी', nameEn: 'Pista Barfi', category: 'बर्फी', price: 600, stock: 5, restockTime: '' },
];

const ORDER_STATUSES = [
  { key: 'pending', label: 'ऑर्डर मिला', icon: '📝' },
  { key: 'preparing', label: 'बन रहा है', icon: '🔥' },
  { key: 'ready', label: 'पैक तैयार', icon: '📦' },
  { key: 'delivered', label: 'डिलीवर हुआ', icon: '✅' },
];

const LOW_STOCK_THRESHOLD = 3;
const SCREEN_W = Dimensions.get('window').width;

function fmtRupee(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
function fmtWeight(kg) {
  if (kg < 1) return Math.round(kg * 1000) + ' ग्राम';
  return (kg % 1 === 0 ? kg : kg.toFixed(2)) + ' किलो';
}
function stockInfo(stock) {
  if (stock <= 0) return { label: 'स्टॉक खत्म', color: COLORS.kumkum, pct: 0 };
  if (stock < 2) return { label: 'बहुत कम स्टॉक', color: COLORS.kumkum, pct: Math.min(100, (stock / 10) * 100) };
  if (stock < 5) return { label: 'कम स्टॉक', color: COLORS.marigold, pct: Math.min(100, (stock / 10) * 100) };
  return { label: 'उपलब्ध', color: COLORS.pista, pct: Math.min(100, (stock / 10) * 100) };
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function getDayLabel(dateStr) {
  const d = new Date(dateStr);
  const days = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
  return days[d.getDay()];
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

// ---------- Small reusable components ----------

function BarChart({ data, colorFn, labelFn, height = 100 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: height + 28 }}>
      {data.map((d, i) => {
        const barH = max > 0 ? Math.round((d.value / max) * height) : 0;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', marginHorizontal: 3 }}>
            <Text style={{ fontSize: 9, color: COLORS.textMuted, fontWeight: '600', minHeight: 14, textAlign: 'center' }}>
              {d.value > 0 ? (labelFn ? labelFn(d.value) : String(d.value)) : ''}
            </Text>
            <View style={{
              width: '100%',
              height: d.value > 0 ? Math.max(barH, 4) : 0,
              borderRadius: 4,
              backgroundColor: colorFn ? colorFn(d, i) : COLORS.marigold,
            }} />
            <Text style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: '600', marginTop: 4 }}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <View style={styles.statCard}>
      <Text style={{ fontSize: 22, marginBottom: 4 }}>{icon}</Text>
      <Text style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: color || COLORS.maroon }}>{value}</Text>
      {sub ? <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

function LowStockBanner({ products, onGoToInventory }) {
  const alerts = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD);
  const [dismissed, setDismissed] = useState(false);
  if (alerts.length === 0 || dismissed) return null;
  const outOfStock = alerts.filter(p => p.stock <= 0);
  const lowStock = alerts.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);
  return (
    <View style={styles.banner}>
      <Text style={{ fontSize: 20, marginRight: 10 }}>🔔</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.maroon, marginBottom: 4 }}>
          स्टॉक अलर्ट — {alerts.length} आइटम पर ध्यान दें
        </Text>
        {outOfStock.length > 0 && (
          <Text style={{ fontSize: 12, color: COLORS.kumkum, fontWeight: '600', marginBottom: 2 }}>
            🚫 स्टॉक खत्म: {outOfStock.map(p => p.name).join(', ')}
          </Text>
        )}
        {lowStock.length > 0 && (
          <Text style={{ fontSize: 12, color: COLORS.marigold, fontWeight: '600' }}>
            ⚠️ कम स्टॉक: {lowStock.map(p => `${p.name} (${fmtWeight(p.stock)})`).join(', ')}
          </Text>
        )}
        <TouchableOpacity onPress={onGoToInventory} style={styles.bannerBtn}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.maroonDark }}>इन्वेंट्री अपडेट करें →</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => setDismissed(true)}>
        <Text style={{ fontSize: 18, color: COLORS.textMuted }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------- Main App ----------

export default function App() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState({});
  const [advanceCart, setAdvanceCart] = useState({});
  const [advanceInput, setAdvanceInput] = useState(null);
  const [advanceQtyDraft, setAdvanceQtyDraft] = useState('');
  const [view, setView] = useState('shop');
  const [dashTab, setDashTab] = useState('inventory');
  const [activeCategory, setActiveCategory] = useState('सभी');
  const [cartOpen, setCartOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [newItem, setNewItem] = useState({ name: '', nameEn: '', category: 'लड्डू', price: '', stock: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [orderFilter, setOrderFilter] = useState('सभी');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [analyticsRange, setAnalyticsRange] = useState('7d');

  useEffect(() => {
    (async () => {
      let p = SEED_PRODUCTS;
      try {
        const raw = await AsyncStorage.getItem('mithai_products');
        if (raw) p = JSON.parse(raw);
        else await AsyncStorage.setItem('mithai_products', JSON.stringify(SEED_PRODUCTS));
      } catch (e) {
        try { await AsyncStorage.setItem('mithai_products', JSON.stringify(SEED_PRODUCTS)); } catch (e2) {}
      }
      setProducts(p);
      let o = [];
      try {
        const raw = await AsyncStorage.getItem('mithai_orders');
        if (raw) o = JSON.parse(raw);
      } catch (e) {}
      setOrders(o);
      setLoading(false);
    })();
  }, []);

  function showMessage(msg) { setMessage(msg); setTimeout(() => setMessage(''), 3000); }

  async function persistProducts(next) {
    setProducts(next);
    try { await AsyncStorage.setItem('mithai_products', JSON.stringify(next)); } catch (e) { showMessage('प्रोडक्ट सेव नहीं हो पाया'); }
  }
  async function persistOrders(next) {
    setOrders(next);
    try { await AsyncStorage.setItem('mithai_orders', JSON.stringify(next)); } catch (e) { showMessage('ऑर्डर सेव नहीं हो पाया'); }
  }

  function adjustCart(productId, delta) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setCart(prev => {
      const current = prev[productId] || 0;
      let next = Math.round((current + delta) * 100) / 100;
      if (next < 0) next = 0;
      if (next > product.stock) next = product.stock;
      const updated = { ...prev };
      if (next <= 0) delete updated[productId];
      else updated[productId] = next;
      return updated;
    });
  }

  function openAdvanceInput(productId) {
    setAdvanceInput(productId);
    setAdvanceQtyDraft(advanceCart[productId] ? String(advanceCart[productId]) : '');
  }

  function confirmAdvanceOrder(productId) {
    const qty = parseFloat(advanceQtyDraft);
    const product = products.find(p => p.id === productId);
    if (!product || isNaN(qty) || qty <= 0) { showMessage('सही मात्रा डालें'); return; }
    setAdvanceCart(prev => ({ ...prev, [productId]: qty }));
    setAdvanceInput(null);
    setAdvanceQtyDraft('');
    showMessage(product.name + ' का एडवांस ऑर्डर जुड़ गया!');
  }

  function removeAdvanceItem(productId) {
    setAdvanceCart(prev => { const next = { ...prev }; delete next[productId]; return next; });
  }

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const product = products.find(p => p.id === id);
    return product ? { ...product, qty, subtotal: product.price * qty, isAdvance: false } : null;
  }).filter(Boolean);

  const advanceCartItems = Object.entries(advanceCart).map(([id, qty]) => {
    const product = products.find(p => p.id === id);
    return product ? { ...product, qty, subtotal: product.price * qty, isAdvance: true } : null;
  }).filter(Boolean);

  const allCartItems = [...cartItems, ...advanceCartItems];
  const cartTotal = allCartItems.reduce((s, i) => s + i.subtotal, 0);
  const cartCount = allCartItems.length;

  async function placeOrder() {
    if (allCartItems.length === 0) { showMessage('कार्ट खाली है'); return; }
    if (!checkoutName.trim()) { showMessage('अपना नाम लिखें'); return; }
    const order = {
      id: 'ORD' + Date.now(), customerName: checkoutName.trim(), phone: checkoutPhone.trim(),
      items: allCartItems.map(i => ({ id: i.id, name: i.name, nameEn: i.nameEn, qty: i.qty, price: i.price, subtotal: i.subtotal, isAdvance: i.isAdvance })),
      total: cartTotal, status: 'pending', time: new Date().toISOString(),
    };
    const nextProducts = products.map(p => {
      const inCart = cart[p.id];
      if (!inCart) return p;
      return { ...p, stock: Math.max(0, Math.round((p.stock - inCart) * 100) / 100) };
    });
    await persistProducts(nextProducts);
    await persistOrders([order, ...orders]);
    setCart({}); setAdvanceCart({}); setCheckoutName(''); setCheckoutPhone(''); setCartOpen(false);
    showMessage('ऑर्डर मिल गया! धन्यवाद 🙏');
  }

  async function advanceOrderStatus(orderId) {
    const next = orders.map(o => {
      if (o.id !== orderId) return o;
      const idx = ORDER_STATUSES.findIndex(s => s.key === o.status);
      if (idx < ORDER_STATUSES.length - 1) return { ...o, status: ORDER_STATUSES[idx + 1].key };
      return o;
    });
    await persistOrders(next);
  }

  async function updateProductField(id, field, value) {
    await persistProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  async function deleteProduct(id) {
    await persistProducts(products.filter(p => p.id !== id));
    setConfirmDelete(null);
  }

  async function addProduct() {
    if (!newItem.name.trim() || newItem.price === '' || newItem.stock === '') { showMessage('सभी जानकारी भरें'); return; }
    const product = {
      id: 'p' + Date.now(), name: newItem.name.trim(), nameEn: newItem.nameEn.trim() || newItem.name.trim(),
      category: newItem.category, price: Number(newItem.price), stock: Number(newItem.stock), restockTime: '',
    };
    await persistProducts([...products, product]);
    setNewItem({ name: '', nameEn: '', category: 'लड्डू', price: '', stock: '' });
    setShowAddForm(false);
    showMessage('नया आइटम जुड़ गया');
  }

  const analytics = useMemo(() => {
    const today = todayStr();
    const last7 = getLast7Days();
    const allOrdersForRange = (range) => {
      if (range === 'today') return orders.filter(o => o.time.slice(0, 10) === today);
      if (range === '7d') return orders.filter(o => o.time.slice(0, 10) >= last7[0]);
      if (range === '30d') { const d30 = new Date(); d30.setDate(d30.getDate() - 29); return orders.filter(o => new Date(o.time) >= d30); }
      return orders;
    };
    const rangeOrders = allOrdersForRange(analyticsRange);
    const revenueByDay = last7.map(dateStr => ({ label: getDayLabel(dateStr), value: orders.filter(o => o.time.slice(0, 10) === dateStr).reduce((s, o) => s + o.total, 0) }));
    const ordersByDay = last7.map(dateStr => ({ label: getDayLabel(dateStr), value: orders.filter(o => o.time.slice(0, 10) === dateStr).length }));
    const itemTotals = {};
    rangeOrders.forEach(o => { o.items.forEach(i => { if (!itemTotals[i.name]) itemTotals[i.name] = { name: i.name, qty: 0, revenue: 0 }; itemTotals[i.name].qty += i.qty; itemTotals[i.name].revenue += i.subtotal; }); });
    const topItems = Object.values(itemTotals).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const totalRevenue = rangeOrders.reduce((s, o) => s + o.total, 0);
    const todayRevenue = orders.filter(o => o.time.slice(0, 10) === today).reduce((s, o) => s + o.total, 0);
    const todayOrders = orders.filter(o => o.time.slice(0, 10) === today).length;
    const pendingOrders = orders.filter(o => o.status !== 'delivered').length;
    const catTotals = {};
    rangeOrders.forEach(o => { o.items.forEach(i => { const prod = products.find(p => p.id === i.id); const cat = prod ? prod.category : 'अन्य'; catTotals[cat] = (catTotals[cat] || 0) + i.subtotal; }); });
    return { revenueByDay, ordersByDay, topItems, totalRevenue, todayRevenue, todayOrders, pendingOrders, catTotals, rangeOrders };
  }, [orders, products, analyticsRange]);

  const lowStockItems = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD);
  const visibleProducts = activeCategory === 'सभी' ? products : products.filter(p => p.category === activeCategory);
  const visibleOrders = orderFilter === 'सभी' ? orders : orders.filter(o => o.status === orderFilter);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.maroon, fontSize: 16 }}>लोड हो रहा है...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.maroon} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>श्री मिष्ठान भंडार</Text>
          <Text style={styles.headerSub}>ताज़ी मिठाई, हर दिन</Text>
        </View>
        <View style={styles.navPill}>
          {[['shop', '🛍️ दुकान'], ['dashboard', '📊 डैशबोर्ड']].map(([v, label]) => (
            <TouchableOpacity key={v} onPress={() => setView(v)} style={[styles.navBtn, view === v && { backgroundColor: COLORS.marigold }]}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: view === v ? COLORS.maroonDark : COLORS.cream }}>
                {label}{v === 'dashboard' && lowStockItems.length > 0 ? ` (${lowStockItems.length})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Toast message */}
      {message ? (
        <View style={styles.toast}>
          <Text style={{ color: COLORS.cream, fontSize: 13, fontWeight: '600' }}>{message}</Text>
        </View>
      ) : null}

      {view === 'shop' && (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }}>
          <LowStockBanner products={products} onGoToInventory={() => { setView('dashboard'); setDashTab('inventory'); }} />

          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.catBtn, { borderColor: activeCategory === cat ? COLORS.marigold : COLORS.border, backgroundColor: activeCategory === cat ? COLORS.marigold : COLORS.paper }]}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: activeCategory === cat ? COLORS.maroonDark : COLORS.textMuted }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product list */}
          {visibleProducts.map(product => {
            const info = stockInfo(product.stock);
            const qty = cart[product.id] || 0;
            const advQty = advanceCart[product.id] || 0;
            const out = product.stock <= 0;
            const isLow = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
            const showingAdvInput = advanceInput === product.id;
            return (
              <View key={product.id} style={styles.productCard}>
                {isLow && (
                  <View style={styles.lowTag}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.marigold }}>⚠️ सीमित स्टॉक</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={[styles.avatar, { backgroundColor: CAT_COLORS[product.category] || COLORS.marigold }]}>
                    <Text style={{ color: COLORS.paper, fontSize: 18, fontWeight: '700' }}>{product.name.slice(0, 1)}</Text>
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ fontWeight: '600', fontSize: 15 }}>{product.name}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{product.nameEn}</Text>
                  </View>
                </View>

                <Text style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.gold }}>{fmtRupee(product.price)}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted }}> / किलो</Text>
                </Text>

                <View style={{ marginBottom: 12 }}>
                  <View style={styles.stockTrack}>
                    <View style={{ height: '100%', borderRadius: 999, width: `${info.pct}%`, backgroundColor: info.color }} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: info.color }}>
                    {info.label}{!out ? ` · ${fmtWeight(product.stock)} बचा` : ''}
                  </Text>
                  {product.restockTime ? (
                    <View style={styles.restockTag}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.indigo }}>🕐 {product.restockTime} में उपलब्ध होगी</Text>
                    </View>
                  ) : null}
                </View>

                {!out && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={styles.qtyControl}>
                      <TouchableOpacity disabled={qty <= 0} onPress={() => adjustCart(product.id, -0.25)} style={[styles.qtyBtn, { backgroundColor: COLORS.cream, opacity: qty <= 0 ? 0.4 : 1 }]}>
                        <Text style={{ fontWeight: '700', fontSize: 16, color: COLORS.maroon }}>−</Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 13, fontWeight: '600', minWidth: 64, textAlign: 'center' }}>{qty > 0 ? fmtWeight(qty) : '— —'}</Text>
                      <TouchableOpacity disabled={qty >= product.stock} onPress={() => adjustCart(product.id, 0.25)} style={[styles.qtyBtn, { backgroundColor: COLORS.marigold, opacity: qty >= product.stock ? 0.4 : 1 }]}>
                        <Text style={{ fontWeight: '700', fontSize: 16, color: COLORS.maroonDark }}>+</Text>
                      </TouchableOpacity>
                    </View>
                    {qty > 0 && <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.maroon }}>{fmtRupee(product.price * qty)}</Text>}
                  </View>
                )}

                {!showingAdvInput && advQty === 0 && (
                  <TouchableOpacity onPress={() => openAdvanceInput(product.id)} style={styles.advanceBtn}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.indigo }}>
                      📋 {out ? 'एडवांस ऑर्डर दें' : 'ज़्यादा चाहिए? एडवांस ऑर्डर दें'}
                    </Text>
                  </TouchableOpacity>
                )}

                {showingAdvInput && (
                  <View style={styles.advancePanel}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.indigo, marginBottom: 4 }}>📋 कितना किलो चाहिए?</Text>
                    {!out && <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>अभी {fmtWeight(product.stock)} उपलब्ध है</Text>}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        keyboardType="numeric"
                        placeholder="जैसे: 2 या 0.5"
                        value={advanceQtyDraft}
                        onChangeText={setAdvanceQtyDraft}
                        style={styles.advanceInput}
                      />
                      <TouchableOpacity onPress={() => confirmAdvanceOrder(product.id)} style={styles.advanceConfirmBtn}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>जोड़ें</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setAdvanceInput(null)} style={styles.advanceCancelBtn}>
                        <Text style={{ fontSize: 12, color: COLORS.textMuted }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {advQty > 0 && !showingAdvInput && (
                  <View style={styles.advanceSummary}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.indigo, flex: 1 }}>
                      📋 एडवांस: {fmtWeight(advQty)} · {fmtRupee(product.price * advQty)}
                    </Text>
                    <TouchableOpacity onPress={() => openAdvanceInput(product.id)} style={styles.smallPillIndigo}>
                      <Text style={{ fontSize: 11, color: COLORS.indigo }}>बदलें</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeAdvanceItem(product.id)} style={[styles.smallPillIndigo, { backgroundColor: COLORS.kumkumLight, marginLeft: 4 }]}>
                      <Text style={{ fontSize: 11, color: COLORS.kumkum }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
          {visibleProducts.length === 0 && (
            <Text style={{ textAlign: 'center', padding: 40, color: COLORS.textMuted }}>इस केटेगरी में कोई आइटम नहीं है</Text>
          )}
        </ScrollView>
      )}

      {/* Floating cart button */}
      {view === 'shop' && (
        <TouchableOpacity onPress={() => setCartOpen(true)} style={styles.cartFab}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: COLORS.maroonDark }}>
            🛒 कार्ट {cartCount > 0 ? `(${cartCount})` : ''} {cartTotal > 0 ? `· ${fmtRupee(cartTotal)}` : ''}
          </Text>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal visible={cartOpen} animationType="slide" transparent onRequestClose={() => setCartOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.cartSheet}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sheetTitle}>आपका कार्ट</Text>
              <TouchableOpacity onPress={() => setCartOpen(false)}>
                <Text style={{ fontSize: 26, color: COLORS.maroon }}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {allCartItems.length === 0 ? (
                <Text style={{ color: COLORS.textMuted }}>कार्ट खाली है। पहले कुछ मिठाई चुनें 🍬</Text>
              ) : (
                <>
                  {cartItems.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={styles.sectionLabel}>तुरंत उपलब्ध</Text>
                      {cartItems.map(item => (
                        <View key={item.id} style={styles.cartRow}>
                          <View>
                            <Text style={{ fontWeight: '600', fontSize: 14 }}>{item.name}</Text>
                            <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{fmtWeight(item.qty)} × {fmtRupee(item.price)}/किलो</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.gold, marginRight: 8 }}>{fmtRupee(item.subtotal)}</Text>
                            <TouchableOpacity onPress={() => adjustCart(item.id, -item.qty)} style={styles.removeBtn}>
                              <Text style={{ fontWeight: '700', color: COLORS.kumkum }}>×</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  {advanceCartItems.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={[styles.sectionLabel, { color: COLORS.indigo }]}>📋 एडवांस ऑर्डर — बनाकर दिया जाएगा</Text>
                      {advanceCartItems.map(item => (
                        <View key={item.id} style={[styles.cartRow, { backgroundColor: COLORS.indigoLight, borderColor: `${COLORS.indigo}44` }]}>
                          <View>
                            <Text style={{ fontWeight: '600', fontSize: 14 }}>{item.name} <Text style={styles.advanceBadge}>एडवांस</Text></Text>
                            <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{fmtWeight(item.qty)} × {fmtRupee(item.price)}/किलो</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.indigo, marginRight: 8 }}>{fmtRupee(item.subtotal)}</Text>
                            <TouchableOpacity onPress={() => removeAdvanceItem(item.id)} style={styles.removeBtn}>
                              <Text style={{ fontWeight: '700', color: COLORS.kumkum }}>×</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.totalRow}>
                    <Text style={{ fontWeight: '600' }}>कुल</Text>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.maroon }}>{fmtRupee(cartTotal)}</Text>
                  </View>
                  <TextInput placeholder="आपका नाम *" value={checkoutName} onChangeText={setCheckoutName} style={styles.input} />
                  <TextInput placeholder="फ़ोन नंबर (वैकल्पिक)" value={checkoutPhone} onChangeText={setCheckoutPhone} keyboardType="phone-pad" style={styles.input} />
                  {advanceCartItems.length > 0 && (
                    <View style={styles.infoBox}>
                      <Text style={{ fontSize: 12, color: COLORS.indigo }}>ℹ️ एडवांस ऑर्डर वाली मिठाई बनाकर दी जाएगी। दुकानदार आपसे संपर्क करेंगे।</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={placeOrder} style={styles.placeOrderBtn}>
                    <Text style={{ fontWeight: '600', fontSize: 15, color: COLORS.maroonDark }}>ऑर्डर करें</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Dashboard */}
      {view === 'dashboard' && (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 64 }}>
          <LowStockBanner products={products} onGoToInventory={() => setDashTab('inventory')} />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            {[['inventory', '📦 इन्वेंट्री'], ['orders', '🧾 ऑर्डर्स'], ['analytics', '📊 Analytics']].map(([tab, label]) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setDashTab(tab)}
                style={[styles.dashTabBtn, dashTab === tab && { backgroundColor: COLORS.maroon }]}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: dashTab === tab ? COLORS.cream : COLORS.text }}>
                  {label}
                  {tab === 'orders' && orders.filter(o => o.status !== 'delivered').length > 0 ? ` (${orders.filter(o => o.status !== 'delivered').length})` : ''}
                  {tab === 'inventory' && lowStockItems.length > 0 ? ` (${lowStockItems.length})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Inventory Tab */}
          {dashTab === 'inventory' && (
            <View>
              <TouchableOpacity onPress={() => setShowAddForm(s => !s)} style={styles.addItemBtn}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.maroonDark }}>{showAddForm ? 'बंद करें' : '+ नया आइटम जोड़ें'}</Text>
              </TouchableOpacity>

              {showAddForm && (
                <View style={styles.addForm}>
                  <TextInput placeholder="नाम (हिंदी) *" value={newItem.name} onChangeText={t => setNewItem({ ...newItem, name: t })} style={styles.formInput} />
                  <TextInput placeholder="Name (English)" value={newItem.nameEn} onChangeText={t => setNewItem({ ...newItem, nameEn: t })} style={styles.formInput} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                    {CATEGORIES.filter(c => c !== 'सभी').map(c => (
                      <TouchableOpacity key={c} onPress={() => setNewItem({ ...newItem, category: c })} style={[styles.catChip, newItem.category === c && { backgroundColor: COLORS.marigold }]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: newItem.category === c ? COLORS.maroonDark : COLORS.textMuted }}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput placeholder="कीमत ₹/किलो *" value={newItem.price} onChangeText={t => setNewItem({ ...newItem, price: t })} keyboardType="numeric" style={styles.formInput} />
                  <TextInput placeholder="स्टॉक (किलो) *" value={newItem.stock} onChangeText={t => setNewItem({ ...newItem, stock: t })} keyboardType="numeric" style={styles.formInput} />
                  <TouchableOpacity onPress={addProduct} style={styles.saveBtn}>
                    <Text style={{ fontWeight: '600', fontSize: 13, color: COLORS.maroonDark }}>सेव करें</Text>
                  </TouchableOpacity>
                </View>
              )}

              {products.map(product => {
                const info = stockInfo(product.stock);
                const isLow = product.stock < 5;
                return (
                  <View key={product.id} style={[styles.invCard, { borderColor: product.stock <= LOW_STOCK_THRESHOLD ? COLORS.marigold : COLORS.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={[styles.avatarSmall, { backgroundColor: CAT_COLORS[product.category] || COLORS.marigold }]}>
                        <Text style={{ color: COLORS.paper, fontSize: 14, fontWeight: '700' }}>{product.name.slice(0, 1)}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ fontWeight: '600', fontSize: 14 }}>{product.name}</Text>
                        <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{product.category} · {product.nameEn}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: info.color + '22' }]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: info.color }}>{info.label}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 12, color: COLORS.textMuted, marginRight: 4 }}>₹</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(product.price)}
                        onChangeText={t => updateProductField(product.id, 'price', Number(t) || 0)}
                        style={styles.smallInput}
                      />
                      <Text style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 4, marginRight: 16 }}>/किलो</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(product.stock)}
                        onChangeText={t => updateProductField(product.id, 'stock', Number(t) || 0)}
                        style={[styles.smallInput, { borderColor: product.stock <= LOW_STOCK_THRESHOLD ? COLORS.marigold : COLORS.border }]}
                      />
                      <Text style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 4 }}>किलो</Text>
                    </View>
                    {confirmDelete === product.id ? (
                      <TouchableOpacity onPress={() => deleteProduct(product.id)} style={[styles.delBtn, { backgroundColor: COLORS.kumkum }]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.cream }}>पक्का हटाएं?</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => setConfirmDelete(product.id)} style={[styles.delBtn, { backgroundColor: COLORS.kumkumLight }]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.kumkum }}>हटाएं</Text>
                      </TouchableOpacity>
                    )}
                    {isLow && (
                      <View style={styles.restockRow}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.indigo, marginRight: 8 }}>🕐 Restock कब?</Text>
                        <TextInput
                          placeholder={product.stock <= 0 ? 'जैसे: 2 घंटे में, कल सुबह तक…' : 'और stock कब आएगी?'}
                          value={product.restockTime || ''}
                          onChangeText={t => updateProductField(product.id, 'restockTime', t)}
                          style={styles.restockInput}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Orders Tab */}
          {dashTab === 'orders' && (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {['सभी', ...ORDER_STATUSES.map(s => s.key)].map(key => {
                  const label = key === 'सभी' ? 'सभी' : ORDER_STATUSES.find(s => s.key === key).label;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setOrderFilter(key)}
                      style={[styles.catBtn, { borderColor: orderFilter === key ? COLORS.marigold : COLORS.border, backgroundColor: orderFilter === key ? COLORS.marigold : COLORS.paper }]}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: orderFilter === key ? COLORS.maroonDark : COLORS.textMuted }}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {visibleOrders.length === 0 ? (
                <Text style={{ textAlign: 'center', padding: 40, color: COLORS.textMuted }}>कोई ऑर्डर नहीं है</Text>
              ) : (
                visibleOrders.map(order => {
                  const statusIdx = ORDER_STATUSES.findIndex(s => s.key === order.status);
                  const regularItems = order.items.filter(i => !i.isAdvance);
                  const advItems = order.items.filter(i => i.isAdvance);
                  return (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '600', fontSize: 14 }}>
                            {order.customerName}{order.phone ? ` · ${order.phone}` : ''}
                            {advItems.length > 0 ? <Text style={styles.advanceBadge}> 📋 एडवांस</Text> : null}
                          </Text>
                          <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{new Date(order.time).toLocaleString('hi-IN')}</Text>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.gold }}>{fmtRupee(order.total)}</Text>
                      </View>
                      {regularItems.length > 0 && (
                        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>
                          {regularItems.map(i => `${i.name} (${fmtWeight(i.qty)})`).join(', ')}
                        </Text>
                      )}
                      {advItems.length > 0 && (
                        <View style={styles.advItemsBox}>
                          <Text style={{ fontSize: 13, color: COLORS.indigo }}>
                            📋 एडवांस: {advItems.map(i => `${i.name} (${fmtWeight(i.qty)})`).join(', ')}
                          </Text>
                        </View>
                      )}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                        {ORDER_STATUSES.map((s, idx) => (
                          <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 6, marginBottom: 4 }}>
                            <Text style={{ fontSize: 16, opacity: idx <= statusIdx ? 1 : 0.25 }}>{s.icon}</Text>
                            <Text style={{ fontSize: 11, fontWeight: '500', color: idx <= statusIdx ? COLORS.maroon : COLORS.textMuted, opacity: idx <= statusIdx ? 1 : 0.5, marginLeft: 2, marginRight: 4 }}>{s.label}</Text>
                            {idx < ORDER_STATUSES.length - 1 && <Text style={{ color: COLORS.border, fontSize: 12 }}>→</Text>}
                          </View>
                        ))}
                      </View>
                      {order.status !== 'delivered' && (
                        <TouchableOpacity onPress={() => advanceOrderStatus(order.id)} style={styles.advanceStatusBtn}>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.maroonDark }}>आगे बढ़ाएं →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Analytics Tab */}
          {dashTab === 'analytics' && (
            <View>
              <View style={styles.rangeSelector}>
                {[['today', 'आज'], ['7d', '7 दिन'], ['30d', '30 दिन']].map(([r, label]) => (
                  <TouchableOpacity key={r} onPress={() => setAnalyticsRange(r)} style={[styles.rangeBtn, analyticsRange === r && { backgroundColor: COLORS.maroon }]}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: analyticsRange === r ? COLORS.cream : COLORS.textMuted }}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.statGrid}>
                <StatCard icon="💰" label="कुल बिक्री" value={fmtRupee(analytics.totalRevenue)} sub={analyticsRange === 'today' ? 'आज' : analyticsRange === '7d' ? 'पिछले 7 दिन' : 'पिछले 30 दिन'} color={COLORS.maroon} />
                <StatCard icon="🛒" label="ऑर्डर" value={String(analytics.rangeOrders.length)} sub="इस अवधि में" color={COLORS.gold} />
                <StatCard icon="📅" label="आज की कमाई" value={fmtRupee(analytics.todayRevenue)} sub={`${analytics.todayOrders} ऑर्डर`} color={COLORS.pista} />
                <StatCard icon="⏳" label="पेंडिंग ऑर्डर" value={String(analytics.pendingOrders)} sub="अभी बाकी" color={analytics.pendingOrders > 0 ? COLORS.kumkum : COLORS.pista} />
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>📈 पिछले 7 दिन — रोज़ की कमाई</Text>
                {analytics.revenueByDay.every(d => d.value === 0) ? (
                  <Text style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>अभी कोई ऑर्डर नहीं है — ऑर्डर लेने के बाद यहाँ दिखेगा</Text>
                ) : (
                  <BarChart
                    data={analytics.revenueByDay}
                    labelFn={v => v >= 1000 ? '₹' + Math.round(v / 1000) + 'K' : '₹' + v}
                    colorFn={(d) => { const maxV = Math.max(...analytics.revenueByDay.map(x => x.value)); return d.value === maxV ? COLORS.maroon : COLORS.marigoldLight; }}
                    height={110}
                  />
                )}
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>🛒 पिछले 7 दिन — ऑर्डर की संख्या</Text>
                {analytics.ordersByDay.every(d => d.value === 0) ? (
                  <Text style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>अभी कोई ऑर्डर नहीं है</Text>
                ) : (
                  <BarChart data={analytics.ordersByDay} colorFn={() => COLORS.pistaLight} height={80} />
                )}
              </View>

              <View style={styles.chartCard}>
                <Text style={[styles.chartTitle, { marginBottom: 12 }]}>🏆 सबसे ज़्यादा बिकी मिठाई</Text>
                {analytics.topItems.length === 0 ? (
                  <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>अभी डेटा नहीं है</Text>
                ) : (
                  analytics.topItems.map((item, i) => {
                    const maxRev = analytics.topItems[0].revenue;
                    const pct = maxRev > 0 ? (item.revenue / maxRev) * 100 : 0;
                    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                    return (
                      <View key={item.name} style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600' }}>{medals[i]} {item.name}</Text>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.gold }}>{fmtRupee(item.revenue)}</Text>
                        </View>
                        <View style={styles.stockTrack}>
                          <View style={{ height: '100%', borderRadius: 999, width: `${pct}%`, backgroundColor: i === 0 ? COLORS.maroon : COLORS.marigoldLight }} />
                        </View>
                        <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{fmtWeight(item.qty)} बेचा</Text>
                      </View>
                    );
                  })
                )}
              </View>

              {Object.keys(analytics.catTotals).length > 0 && (
                <View style={styles.chartCard}>
                  <Text style={[styles.chartTitle, { marginBottom: 12 }]}>📂 केटेगरी वाइज़ बिक्री</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {Object.entries(analytics.catTotals).sort((a, b) => b[1] - a[1]).map(([cat, rev]) => (
                      <View key={cat} style={[styles.catTotalCard, { backgroundColor: `${CAT_COLORS[cat] || COLORS.marigold}18`, borderColor: `${CAT_COLORS[cat] || COLORS.marigold}44` }]}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: CAT_COLORS[cat] || COLORS.marigold, marginBottom: 4 }}>{cat}</Text>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.maroon }}>{fmtRupee(rev)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { backgroundColor: COLORS.maroon, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  headerTitle: { fontSize: 22, color: COLORS.marigoldLight, fontWeight: '700' },
  headerSub: { fontSize: 12, color: COLORS.cream, opacity: 0.75 },
  navPill: { flexDirection: 'row', borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.marigold, marginTop: 8 },
  navBtn: { paddingVertical: 8, paddingHorizontal: 14 },
  toast: { position: 'absolute', top: 8, left: '50%', transform: [{ translateX: -80 }], backgroundColor: COLORS.maroon, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, zIndex: 999, minWidth: 160, alignItems: 'center' },
  banner: { backgroundColor: '#FFFBF0', borderWidth: 1.5, borderColor: COLORS.marigold, borderRadius: 14, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start' },
  bannerBtn: { marginTop: 8, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, backgroundColor: COLORS.marigold },
  catBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, marginRight: 8 },
  productCard: { backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 16, marginBottom: 14 },
  lowTag: { backgroundColor: '#FFF3E0', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, marginBottom: 8, alignSelf: 'flex-start' },
  avatar: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarSmall: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  stockTrack: { height: 6, borderRadius: 999, backgroundColor: COLORS.border, overflow: 'hidden', marginBottom: 4 },
  restockTag: { marginTop: 4, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, backgroundColor: COLORS.indigoLight, alignSelf: 'flex-start' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, padding: 4 },
  qtyBtn: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  advanceBtn: { width: '100%', paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.indigoLight, borderWidth: 1, borderColor: COLORS.indigo, borderStyle: 'dashed' },
  advancePanel: { marginTop: 4, borderRadius: 12, padding: 12, backgroundColor: COLORS.indigoLight, borderWidth: 1, borderColor: `${COLORS.indigo}44` },
  advanceInput: { flex: 1, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: `${COLORS.indigo}66`, backgroundColor: COLORS.paper, fontSize: 13, marginRight: 6 },
  advanceConfirmBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: COLORS.indigo, marginRight: 6 },
  advanceCancelBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: COLORS.border },
  advanceSummary: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 10, backgroundColor: COLORS.indigoLight, borderWidth: 1, borderColor: `${COLORS.indigo}44` },
  smallPillIndigo: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, backgroundColor: `${COLORS.indigo}22` },
  cartFab: { position: 'absolute', bottom: 20, right: 20, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: COLORS.marigold, elevation: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  cartSheet: { backgroundColor: COLORS.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  sheetTitle: { fontSize: 24, color: COLORS.maroon, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8 },
  cartRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 14, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  removeBtn: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.kumkumLight },
  advanceBadge: { fontSize: 10, color: COLORS.indigo, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border, marginBottom: 16 },
  input: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, fontSize: 14, backgroundColor: COLORS.paper, marginBottom: 8 },
  infoBox: { marginBottom: 12, padding: 10, borderRadius: 10, backgroundColor: COLORS.indigoLight },
  placeOrderBtn: { width: '100%', paddingVertical: 12, borderRadius: 999, alignItems: 'center', backgroundColor: COLORS.marigold, marginBottom: 12 },
  dashTabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.paper, marginRight: 8, marginBottom: 8 },
  addItemBtn: { marginBottom: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: COLORS.marigold, alignSelf: 'flex-start' },
  addForm: { borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.paper },
  formInput: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, fontSize: 13, marginBottom: 8 },
  catChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, marginBottom: 8 },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: COLORS.pista, alignItems: 'center' },
  invCard: { borderRadius: 14, borderWidth: 1, backgroundColor: COLORS.paper, padding: 12, marginBottom: 8 },
  statusPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  smallInput: { width: 64, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, fontSize: 13, backgroundColor: COLORS.paper },
  delBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, alignSelf: 'flex-start', marginTop: 4 },
  restockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, borderStyle: 'dashed' },
  restockInput: { flex: 1, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: `${COLORS.indigo}55`, backgroundColor: COLORS.indigoLight, fontSize: 12 },
  orderCard: { borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.paper, marginBottom: 12 },
  advItemsBox: { borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: COLORS.indigoLight },
  advanceStatusBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: COLORS.pista, alignSelf: 'flex-start' },
  rangeSelector: { flexDirection: 'row', marginBottom: 20, backgroundColor: COLORS.paper, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'flex-start' },
  rangeBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 9 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24, marginHorizontal: -4 },
  statCard: { backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 14, width: (SCREEN_W - 28 - 24) / 2, margin: 4 },
  chartCard: { backgroundColor: COLORS.paper, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: COLORS.maroon, marginBottom: 16 },
  catTotalCard: { borderRadius: 12, padding: 12, borderWidth: 1, width: (SCREEN_W - 28 - 20) / 2, margin: 4 },
});
