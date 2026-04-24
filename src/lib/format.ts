export function centsToMoney(cents: bigint, currency: string) {
  const abs = cents < 0n ? -cents : cents;
  const whole = abs / 100n;
  const frac = abs % 100n;
  const sign = cents < 0n ? "-" : "";
  return `${sign}${currency} ${whole.toString()}.${frac.toString().padStart(2, "0")}`;
}

