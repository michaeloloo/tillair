import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  History,
  Home,
  Phone,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import {
  calculateBalance,
  calculateCommission,
  buildUssd,
  DEFAULT_RATE,
  makeSale,
  normalizeKenyanPhone,
} from './lib/sales';
import {
  clearLocalData,
  deleteSale,
  getAllSales,
  getSetting,
  saveSale,
  saveSetting,
} from './lib/storage';

const money = (value) => `KES ${Number(value || 0).toLocaleString('en-KE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const shortMoney = (value) => `KES ${Number(value || 0).toLocaleString('en-KE', {
  maximumFractionDigits: 2,
})}`;

function formatPhone(phone) {
  const value = String(phone || '');
  if (/^254\d{9}$/.test(value)) return `0${value.slice(3, 6)} ${value.slice(6, 9)} ${value.slice(9)}`;
  return value;
}

function formatDate(value) {
  return new Date(value).toLocaleString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function isToday(value) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function Logo() {
  return (
    <div className="brand">
      <img src="/logo-placeholder.svg" alt="TillAir" />
      <div>
        <strong>TillAir</strong>
        <span>Airtime sales made simple</span>
      </div>
    </div>
  );
}

function Layout({ page, setPage, children, online }) {
  const links = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'sell', label: 'Sell Airtime', icon: Plus },
    { id: 'sales', label: 'Sales History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <nav>
          {links.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? 'nav-item active' : 'nav-item'} onClick={() => setPage(id)}>
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-status">
          <span className={online ? 'status-dot online' : 'status-dot'} />
          {online ? 'Online' : 'Offline'}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <small>{online ? 'Ready' : 'Offline mode'}</small>
            <h1>{links.find((item) => item.id === page)?.label || 'TillAir'}</h1>
          </div>
          <div className="top-logo"><Logo /></div>
        </header>
        {!online && (
          <div className="offline-banner">
            <span>Offline</span>
            Your records are stored safely on this phone. Airtime calls still require mobile network service.
          </div>
        )}
        <section className="content">{children}</section>
      </main>

      <nav className="bottom-nav">
        {links.map(({ id, label, icon: Icon }) => (
          <button key={id} className={page === id ? 'bottom-item active' : 'bottom-item'} onClick={() => setPage(id)}>
            <Icon />
            <span>{label === 'Sell Airtime' ? 'Sell' : label.replace(' History', '')}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function EmptyState({ title, text }) {
  return <div className="empty"><History /><strong>{title}</strong><span>{text}</span></div>;
}

function SaleRow({ sale, onDelete }) {
  return (
    <div className="sale-row">
      <div className="sale-main">
        <div className="phone-icon"><Phone /></div>
        <div>
          <strong>{formatPhone(sale.phone)}</strong>
          <span>{formatDate(sale.created_at)}</span>
        </div>
      </div>
      <div className="sale-amount">
        <strong>{shortMoney(sale.amount)}</strong>
        <span>+ {shortMoney(sale.commission)}</span>
      </div>
      {onDelete && <button className="delete-button" title="Delete sale" onClick={() => onDelete(sale)}><Trash2 /></button>}
    </div>
  );
}

function Dashboard({ sales, startingBalance, rate, setPage }) {
  const today = sales.filter((sale) => isToday(sale.created_at));
  const todaySales = today.reduce((sum, sale) => sum + Number(sale.amount), 0);
  const todayCommission = today.reduce((sum, sale) => sum + Number(sale.commission), 0);
  const balance = calculateBalance(startingBalance, sales, rate);

  return (
    <div className="page">
      <div className="hero">
        <div>
          <span className="eyebrow">TODAY</span>
          <h2>Sell airtime quickly.</h2>
          <p>Enter a number and amount, open the dialer, complete the transaction, then confirm it here.</p>
        </div>
        <button className="primary-button hero-button" onClick={() => setPage('sell')}><Plus /> Sell Airtime</button>
      </div>

      <div className="balance-card">
        <div>
          <span>Estimated Till Balance</span>
          <strong>{money(balance)}</strong>
          <small>Based on your starting balance and confirmed sales.</small>
        </div>
        <div className="balance-icon"><CircleDollarSign /></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><span>Today's Sales</span><strong>{money(todaySales)}</strong><small>{today.length} transaction{today.length === 1 ? '' : 's'}</small></div>
        <div className="stat-card"><span>Today's Commission</span><strong className="green-text">{money(todayCommission)}</strong><small>{Number(rate).toFixed(2)}% commission</small></div>
        <div className="stat-card"><span>Total Sales</span><strong>{money(sales.reduce((sum, sale) => sum + Number(sale.amount), 0))}</strong><small>{sales.length} confirmed transaction{sales.length === 1 ? '' : 's'}</small></div>
      </div>

      <div className="section-heading">
        <div><span className="eyebrow">RECENT SALES</span><h3>Latest transactions</h3></div>
        <button className="text-button" onClick={() => setPage('sales')}>View all <ChevronRight /></button>
      </div>
      <div className="card">
        {sales.slice(0, 7).map((sale) => <SaleRow key={sale.id} sale={sale} />)}
        {!sales.length && <EmptyState title="No sales yet" text="Your confirmed airtime sales will appear here." />}
      </div>
    </div>
  );
}

function Sell({ storeNumber, rate, onPending, setPage }) {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [ussd, setUssd] = useState('');

  const commission = calculateCommission(amount, rate);

  function buy(event) {
    event.preventDefault();
    try {
      const code = buildUssd(storeNumber, phone, amount);
      setUssd(code);
      onPending({ phone, amount: Number(amount), rate: Number(rate) });
      window.location.href = `tel:${encodeURIComponent(code)}`;
    } catch (err) {
      setError(err.message);
    }
  }

  const hasStore = Boolean(String(storeNumber || '').trim());

  return (
    <div className="page narrow-page">
      <div className="intro">
        <span className="eyebrow">NEW SALE</span>
        <h2>Sell airtime</h2>
        <p>Fill in the customer's number and the airtime amount. TillAir prepares the USSD code for you.</p>
      </div>

      {!hasStore && (
        <div className="warning-card">
          <strong>Store number needed</strong>
          <span>Save your Safaricom store number in Settings before making your first sale.</span>
          <button className="text-button" onClick={() => setPage('settings')}>Open Settings <ChevronRight /></button>
        </div>
      )}

      <form className="card sale-form" onSubmit={(event) => event.preventDefault()}>
        <label>
          Customer phone number
          <input
            autoFocus
            inputMode="tel"
            autoComplete="tel"
            placeholder="0712 345 678"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <small>Enter the number that should receive the airtime.</small>
        </label>

        <label>
          Airtime amount
          <div className="amount-input"><span>KES</span><input inputMode="numeric" type="number" min="1" step="1" placeholder="100" value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
        </label>

        <div className="quick-amounts">
          {[10, 20, 50, 100, 200, 500, 1000].map((value) => (
            <button type="button" key={value} onClick={() => setAmount(String(value))}>KES {value}</button>
          ))}
        </div>

        {amount && Number(amount) > 0 && (
          <div className="commission-preview">
            <div><span>Sale amount</span><strong>{money(amount)}</strong></div>
            <div><span>Your commission</span><strong className="green-text">+ {money(commission)}</strong></div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button className="primary-button buy-button" type="button" disabled={!hasStore} onClick={buy}><Phone /> Buy Airtime</button>

        {ussd && <div className="ussd-preview"><span>USSD prepared</span><code>{ussd}</code><small>The phone dialer should open with this code. Complete the remaining Safaricom prompts, then return here and confirm the sale.</small></div>}
      </form>

      <div className="tip-card"><strong>How it works</strong><p>Tap <b>Buy Airtime</b>. Your phone opens the dialer with the store number, recipient number and amount already filled in. Complete the Safaricom prompts, then return to TillAir to confirm the sale.</p></div>
    </div>
  );
}

function ConfirmSale({ pending, rate, onConfirm, onCancel }) {
  if (!pending) return null;
  const commission = calculateCommission(pending.amount, rate);
  return (
    <div className="modal-backdrop">
      <div className="confirm-modal">
        <button className="modal-close" onClick={onCancel} aria-label="Close"><X /></button>
        <div className="confirm-icon"><Check /></div>
        <span className="eyebrow">CONFIRM SALE</span>
        <h3>Did the airtime sale succeed?</h3>
        <p>Only confirm this sale if Safaricom completed the transaction successfully.</p>
        <div className="confirm-summary">
          <div><span>Phone</span><strong>{formatPhone(normalizeKenyanPhone(pending.phone) || pending.phone)}</strong></div>
          <div><span>Airtime</span><strong>{money(pending.amount)}</strong></div>
          <div><span>Commission</span><strong className="green-text">+ {money(commission)}</strong></div>
        </div>
        <button className="primary-button full" onClick={onConfirm}><Check /> Confirm Sale</button>
        <button className="secondary-button full" onClick={onCancel}>Not completed</button>
      </div>
    </div>
  );
}

function SalesHistory({ sales, onDelete }) {
  const [query, setQuery] = useState('');
  const filtered = sales.filter((sale) => formatPhone(sale.phone).toLowerCase().includes(query.toLowerCase()) || String(sale.amount).includes(query));
  return (
    <div className="page">
      <div className="intro"><span className="eyebrow">HISTORY</span><h2>Sales history</h2><p>Only sales you confirmed after a successful airtime transaction are recorded.</p></div>
      <div className="history-tools"><input inputMode="search" placeholder="Search by phone or amount" value={query} onChange={(event) => setQuery(event.target.value)} /><span>{filtered.length} record{filtered.length === 1 ? '' : 's'}</span></div>
      <div className="card">
        {filtered.map((sale) => <SaleRow key={sale.id} sale={sale} onDelete={onDelete} />)}
        {!filtered.length && <EmptyState title="No sales found" text={query ? 'Try another phone number or amount.' : 'Confirmed sales will appear here.'} />}
      </div>
    </div>
  );
}

function SettingsPage({ storeNumber, setStoreNumber, startingBalance, setStartingBalance, rate, setRate, sales }) {
  const [store, setStore] = useState(storeNumber);
  const [balance, setBalance] = useState(String(startingBalance));
  const [commissionRate, setCommissionRate] = useState(String(rate));
  const [message, setMessage] = useState('');

  useEffect(() => {
    setStore(storeNumber);
    setBalance(String(startingBalance));
    setCommissionRate(String(rate));
  }, [storeNumber, startingBalance, rate]);

  async function save() {
    const cleanStore = String(store).replace(/\D/g, '');
    const cleanBalance = Number(balance);
    const cleanRate = Number(commissionRate);
    if (!cleanStore) return setMessage('Enter your Safaricom store number.');
    if (!Number.isFinite(cleanBalance) || cleanBalance < 0) return setMessage('Enter a valid starting balance.');
    if (!Number.isFinite(cleanRate) || cleanRate < 0 || cleanRate > 100) return setMessage('Commission rate must be between 0% and 100%.');
    await saveSetting('storeNumber', cleanStore);
    await saveSetting('startingBalance', cleanBalance);
    await saveSetting('commissionRate', cleanRate);
    setStoreNumber(cleanStore);
    setStartingBalance(cleanBalance);
    setRate(cleanRate);
    setMessage('Settings saved on this phone.');
  }

  async function reset() {
    const confirmed = window.confirm('Delete all local sales and settings? This cannot be undone.');
    if (!confirmed) return;
    await clearLocalData();
    window.location.reload();
  }

  return (
    <div className="page narrow-page">
      <div className="intro"><span className="eyebrow">SETTINGS</span><h2>Settings</h2><p>Everything is stored locally on this phone. No account or internet connection is required.</p></div>
      <div className="card settings-form">
        <label>Safaricom store number<input inputMode="numeric" placeholder="Your store number" value={store} onChange={(event) => setStore(event.target.value)} /><small>Saved once, then automatically used in every USSD code.</small></label>
        <label>Starting till balance<input inputMode="decimal" type="number" min="0" step="0.01" value={balance} onChange={(event) => setBalance(event.target.value)} /><small>Used only to calculate the estimated balance shown on the dashboard.</small></label>
        <label>Commission rate (%)<input inputMode="decimal" type="number" min="0" max="100" step="0.01" value={commissionRate} onChange={(event) => setCommissionRate(event.target.value)} /><small>Default is 5%. Change this only if your Safaricom rate changes.</small></label>
        {message && <div className="success-message">{message}</div>}
        <button className="primary-button full" onClick={save}>Save Settings</button>
      </div>

      <div className="card settings-info">
        <div className="settings-info-row"><BarChart3 /><div><strong>Confirmed sales</strong><span>{sales.length} sale{sales.length === 1 ? '' : 's'} stored on this phone.</span></div></div>
        <div className="settings-info-row"><Phone /><div><strong>No login required</strong><span>Your TillAir records stay on this device.</span></div></div>
      </div>

      <div className="danger-card"><div><strong>Reset TillAir</strong><span>Delete all local sales and settings from this phone.</span></div><button onClick={reset}>Reset Data</button></div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [sales, setSales] = useState([]);
  const [storeNumber, setStoreNumber] = useState('');
  const [startingBalance, setStartingBalance] = useState(0);
  const [rate, setRate] = useState(DEFAULT_RATE * 100);
  const [pending, setPending] = useState(null);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [ready, setReady] = useState(false);

  async function load() {
    const [storedSales, store, balance, commissionRate] = await Promise.all([
      getAllSales(),
      getSetting('storeNumber', ''),
      getSetting('startingBalance', 0),
      getSetting('commissionRate', DEFAULT_RATE * 100),
    ]);
    setSales(storedSales.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setStoreNumber(String(store));
    setStartingBalance(Number(balance) || 0);
    setRate(Number(commissionRate) || DEFAULT_RATE * 100);
  }

  useEffect(() => {
    load().finally(() => setReady(true));
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const confirmSale = async () => {
    if (!pending) return;
    try {
      const sale = makeSale(pending);
      await saveSale(sale);
      setSales((current) => [sale, ...current].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setPending(null);
      setPage('sales');
    } catch (error) {
      window.alert(error.message || 'Could not save the sale.');
    }
  };

  const removeSale = async (sale) => {
    const confirmed = window.confirm(`Delete the ${money(sale.amount)} sale for ${formatPhone(sale.phone)}?`);
    if (!confirmed) return;
    await deleteSale(sale.id);
    setSales((current) => current.filter((item) => item.id !== sale.id));
  };

  const content = useMemo(() => {
    if (page === 'sell') return <Sell storeNumber={storeNumber} rate={rate} onPending={setPending} setPage={setPage} />;
    if (page === 'sales') return <SalesHistory sales={sales} onDelete={removeSale} />;
    if (page === 'settings') return <SettingsPage storeNumber={storeNumber} setStoreNumber={setStoreNumber} startingBalance={startingBalance} setStartingBalance={setStartingBalance} rate={rate} setRate={setRate} sales={sales} />;
    return <Dashboard sales={sales} startingBalance={startingBalance} rate={rate} setPage={setPage} />;
  }, [page, storeNumber, rate, sales, startingBalance]);

  if (!ready) return <div className="loading-screen"><Logo /><span>Loading TillAir…</span></div>;

  return (
    <>
      <Layout page={page} setPage={setPage} online={online}>{content}</Layout>
      <ConfirmSale pending={pending} rate={rate} onConfirm={confirmSale} onCancel={() => setPending(null)} />
    </>
  );
}
