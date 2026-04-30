const Stripe = require('stripe');
const Payment = require('../models/Payment');
const User = require('../models/User');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  pro: { amount: 49900, label: 'Pro Plan' }, // ₹499 in paise
};

const createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ message: 'Invalid plan' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: { name: `MeterFlow ${PLANS[plan].label}` },
          unit_amount: PLANS[plan].amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?canceled=true`,
      client_reference_id: req.user.id,
      metadata: { userId: req.user.id, plan },
    });

    await Payment.create({
      userId: req.user.id,
      orderId: session.id,
      amount: PLANS[plan].amount / 100,
      plan,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ message: err.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid')
      return res.status(400).json({ message: 'Payment not completed' });

    const payment = await Payment.findOneAndUpdate(
      { orderId: sessionId },
      { paymentId: session.payment_intent, status: 'paid' },
      { new: true }
    );

    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    await User.findByIdAndUpdate(payment.userId, { plan: payment.plan });

    res.json({ message: 'Payment verified successfully', plan: payment.plan });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ message: err.message });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPlans = (req, res) => {
  res.json([
    { id: 'free', name: 'Free', price: 0, requests: 1000, rateLimit: 60, features: ['1,000 requests/month', '60 req/min rate limit', 'Basic analytics'] },
    { id: 'pro', name: 'Pro', price: 499, requests: 'Unlimited', rateLimit: 600, features: ['Unlimited requests', '600 req/min rate limit', 'Advanced analytics', 'Priority support'] },
  ]);
};

const getPublishableKey = (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
};

const downgradeToFree = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { plan: 'free' });
    res.json({ message: 'Downgraded to free plan' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createCheckoutSession, verifyPayment, getPaymentHistory, getPlans, getPublishableKey, downgradeToFree };
