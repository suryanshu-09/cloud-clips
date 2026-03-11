import { action } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import Stripe from "stripe";

/**
 * Payment Actions
 * 
 * These are Convex actions that interact with external APIs (Stripe)
 * Handles payment intents, webhooks, refunds, captures, and transfers
 * with full Stripe Connect support for barber payouts.
 */

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

type TConnectUser = {
  _id: Id<"users">;
  role: string;
  email: string;
};

type TBarberStripeProfile = {
  stripeAccountId?: string;
} | null;

type TBarberPayout = {
  id: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "in_transit" | "canceled" | "failed";
  arrivalDate: string;
  createdAt: string;
  method: Stripe.Payout["method"];
  type: Stripe.Payout["type"];
  description: string | null;
  failureCode?: string;
  failureMessage?: string;
  bankAccount?: {
    last4?: string;
    bankName?: string;
  };
};

type TBarberPayoutsResult = {
  payouts: TBarberPayout[];
  hasMore: boolean;
  nextCursor: string | null;
};

/**
 * Create a payment intent for an appointment
 * Uses Stripe Connect to transfer funds directly to the barber
 */
export const createPaymentIntent = action({
  args: {
    amount: v.number(), // in cents
    appointmentId: v.id("appointments"),
    captureMethod: v.optional(v.union(v.literal("automatic"), v.literal("manual"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.queries.getCurrentUser);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const appointment = await ctx.runQuery(api.appointments.queries.getAppointmentById, {
      appointmentId: args.appointmentId,
    });

    if (!appointment) {
      throw new ConvexError("Appointment not found");
    }

    // Verify the user is the client for this appointment
    if (!user || appointment.clientId !== user._id) {
      throw new ConvexError("Not authorized to create payment for this appointment");
    }

    const barberProfile = await ctx.runQuery(api.barbers.queries.getBarberProfileByUserId, {
      userId: appointment.barberId,
    });

    if (!barberProfile?.stripeAccountId) {
      throw new ConvexError("Barber not set up for payments");
    }

    // Verify the barber's Stripe account is active
    try {
      const account = await stripe.accounts.retrieve(barberProfile.stripeAccountId);
      if (!account.charges_enabled || !account.payouts_enabled) {
        throw new ConvexError("Barber's Stripe account is not fully active");
      }
    } catch (error) {
      throw new ConvexError("Failed to verify barber's Stripe account");
    }

    const captureMethod = args.captureMethod || "automatic";

    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: "usd",
      capture_method: captureMethod,
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: barberProfile.stripeAccountId,
      },
      on_behalf_of: barberProfile.stripeAccountId,
      metadata: {
        appointmentId: args.appointmentId.toString(),
        clientId: appointment.clientId.toString(),
        barberId: appointment.barberId.toString(),
        type: "appointment",
      },
    });

    // Update appointment with payment intent ID
    await ctx.runMutation(api.appointments.mutations.updatePaymentStatus, {
      appointmentId: args.appointmentId,
      paymentStatus: "pending",
      paymentIntentId: paymentIntent.id,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  },
});

/**
 * Create a payment intent for a product order
 * Uses Stripe Connect for marketplace payments
 */
export const createOrderPaymentIntent = action({
  args: {
    amount: v.number(), // in cents
    orderId: v.id("orders"),
    captureMethod: v.optional(v.union(v.literal("automatic"), v.literal("manual"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.queries.getCurrentUser);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const order = await ctx.runQuery(api.orders.queries.getOrderById, {
      orderId: args.orderId,
    });
    if (!order) {
      throw new ConvexError("Order not found");
    }

    // Verify the user is the client for this order
    if (!user || order.clientId !== user._id) {
      throw new ConvexError("Not authorized to create payment for this order");
    }

    const barberProfile = await ctx.runQuery(api.barbers.queries.getBarberProfileByUserId, {
      userId: order.barberId,
    });

    if (!barberProfile?.stripeAccountId) {
      throw new ConvexError("Barber not set up for payments");
    }

    // Verify the barber's Stripe account
    try {
      const account = await stripe.accounts.retrieve(barberProfile.stripeAccountId);
      if (!account.charges_enabled || !account.payouts_enabled) {
        throw new ConvexError("Barber's Stripe account is not fully active");
      }
    } catch (error) {
      throw new ConvexError("Failed to verify barber's Stripe account");
    }

    const captureMethod = args.captureMethod || "automatic";

    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: "usd",
      capture_method: captureMethod,
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: barberProfile.stripeAccountId,
      },
      on_behalf_of: barberProfile.stripeAccountId,
      metadata: {
        orderId: args.orderId.toString(),
        clientId: order.clientId.toString(),
        barberId: order.barberId.toString(),
        type: "order",
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  },
});

/**
 * Capture a payment that was created with capture_method: manual
 * Used for pre-authorization flows
 */
export const capturePayment = action({
  args: {
    paymentIntentId: v.string(),
    amountToCapture: v.optional(v.number()), // Optional: for partial captures
  },
  handler: async (ctx, args) => {
    // Get current user to check if they're a barber
    const user = await ctx.runQuery(api.users.queries.getCurrentUser);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Retrieve the payment intent
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(args.paymentIntentId);
    } catch (error) {
      throw new ConvexError("Payment intent not found");
    }

    // Verify the payment intent belongs to this user
    const metadata = paymentIntent.metadata;
    
    // Check if user is authorized (either client or barber for this payment)
    const isClient = metadata.clientId === user._id.toString();
    const isBarber = metadata.barberId === user._id.toString() && user.role === "barber";
    
    if (!isClient && !isBarber) {
      throw new ConvexError("Not authorized to capture this payment");
    }

    // Only capture if the payment is in requires_capture state
    if (paymentIntent.status !== "requires_capture") {
      throw new ConvexError(`Payment cannot be captured. Current status: ${paymentIntent.status}`);
    }

    try {
      const captureOptions: Stripe.PaymentIntentCaptureParams = {};
      if (args.amountToCapture) {
        captureOptions.amount_to_capture = args.amountToCapture;
      }

      const capturedIntent = await stripe.paymentIntents.capture(
        args.paymentIntentId,
        captureOptions
      );

      // Update the corresponding record based on type
      if (metadata.type === "appointment" && metadata.appointmentId) {
        await ctx.runMutation(api.appointments.mutations.updatePaymentStatus, {
          appointmentId: metadata.appointmentId as any,
          paymentStatus: "paid",
          paymentIntentId: capturedIntent.id,
        });
      }

      return {
        paymentIntentId: capturedIntent.id,
        status: capturedIntent.status,
        amountCaptured: capturedIntent.amount_received,
      };
    } catch (error: any) {
      throw new ConvexError(`Failed to capture payment: ${error.message}`);
    }
  },
});

/**
 * Refund a payment (full or partial)
 * Can be initiated by clients (within policy) or barbers/admin
 */
export const refundPayment = action({
  args: {
    paymentIntentId: v.string(),
    amount: v.optional(v.number()), // Optional: for partial refunds (in cents)
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.queries.getCurrentUser);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Retrieve the payment intent
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(args.paymentIntentId);
    } catch (error) {
      throw new ConvexError("Payment intent not found");
    }

    // Check if payment is eligible for refund
    if (paymentIntent.status !== "succeeded") {
      throw new ConvexError(`Payment cannot be refunded. Current status: ${paymentIntent.status}`);
    }

    const metadata = paymentIntent.metadata;
    const isClient = metadata.clientId === user._id.toString();
    const isBarber = metadata.barberId === user._id.toString() && user.role === "barber";
    const isAdmin = user.role === "admin";

    if (!isClient && !isBarber && !isAdmin) {
      throw new ConvexError("Not authorized to refund this payment");
    }

    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: args.paymentIntentId,
        reason: "requested_by_customer",
        metadata: {
          requestedBy: user._id.toString(),
          userRole: user.role,
          reason: args.reason || "No reason provided",
        },
      };

      if (args.amount) {
        // Validate partial refund amount
        if (args.amount > paymentIntent.amount) {
          throw new ConvexError("Refund amount cannot exceed payment amount");
        }
        refundParams.amount = args.amount;
      }

      const refund = await stripe.refunds.create(refundParams);

      // Update the corresponding record
      if (metadata.type === "appointment" && metadata.appointmentId) {
        await ctx.runMutation(api.appointments.mutations.updatePaymentStatus, {
          appointmentId: metadata.appointmentId as any,
          paymentStatus: args.amount ? "partially_refunded" : "refunded",
          paymentIntentId: paymentIntent.id,
        });
      }

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
        currency: refund.currency,
      };
    } catch (error: any) {
      throw new ConvexError(`Failed to process refund: ${error.message}`);
    }
  },
});

/**
 * Transfer funds directly to a barber's Stripe Connect account
 * Used for payouts, bonuses, or adjustments
 */
export const transferToBarber = action({
  args: {
    barberId: v.id("users"),
    amount: v.number(), // in cents
    currency: v.optional(v.string()),
    description: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.queries.getCurrentUser);
    if (!user || (user.role !== "admin" && user.role !== "barber")) {
      throw new ConvexError("Not authorized to create transfers");
    }

    // If barber, can only transfer to themselves
    if (user.role === "barber" && args.barberId !== user._id) {
      throw new ConvexError("Barbers can only create transfers to their own account");
    }

    const barberProfile = await ctx.runQuery(api.barbers.queries.getBarberProfileByUserId, {
      userId: args.barberId,
    });

    if (!barberProfile?.stripeAccountId) {
      throw new ConvexError("Barber not set up for payments");
    }

    // Verify the barber's Stripe account is active
    try {
      const account = await stripe.accounts.retrieve(barberProfile.stripeAccountId);
      if (!account.payouts_enabled) {
        throw new ConvexError("Barber's Stripe account cannot receive payouts");
      }
    } catch (error) {
      throw new ConvexError("Failed to verify barber's Stripe account");
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: args.amount,
        currency: args.currency || "usd",
        destination: barberProfile.stripeAccountId,
        description: args.description || "Transfer to barber",
        metadata: {
          ...args.metadata,
          barberId: args.barberId.toString(),
          initiatedBy: user._id.toString(),
          initiatedByRole: user.role,
        },
      });

      return {
        transferId: transfer.id,
        status: transfer.reversed ? "reversed" : "paid",
        amount: transfer.amount,
        currency: transfer.currency,
        destination: transfer.destination,
        createdAt: transfer.created,
      };
    } catch (error: any) {
      throw new ConvexError(`Failed to create transfer: ${error.message}`);
    }
  },
});

/**
 * Handle Stripe webhook events
 * Processes payment confirmations, failures, refunds, and account updates
 */
export const handleStripeWebhook = action({
  args: {
    payload: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        args.payload,
        args.signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error: any) {
      throw new ConvexError(`Webhook signature verification failed: ${error.message}`);
    }

    switch (event.type) {
      // Payment Intent Events
      case "payment_intent.created": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment intent created: ${paymentIntent.id}`);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;
        let charge: Stripe.Charge | null = null;

        if (paymentIntent.latest_charge) {
          if (typeof paymentIntent.latest_charge === "string") {
            try {
              charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
            } catch {
              charge = null;
            }
          } else {
            charge = paymentIntent.latest_charge;
          }
        }

        console.log(`Payment succeeded: ${paymentIntent.id}`);

        // Get payment method details from charge
        const paymentMethod = charge?.payment_method_details?.card
          ? {
              type: "card",
              brand: charge.payment_method_details.card.brand || "unknown",
              last4: charge.payment_method_details.card.last4 ?? undefined,
            }
          : undefined;

        // Update appointment or order payment status
        if (metadata.type === "appointment" && metadata.appointmentId) {
          await ctx.runMutation(api.appointments.mutations.updatePaymentStatus, {
            appointmentId: metadata.appointmentId as any,
            paymentStatus: "paid",
            paymentIntentId: paymentIntent.id,
          });

          // Generate receipt for appointment payment
          try {
            await ctx.runMutation(api.receipts.mutations.generateReceipt, {
              appointmentId: metadata.appointmentId as any,
              paymentIntentId: paymentIntent.id,
              paymentMethod,
            });
            console.log(`Receipt generated for appointment: ${metadata.appointmentId}`);
          } catch (error) {
            console.error(`Failed to generate receipt: ${error}`);
            // Don't fail the webhook if receipt generation fails
          }
        }

        // Handle order payments
        if (metadata.type === "order" && metadata.orderId) {
          try {
            await ctx.runMutation(api.receipts.mutations.generateOrderReceipt, {
              orderId: metadata.orderId as any,
              paymentIntentId: paymentIntent.id,
              paymentMethod,
            });
            console.log(`Receipt generated for order: ${metadata.orderId}`);
          } catch (error) {
            console.error(`Failed to generate order receipt: ${error}`);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;
        const errorMessage = paymentIntent.last_payment_error?.message || "Payment failed";

        console.log(`Payment failed: ${paymentIntent.id} - ${errorMessage}`);

        if (metadata.type === "appointment" && metadata.appointmentId) {
          await ctx.runMutation(api.appointments.mutations.updatePaymentStatus, {
            appointmentId: metadata.appointmentId as any,
            paymentStatus: "failed",
            paymentIntentId: paymentIntent.id,
          });
        }
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;

        console.log(`Payment canceled: ${paymentIntent.id}`);

        if (metadata.type === "appointment" && metadata.appointmentId) {
          await ctx.runMutation(api.appointments.mutations.updatePaymentStatus, {
            appointmentId: metadata.appointmentId as any,
            paymentStatus: "failed",
            paymentIntentId: paymentIntent.id,
          });
        }
        break;
      }

      case "payment_intent.requires_action": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment requires action: ${paymentIntent.id}`);
        // Client should handle this - notify user to complete 3D Secure
        break;
      }

      case "payment_intent.amount_capturable_updated": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment amount capturable updated: ${paymentIntent.id}`);
        break;
      }

      // Refund Events
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log(`Charge refunded: ${charge.id}`);
        // Could notify user/barber of refund
        break;
      }

      case "refund.created": {
        const refund = event.data.object as Stripe.Refund;
        console.log(`Refund created: ${refund.id}`);
        break;
      }

      case "refund.updated": {
        const refund = event.data.object as Stripe.Refund;
        console.log(`Refund updated: ${refund.id} - Status: ${refund.status}`);
        break;
      }

      // Transfer Events
      case "transfer.created": {
        const transfer = event.data.object as Stripe.Transfer;
        console.log(`Transfer created: ${transfer.id} to ${transfer.destination}`);
        break;
      }

      case "transfer.reversed": {
        const transfer = event.data.object as Stripe.Transfer;
        console.log(`Transfer reversed: ${transfer.id}`);
        break;
      }

      // Stripe Connect Account Events
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        console.log(`Account updated: ${account.id}`);
        console.log(`  Charges enabled: ${account.charges_enabled}`);
        console.log(`  Payouts enabled: ${account.payouts_enabled}`);
        
        // Could update barber profile with account status
        // Find barber by stripeAccountId and update verification status
        break;
      }

      case "account.application.authorized": {
        const application = event.data.object as Stripe.Application;
        console.log(`Account application authorized: ${application.id}`);
        break;
      }

      case "account.application.deauthorized": {
        const application = event.data.object as Stripe.Application;
        console.log(`Account application deauthorized: ${application.id}`);
        break;
      }

      case "account.external_account.created": {
        const externalAccount = event.data.object as Stripe.BankAccount | Stripe.Card;
        console.log(`External account created: ${externalAccount.id}`);
        break;
      }

      case "account.external_account.deleted": {
        const externalAccount = event.data.object as Stripe.BankAccount | Stripe.Card;
        console.log(`External account deleted: ${externalAccount.id}`);
        break;
      }

      case "account.external_account.updated": {
        const externalAccount = event.data.object as Stripe.BankAccount | Stripe.Card;
        console.log(`External account updated: ${externalAccount.id}`);
        break;
      }

      // Payout Events
      case "payout.created": {
        const payout = event.data.object as Stripe.Payout;
        console.log(`Payout created: ${payout.id} - ${payout.amount} ${payout.currency}`);
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        console.log(`Payout paid: ${payout.id}`);
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;
        console.log(`Payout failed: ${payout.id}`);
        break;
      }

      case "payout.canceled": {
        const payout = event.data.object as Stripe.Payout;
        console.log(`Payout canceled: ${payout.id}`);
        break;
      }

      // Person Events (for Connect accounts with multiple representatives)
      case "person.created": {
        const person = event.data.object as Stripe.Person;
        console.log(`Person created: ${person.id}`);
        break;
      }

      case "person.updated": {
        const person = event.data.object as Stripe.Person;
        console.log(`Person updated: ${person.id}`);
        break;
      }

      case "person.deleted": {
        const person = event.data.object as Stripe.Person;
        console.log(`Person deleted: ${person.id}`);
        break;
      }

      // Default handler for unhandled events
      default: {
        console.log(`Unhandled webhook event type: ${event.type}`);
      }
    }

    return { 
      received: true,
      eventType: event.type,
      eventId: event.id,
    };
  },
});

/**
 * Create a Stripe Connect Express account for a barber
 * This enables barbers to receive payments directly
 */
export const createConnectAccount = action({
  args: {
    country: v.optional(v.string()),
    businessType: v.optional(v.union(v.literal("individual"), v.literal("company"))),
  },
  handler: async (ctx, args): Promise<{ accountId: string; onboardingUrl: string; isExisting: boolean }> => {
    const user: TConnectUser | null = await ctx.runQuery(api.users.queries.getCurrentUser) as TConnectUser | null;
    if (!user || user.role !== "barber") {
      throw new ConvexError("Not authorized: Only barbers can create Connect accounts");
    }

    // Check if barber already has a Stripe account
    const barberProfile: TBarberStripeProfile = await ctx.runQuery(api.barbers.queries.getBarberProfileByUserId, {
      userId: user._id,
    }) as TBarberStripeProfile;

    if (barberProfile?.stripeAccountId) {
      // Return existing account onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: barberProfile.stripeAccountId,
        refresh_url: `${process.env.APP_URL}/barber/onboarding/refresh`,
        return_url: `${process.env.APP_URL}/barber/onboarding/complete`,
        type: "account_onboarding",
      });

      return {
        accountId: barberProfile.stripeAccountId,
        onboardingUrl: accountLink.url,
        isExisting: true,
      };
    }

    // Create new Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: args.country || "US",
      email: user.email,
      business_type: args.businessType || "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: "daily",
          },
        },
      },
      metadata: {
        userId: user._id.toString(),
        email: user.email,
      },
    });

    // Store the account ID in the barber's profile
    await ctx.runMutation(api.barbers.mutations.updateStripeAccount, {
      userId: user._id,
      stripeAccountId: account.id,
    });

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.APP_URL}/barber/onboarding/refresh`,
      return_url: `${process.env.APP_URL}/barber/onboarding/complete`,
      type: "account_onboarding",
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
      isExisting: false,
    };
  },
});

/**
 * Get Stripe Connect login link for a barber to access their dashboard
 */
export const getConnectLoginLink = action({
  args: {},
  handler: async (ctx): Promise<{ url: string }> => {
    const user: TConnectUser | null = await ctx.runQuery(api.users.queries.getCurrentUser) as TConnectUser | null;
    if (!user || user.role !== "barber") {
      throw new ConvexError("Not authorized");
    }

    const barberProfile: TBarberStripeProfile = await ctx.runQuery(api.barbers.queries.getBarberProfileByUserId, {
      userId: user._id,
    }) as TBarberStripeProfile;

    if (!barberProfile?.stripeAccountId) {
      throw new ConvexError("No Stripe account found");
    }

    try {
      const loginLink: Stripe.LoginLink = await stripe.accounts.createLoginLink(
        barberProfile.stripeAccountId
      );

      return { url: loginLink.url };
    } catch (error: any) {
      throw new ConvexError(`Failed to create login link: ${error.message}`);
    }
  },
});

/**
 * Retrieve a barber's Stripe Connect account details
 */
export const getConnectAccountDetails = action({
  args: {},
  handler: async (ctx): Promise<{
    accountId: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    requirements: {
      currentlyDue: string[];
      eventuallyDue: string[];
      pastDue: string[];
      pendingVerification: string[];
    };
    settings: {
      defaultCurrency: string | undefined;
      country: string | undefined;
    };
  }> => {
    const user: TConnectUser | null = await ctx.runQuery(api.users.queries.getCurrentUser) as TConnectUser | null;
    if (!user || user.role !== "barber") {
      throw new ConvexError("Not authorized");
    }

    const barberProfile: TBarberStripeProfile = await ctx.runQuery(api.barbers.queries.getBarberProfileByUserId, {
      userId: user._id,
    }) as TBarberStripeProfile;

    if (!barberProfile?.stripeAccountId) {
      throw new ConvexError("No Stripe account found");
    }

    try {
      const account: Stripe.Account = await stripe.accounts.retrieve(barberProfile.stripeAccountId);

      return {
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: {
          currentlyDue: account.requirements?.currently_due || [],
          eventuallyDue: account.requirements?.eventually_due || [],
          pastDue: account.requirements?.past_due || [],
          pendingVerification: account.requirements?.pending_verification || [],
        },
        settings: {
          defaultCurrency: account.default_currency,
          country: account.country,
        },
      };
    } catch (error: any) {
      throw new ConvexError(`Failed to retrieve account: ${error.message}`);
    }
  },
});

/**
 * Get barber's Stripe payouts list
 * Requires the barber to have a Stripe Connect account
 */
export const getBarberPayouts = action({
  args: {
    limit: v.optional(v.number()),
    startingAfter: v.optional(v.string()), // Stripe payout ID for cursor pagination
  },
  handler: async (ctx, args): Promise<TBarberPayoutsResult> => {
    const user = await ctx.runQuery(api.users.queries.getCurrentUser);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Get barber profile with Stripe account ID
    const barberProfile: TBarberStripeProfile = await ctx.runQuery(api.barbers.queries.getBarberProfile) as TBarberStripeProfile;
    if (!barberProfile?.stripeAccountId) {
      return {
        payouts: [],
        hasMore: false,
        nextCursor: null,
      };
    }

    try {
      const listParams: Stripe.PayoutListParams = {
        limit: Math.min(args.limit ?? 25, 100),
      };
      if (args.startingAfter) {
        listParams.starting_after = args.startingAfter;
      }

      const payoutsResponse: Stripe.ApiList<Stripe.Payout> = await stripe.payouts.list(listParams, {
        stripeAccount: barberProfile.stripeAccountId,
      });

      return {
        payouts: payoutsResponse.data.map((payout: Stripe.Payout) => ({
          id: payout.id,
          amount: payout.amount,
          currency: payout.currency,
          status: payout.status as "paid" | "pending" | "in_transit" | "canceled" | "failed",
          arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
          createdAt: new Date(payout.created * 1000).toISOString(),
          method: payout.method,
          type: payout.type,
          description: payout.description,
          failureCode: payout.failure_code ?? undefined,
          failureMessage: payout.failure_message ?? undefined,
          bankAccount: payout.destination
            ? {
                last4:
                  typeof payout.destination === "object" &&
                  "last4" in payout.destination
                    ? (payout.destination as any).last4
                    : undefined,
                bankName:
                  typeof payout.destination === "object" &&
                  "bank_name" in payout.destination
                    ? (payout.destination as any).bank_name
                    : undefined,
              }
            : undefined,
        })),
        hasMore: payoutsResponse.has_more,
        nextCursor:
          payoutsResponse.has_more && payoutsResponse.data.length > 0
            ? payoutsResponse.data[payoutsResponse.data.length - 1].id
            : null,
      };
    } catch (error: any) {
      // If account is not fully set up, return empty
      if (
        error?.code === "account_invalid" ||
        error?.message?.includes("No such account")
      ) {
        return {
          payouts: [],
          hasMore: false,
          nextCursor: null,
        };
      }
      throw new ConvexError(`Failed to fetch payouts: ${error.message}`);
    }
  },
});

/**
 * Get payment intent status and details
 */
export const getPaymentIntentStatus = action({
  args: {
    paymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.queries.getCurrentUser);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(args.paymentIntentId);

      // Get charges separately since they're not expanded by default
      const charges = await stripe.charges.list({
        payment_intent: args.paymentIntentId,
      });

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        amountReceived: paymentIntent.amount_received,
        amountCapturable: paymentIntent.amount_capturable,
        currency: paymentIntent.currency,
        captureMethod: paymentIntent.capture_method,
        charges: charges.data.map(charge => ({
          id: charge.id,
          status: charge.status,
          amount: charge.amount,
          refunded: charge.refunded,
          amountRefunded: charge.amount_refunded,
        })),
        metadata: paymentIntent.metadata,
        created: paymentIntent.created,
      };
    } catch (error: any) {
      throw new ConvexError(`Failed to retrieve payment intent: ${error.message}`);
    }
  },
});
