import {HttpsError, onCall, onRequest} from "firebase-functions/v2/https";
import Stripe from "stripe";
import {db} from "./firebase";

const getStripe = () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("ERROR: STRIPE_SECRET_KEY is missing.");
  return new Stripe(stripeKey);
};

/**
 * Called by the frontend during sign up to generate a checkout URL
 */
export const createCheckoutSession = onCall({cors: true}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const {orgId} = request.data;
  if (!orgId) {
    throw new HttpsError("invalid-argument", "Organization ID is required");
  }

  const stripe = getStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: "price_1TEBkjJiP9hOGR2oZlAFwDOn",
          quantity: 1,
        },
      ],
      success_url: "https://toolsight-teng.web.app/",
      cancel_url: "https://toolsight-teng.web.app/",
      subscription_data: {
        metadata: {
          orgId: orgId,
        },
      },
    });

    return {url: session.url};
  } catch (error: any) {
    console.error("Stripe Session Creation Failed:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Webhook endpoint for Stripe to call when payments succeed/fail
 */
export const stripeWebhook = onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    // Verify the webhook signature to ensure it came from Stripe
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig as string,
      webhookSecret,
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  try {
    switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata.orgId;

      if (orgId) {
        await db.collection("organizations").doc(orgId).update({
          subscriptionStatus: subscription.status,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
        });
        console.log(`Updated org ${orgId} to status: ${subscription.status}`);
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * Generates a Stripe Customer Portal URL so users can manage/cancel
 * their subscription
 */
export const createPortalSession = onCall({cors: true}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const {orgId} = request.data;
  if (!orgId) {
    throw new HttpsError("invalid-argument", "Organization ID is required");
  }

  // Fetch the Stripe customer ID for the org from Firestore
  const orgDoc = await db.collection("organizations").doc(orgId).get();
  const orgData = orgDoc.data();

  if (!orgData || !orgData.stripeCustomerId) {
    throw new HttpsError("failed-precondition", "No billing account found.");
  }

  const stripe = getStripe();

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: orgData.stripeCustomerId,
      return_url: "https://toolsight-teng.web.app/",
    });

    return {url: portalSession.url};
  } catch (error: any) {
    console.error("Stripe Portal Creation Failed:", error);
    throw new HttpsError("internal", error.message);
  }
});
