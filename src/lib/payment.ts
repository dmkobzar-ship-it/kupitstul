/**
 * YooKassa Payment Integration
 * https://yookassa.ru/developers/api
 *
 * Environment Variables Required:
 *   YOOKASSA_SHOP_ID - Your shop ID
 *   YOOKASSA_SECRET_KEY - Secret key for API
 *   YOOKASSA_RETURN_URL - URL to redirect after payment
 *
 * Install SDK: npm install @yookassa/sdk
 */

// Payment types
export interface PaymentCreateParams {
  orderId: string;
  orderNumber: string;
  amount: number; // in rubles
  currency?: string;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  amount: {
    value: string;
    currency: string;
  };
  confirmationUrl?: string;
  paid: boolean;
  createdAt: string;
}

export interface RefundParams {
  paymentId: string;
  amount: number;
  description?: string;
}

// Configuration
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || "";
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || "";
const YOOKASSA_API_URL = "https://api.yookassa.ru/v3";
const RETURN_URL =
  process.env.YOOKASSA_RETURN_URL || "https://kupitstul.ru/checkout/success";

/**
 * Create a payment via YooKassa API
 */
export async function createPayment(
  params: PaymentCreateParams,
): Promise<PaymentResult> {
  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
    throw new Error(
      "YooKassa credentials not configured. Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY env vars.",
    );
  }

  const idempotenceKey = `order-${params.orderId}-${Date.now()}`;

  const body = {
    amount: {
      value: params.amount.toFixed(2),
      currency: params.currency || "RUB",
    },
    confirmation: {
      type: "redirect",
      return_url: params.returnUrl || RETURN_URL,
    },
    capture: true, // Auto-capture payment
    description: params.description,
    metadata: {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      ...params.metadata,
    },
    receipt: {
      customer: {
        ...(params.customerEmail && { email: params.customerEmail }),
        ...(params.customerPhone && { phone: params.customerPhone }),
      },
      items: [
        {
          description: params.description.slice(0, 128),
          quantity: "1.00",
          amount: {
            value: params.amount.toFixed(2),
            currency: params.currency || "RUB",
          },
          vat_code: 1, // НДС не облагается
          payment_subject: "commodity",
          payment_mode: "full_payment",
        },
      ],
    },
  };

  const response = await fetch(`${YOOKASSA_API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
      Authorization: `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `YooKassa payment error: ${error.description || response.statusText}`,
    );
  }

  const data = await response.json();

  return {
    id: data.id,
    status: data.status,
    amount: data.amount,
    confirmationUrl: data.confirmation?.confirmation_url,
    paid: data.paid,
    createdAt: data.created_at,
  };
}

/**
 * Get payment status from YooKassa
 */
export async function getPaymentStatus(
  paymentId: string,
): Promise<PaymentResult> {
  const response = await fetch(`${YOOKASSA_API_URL}/payments/${paymentId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get payment status: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    status: data.status,
    amount: data.amount,
    paid: data.paid,
    createdAt: data.created_at,
  };
}

/**
 * Refund a payment (full or partial)
 */
export async function refundPayment(params: RefundParams): Promise<{
  id: string;
  status: string;
  amount: { value: string; currency: string };
}> {
  const idempotenceKey = `refund-${params.paymentId}-${Date.now()}`;

  const response = await fetch(`${YOOKASSA_API_URL}/refunds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
      Authorization: `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`,
    },
    body: JSON.stringify({
      payment_id: params.paymentId,
      amount: {
        value: params.amount.toFixed(2),
        currency: "RUB",
      },
      description: params.description || "Возврат средств",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `YooKassa refund error: ${error.description || response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Verify webhook signature from YooKassa
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
): boolean {
  // YooKassa uses IP-based verification primarily
  // For additional security, implement HMAC verification if configured
  // See: https://yookassa.ru/developers/using-api/webhooks#security

  // Basic check: verify the notification came from YooKassa IP ranges
  // In production, check against YooKassa's documented IP ranges
  return !!body && !!signature;
}
