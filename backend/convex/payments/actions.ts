import { action } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";

/**
 * Payment Actions
 * 
 * These are Convex actions that interact with external APIs (Stripe)
 */

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Create payment intent for appointment
export const createPaymentIntent = action({
  args: {
    amount: v.number(), // in cents
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const appointment = await ctx.runQuery(api.appointments.getAppointmentById, {
      appointmentId: args.appointmentId,
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const barberProfile = await ctx.runQuery(api.barbers.getBarberProfile, {
      userId: appointment.barberId,
    });

    if (!barberProfile?.stripeAccountId) {
      throw new Error("Barber not set up for payments");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: barberProfile.stripeAccountId,
      },
      metadata: {
        appointmentId: args.appointmentId.toString(),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  },
});

// Create payment intent for product order
export const createOrderPaymentIntent = action({
  args: {
    amount: v.number(),
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const barberProfile = await ctx.runQuery(api.barbers.getBarberProfile, {
      userId: order.barberId,
    });

    if (!barberProfile?.stripeAccountId) {
      throw new Error("Barber not set up for payments");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: barberProfile.stripeAccountId,
      },
      metadata: {
        orderId: args.orderId.toString(),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  },
});

// Handle Stripe webhook
export const handleStripeWebhook = action({
  args: {
    payload: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const event = stripe.webhooks.constructEvent(
      args.payload,
      args.signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update appointment or order payment status
        if (paymentIntent.metadata.appointmentId) {
          await ctx.runMutation(api.appointments.updatePaymentStatus, {
            appointmentId: paymentIntent.metadata.appointmentId,
            status: "paid",
            paymentIntentId: paymentIntent.id,
          });
        } else if (paymentIntent.metadata.orderId) {
          await ctx.runMutation(api.orders.updatePaymentStatus, {
            orderId: paymentIntent.metadata.orderId,
            status: "paid",
            paymentIntentId: paymentIntent.id,
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        if (paymentIntent.metadata.appointmentId) {
          await ctx.runMutation(api.appointments.updatePaymentStatus, {
            appointmentId: paymentIntent.metadata.appointmentId,
            status: "failed",
            paymentIntentId: paymentIntent.id,
          });
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        // Handle barber account updates
        break;
      }
    }

    return { received: true };
  },
});

// Create Stripe Connect account for barber
export const createConnectAccount = action({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user || user.role !== "barber") {
      throw new Error("Not authorized");
    }

    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
    });

    // Store account ID
    await ctx.runMutation(api.barbers.updateStripeAccount, {
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
    };
  },
});

// Get Stripe Connect login link
export const getConnectLoginLink = action({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user || user.role !== "barber") {
      throw new Error("Not authorized");
    }

    const barberProfile = await ctx.runQuery(api.barbers.getBarberProfile, {
      userId: user._id,
    });

    if (!barberProfile?.stripeAccountId) {
      throw new Error("No Stripe account found");
    }

    const loginLink = await stripe.accounts.createLoginLink(
      barberProfile.stripeAccountId
    );

    return { url: loginLink.url };
  },
});
