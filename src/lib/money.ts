export function moneyToCents(amount: string): bigint {
  const s = amount.trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) throw new Error(`Invalid money amount: ${amount}`);

  const negative = s.startsWith("-");
  const normalized = negative ? s.slice(1) : s;
  const [wholeRaw, fracRaw = ""] = normalized.split(".");
  const frac = (fracRaw + "00").slice(0, 2);

  const cents = BigInt(wholeRaw) * 100n + BigInt(frac);
  return negative ? -cents : cents;
}

