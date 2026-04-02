import OpenAI from 'openai';
import { prisma } from '../database/client';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── BUDGET SPLITS BY EVENT TYPE ─────────────────────
const BUDGET_SPLITS: Record<string, Record<string, number>> = {
  wedding: { venue: 0.30, catering: 0.25, photography: 0.15, decor: 0.12, entertainment: 0.08, av: 0.05, makeup: 0.03, speaker: 0.02 },
  corporate: { venue: 0.35, catering: 0.25, av: 0.18, decor: 0.06, photography: 0.08, entertainment: 0.04, speaker: 0.04 },
  birthday: { venue: 0.25, catering: 0.30, decor: 0.15, entertainment: 0.12, photography: 0.10, av: 0.06, makeup: 0.02 },
  networking: { venue: 0.40, catering: 0.30, av: 0.15, decor: 0.08, photography: 0.05, entertainment: 0.02 },
  conference: { venue: 0.30, catering: 0.22, av: 0.20, speaker: 0.12, decor: 0.06, photography: 0.06, entertainment: 0.04 },
  product_launch: { venue: 0.28, catering: 0.20, av: 0.20, decor: 0.12, photography: 0.12, entertainment: 0.05, speaker: 0.03 },
  default: { venue: 0.32, catering: 0.25, av: 0.15, decor: 0.10, photography: 0.10, entertainment: 0.05, speaker: 0.03 },
};

// ─── EXTRACT EVENT DETAILS FROM NATURAL LANGUAGE ─────
export async function extractEventDetails(userMessage: string, conversationHistory: any[]) {
  const systemPrompt = `You are Owambe's AI event planning assistant for Nigeria. 
Your job is to extract event planning details from user messages and ask smart follow-up questions.

Extract these fields when mentioned:
- eventType: wedding, corporate, birthday, networking, conference, product_launch, or other
- location: city in Nigeria (Lagos, Abuja, Port Harcourt, etc.)
- date: event date
- guestCount: number of guests
- totalBudget: budget in NGN (Naira)
- preferences: style preferences, requirements, dietary needs, etc.

Respond ONLY with valid JSON in this exact format:
{
  "extracted": {
    "eventType": null,
    "location": null, 
    "date": null,
    "guestCount": null,
    "totalBudget": null,
    "preferences": {}
  },
  "missingFields": ["field1", "field2"],
  "followUpQuestion": "Your friendly follow-up question here (only ask for the MOST important missing field)",
  "isComplete": false
}

isComplete is true only when you have eventType, location, date, guestCount, and totalBudget.
Keep responses warm, friendly, and professional. Use Nigerian context (NGN amounts, Nigerian cities, etc.)`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory,
    { role: 'user' as const, content: userMessage }
  ];

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content || '{}';
  return JSON.parse(content);
}

// ─── GENERATE EVENT PLANS ────────────────────────────
export interface EventPlanInput {
  eventType: string;
  location: string;
  date: string;
  guestCount: number;
  totalBudget: number;
  preferences?: Record<string, any>;
}

export async function generateEventPlans(input: EventPlanInput) {
  const { eventType, location, totalBudget, guestCount } = input;
  const normalizedType = eventType.toLowerCase().replace(' ', '_');
  const splits = BUDGET_SPLITS[normalizedType] || BUDGET_SPLITS.default;

  // Compute budget per category
  const budgetPerCategory: Record<string, number> = {};
  for (const [category, ratio] of Object.entries(splits)) {
    budgetPerCategory[category] = Math.round(totalBudget * ratio);
  }

  // Search vendors for each category
  const vendorSearchResults: Record<string, any[]> = {};
  const categories = Object.keys(splits);

  await Promise.all(categories.map(async (category) => {
    const categoryBudget = budgetPerCategory[category];
    const categoryEnum = getCategoryEnum(category);

    const vendors = await prisma.vendor.findMany({
      where: {
        category: categoryEnum,
        status: 'VERIFIED',
        city: { contains: location, mode: 'insensitive' },
        minPrice: { lte: categoryBudget * 1.2 }, // Allow 20% over budget
      },
      include: {
        portfolioItems: { take: 1, where: { isMain: true } },
        packages: { where: { isActive: true }, orderBy: { price: 'asc' }, take: 3 },
      },
      orderBy: [
        { rating: 'desc' },
        { bookingCount: 'desc' },
      ],
      take: 6,
    });

    vendorSearchResults[category] = vendors;
  }));

  // Build three plan tiers
  const plans = {
    budget: buildPlan('budget', vendorSearchResults, budgetPerCategory, totalBudget, 0),
    standard: buildPlan('standard', vendorSearchResults, budgetPerCategory, totalBudget, 1),
    premium: buildPlan('premium', vendorSearchResults, budgetPerCategory, totalBudget, 2),
  };

  // Generate AI explanations for each plan
  const explanation = await generatePlanExplanations(plans, input);

  return {
    budgetPerCategory,
    plans,
    explanation,
    totalVendorsFound: Object.values(vendorSearchResults).reduce((sum, v) => sum + v.length, 0),
  };
}

function buildPlan(
  tier: string,
  vendorResults: Record<string, any[]>,
  budgetPerCategory: Record<string, number>,
  totalBudget: number,
  vendorIndex: number
) {
  const selections: Record<string, any> = {};
  let planTotal = 0;

  for (const [category, vendors] of Object.entries(vendorResults)) {
    const categoryBudget = budgetPerCategory[category];
    const sortedVendors = [...vendors].sort((a, b) => {
      if (tier === 'budget') return Number(a.minPrice || 0) - Number(b.minPrice || 0);
      if (tier === 'premium') return Number(b.rating) - Number(a.rating);
      return Number(b.bookingCount) - Number(a.bookingCount);
    });

    const vendor = sortedVendors[Math.min(vendorIndex, sortedVendors.length - 1)];
    if (vendor) {
      const price = Number(vendor.minPrice) || categoryBudget;
      planTotal += price;
      selections[category] = {
        vendorId: vendor.id,
        businessName: vendor.businessName,
        rating: vendor.rating,
        price,
        currency: 'NGN',
        isInstantBook: vendor.isInstantBook,
        photoUrl: vendor.portfolioItems[0]?.url,
        withinBudget: price <= categoryBudget,
      };
    }
  }

  return {
    tier,
    label: tier === 'budget' ? 'Budget-Smart' : tier === 'premium' ? 'Premium Experience' : 'Best Value',
    totalCost: planTotal,
    budgetVariance: planTotal - totalBudget,
    selections,
  };
}

async function generatePlanExplanations(plans: any, input: EventPlanInput) {
  const prompt = `You are helping someone plan a ${input.eventType} in ${input.location} for ${input.guestCount} guests with a budget of ₦${input.totalBudget.toLocaleString()}.

Here are three vendor packages we found:
- Budget plan: ₦${plans.budget.totalCost.toLocaleString()}
- Standard plan: ₦${plans.standard.totalCost.toLocaleString()}  
- Premium plan: ₦${plans.premium.totalCost.toLocaleString()}

Write a brief, friendly 1-2 sentence explanation for each plan explaining the key tradeoff. Be specific to a Nigerian event context. Format as JSON: {"budget": "...", "standard": "...", "premium": "..."}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ─── GENERATE AI EVENT COPY ──────────────────────────
export async function generateEventCopy(prompt: string) {
  const systemPrompt = `You are an expert event copywriter for Owambe, a Nigerian event platform.
Generate engaging event content. Respond with JSON in this format:
{
  "name": "Event name",
  "description": "2-3 paragraph compelling description",
  "shortDescription": "One line tagline"
}
Keep tone professional but vibrant. Use Nigerian context where relevant.`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ─── GENERATE EMAIL COPY ─────────────────────────────
export async function generateEmailCopy(eventName: string, purpose: string) {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Write a professional event email for "${eventName}". Purpose: ${purpose}.
Return JSON: {"subject": "...", "body": "3-4 paragraph email body (plain text)"}`
    }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ─── GENERATE VENDOR BIO ─────────────────────────────
export async function generateVendorBio(businessName: string, category: string, details: string) {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Write a compelling vendor profile for "${businessName}", a ${category} service in Nigeria.
Details: ${details}
Return JSON: {"description": "150-200 word compelling description", "shortBio": "1 sentence tagline"}`
    }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ─── HELPERS ─────────────────────────────────────────
function getCategoryEnum(category: string): any {
  const map: Record<string, string> = {
    venue: 'VENUE',
    catering: 'CATERING',
    photography: 'PHOTOGRAPHY_VIDEO',
    av: 'AV_PRODUCTION',
    decor: 'DECOR_FLORALS',
    entertainment: 'ENTERTAINMENT',
    makeup: 'MAKEUP_ARTIST',
    speaker: 'SPEAKER',
  };
  return map[category] || 'VENUE';
}
