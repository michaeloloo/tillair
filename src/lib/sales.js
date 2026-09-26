export const DEFAULT_RATE = 0.05;

export function calculateCommission(amount, rate = DEFAULT_RATE) {
  const value = Number(amount);
  const percentage = Number(rate);
  if (!Number.isFinite(value) || value < 0) return 0;
  if (!Number.isFinite(percentage) || percentage < 0) return 0;
  return Math.round(value * (percentage / 100) * 100) / 100;
}

export function calculateBalance(startingBalance, sales, rate) {
  const starting = Number(startingBalance) || 0;
  return Math.round((starting - sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0) + sales.reduce((sum, sale) => sum + Number(sale.commission ?? calculateCommission(sale.amount, rate)), 0)) * 100) / 100;
}

export function normalizeKenyanPhone(value) {
  const raw = String(value || '').replace(/[\s()-]/g, '');
  if (/^07\d{8}$/.test(raw) || /^01\d{8}$/.test(raw)) return `254${raw.slice(1)}`;
  if (/^254[17]\d{8}$/.test(raw)) return raw;
  if (/^\+254[17]\d{8}$/.test(raw)) return raw.slice(1);
  return null;
}

export function buildUssd(storeNumber, phone, amount) {
  const store = String(storeNumber || '').replace(/\D/g, '');
  const normalizedPhone = normalizeKenyanPhone(phone);
  const value = Number(amount);
  if (!store) throw new Error('Enter your store number in Settings first.');
  if (!normalizedPhone) throw new Error('Enter a valid Kenyan mobile number.');
  if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a valid airtime amount.');
  if (!Number.isInteger(value)) throw new Error('Airtime amount must be a whole number.');
  return `*234*2*${store}*5*${normalizedPhone}*${value}#`;
}

export function makeSale({ phone, amount, rate }) {
  const normalizedPhone = normalizeKenyanPhone(phone);
  const value = Number(amount);
  if (!normalizedPhone) throw new Error('Enter a valid Kenyan mobile number.');
  if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a valid airtime amount.');
  if (!Number.isInteger(value)) throw new Error('Airtime amount must be a whole number.');

  const commission = calculateCommission(value, rate);
  return {
    id: crypto.randomUUID(),
    phone: normalizedPhone,
    amount: value,
    commission,
    rate: Number(rate),
    created_at: new Date().toISOString(),
  };
}
