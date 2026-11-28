export type ParsedUpiPayment = {
  payeeVpa: string;
  payeeName: string;
  amountMinor?: number;
  note?: string;
  reference?: string;
  transactionId?: string;
};

export function normalizeVpa(value: string) {
  return value.trim().toLowerCase();
}

export function isValidVpa(value: string) {
  return /^[a-z0-9._-]{2,256}@[a-z0-9.-]{2,64}$/i.test(value.trim());
}

export function parseMoneyToMinor(value: string): number | null {
  const normalized = value.trim().replace(/,/g, "");
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const minor = whole * 100 + fraction;
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

export function formatMinor(minor: number) {
  return "₹" + (minor / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildUpiPayUri(input: {
  payeeVpa: string;
  payeeName: string;
  amountMinor?: number;
  note?: string;
  reference?: string;
  transactionId?: string;
}) {
  const params: [string, string][] = [
    ["pa", normalizeVpa(input.payeeVpa)],
    ["pn", input.payeeName.trim()],
    ["cu", "INR"],
  ];
  if (typeof input.amountMinor === "number" && input.amountMinor > 0) {
    params.push(["am", (input.amountMinor / 100).toFixed(2)]);
  }
  if (input.note?.trim()) params.push(["tn", input.note.trim().slice(0, 80)]);
  if (input.transactionId?.trim()) params.push(["tid", input.transactionId.trim().slice(0, 35)]);
  if (input.reference?.trim()) params.push(["tr", input.reference.trim().slice(0, 35)]);
  return "upi://pay?" + params.map(([key, value]) => key + "=" + encodeURIComponent(value)).join("&");
}

export function parseUpiQrData(rawValue: string): ParsedUpiPayment {
  const value = rawValue.trim();
  if (isValidVpa(value)) {
    return { payeeVpa: normalizeVpa(value), payeeName: "UPI recipient" };
  }

  const questionMark = value.indexOf("?");
  if (questionMark < 0 || value.slice(0, questionMark).toLowerCase() !== "upi://pay") {
    throw new Error("This is not a supported UPI payment QR. Scan a QR that contains a UPI payment address.");
  }

  const params = new URLSearchParams(value.slice(questionMark + 1));
  const payeeVpa = params.get("pa")?.trim() ?? "";
  if (!isValidVpa(payeeVpa)) {
    throw new Error("This UPI QR does not contain a valid UPI ID.");
  }

  const currency = (params.get("cu") ?? "INR").toUpperCase();
  if (currency !== "INR") {
    throw new Error("DeepPay currently supports INR UPI payment QR codes only.");
  }

  const amountValue = params.get("am");
  let amountMinor: number | undefined;
  if (amountValue) {
    const parsedAmount = parseMoneyToMinor(amountValue);
    if (!parsedAmount) throw new Error("This QR contains an invalid payment amount.");
    amountMinor = parsedAmount;
  }

  const payeeName = (params.get("pn") ?? "UPI recipient").trim().slice(0, 80) || "UPI recipient";
  const note = (params.get("tn") ?? "").trim().slice(0, 80);
  const reference = (params.get("tr") ?? "").trim().slice(0, 35);
  const transactionId = (params.get("tid") ?? "").trim().slice(0, 35);

  return {
    payeeVpa: normalizeVpa(payeeVpa),
    payeeName,
    ...(amountMinor ? { amountMinor } : {}),
    ...(note ? { note } : {}),
    ...(reference ? { reference } : {}),
    ...(transactionId ? { transactionId } : {}),
  };
}
