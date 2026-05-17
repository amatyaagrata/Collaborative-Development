export type InventoryAssistantReply =
  | { type: "supported"; answer: string }
  | { type: "unknown"; answer: string }
  | { type: "unrelated"; answer: string };

export const UNRELATED_MESSAGE =
  "I can only help with inventory management system related questions.";

export const SIGN_IN_FOR_DETAILS = "Please contact support or login for more information.";

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DOMAIN_KEYWORDS = [
  "gogodam",
  "inventory",
  "stock",
  "supplier",
  "purchase",
  "purchasing",
  "order",
  "orders",
  "product",
  "products",
  "category",
  "categories",
  "delivery",
  "deliveries",
  "logistic",
  "logistics",
  "transporter",
  "driver",
  "warehouse",
  "organization",
  "role",
  "roles",
  "dashboard",
  "login",
  "log in",
  "sign in",
  "signup",
  "sign up",
  "account",
  "password",
  "reset",
  "navigate",
  "navigation",
  "site",
  "website",
  "page",
  "pages",
  "home",
  "homepage",
  "tech",
  "technology",
  "stack",
  "react",
  "next",
  "supabase",
  "tailwind",
  "build",
  "built",
  "who",
  "developer",
  "developers",
  "creator",
  "creators",
  "team",
  "colab",
  "collaborative",
  "development",
  "contact",
  "support",
  "help",
  "feature",
  "features",
  "workflow",
  "workflows",
  "free",
  "pricing",
  "plan"
] as const;

function looksInScope(normalized: string) {
  if (!normalized) return false;
  if (
    /^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you)$/.test(
      normalized,
    )
  ) {
    return true;
  }
  return DOMAIN_KEYWORDS.some((k) => normalized.includes(k));
}

export function isInventoryQuestionInScope(question: string) {
  const normalized = normalize(question);
  if (looksInScope(normalized)) return true;
  for (const rule of RULES) {
    if (rule.match.test(normalized)) {
      return true;
    }
  }
  return false;
}

export function isSensitiveOrTechnicalRequest(question: string) {
  const normalized = normalize(question);
  return /\b(api|database|sql|admin password|credentials|secret|token|key)\b/.test(
    normalized,
  );
}

type Rule = { match: RegExp; answer: string };

const HELP_MENU =
  "I can help with: system overview, features, roles, getting started, inventory/stock, products, orders, suppliers, deliveries, login, and navigation.";

const RULES: Rule[] = [
  {
    match:
      /^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you)$/,
    answer:
      HELP_MENU,
  },
  {
    match: /\b(help|what can you do|menu|topics)\b/,
    answer: HELP_MENU,
  },
  {
    match: /\b(tech|technology|stack|react|next|supabase|tailwind)\b/,
    answer: "GoGodam is built using Next.js (version 16), React (version 19), TypeScript, Tailwind CSS (version 4), and Supabase for secure database management and role-based authentication.",
  },
  {
    match: /\b(who (built|made|created)|developer|developers|creator|creators|team|colab|collaborative|development)\b/,
    answer: "GoGodam was designed and developed by the Collaborative Development Team as a modern, multi-tenant inventory & logistics tracking system.",
  },
  {
    match: /\b(contact|support|help desk|admin contact)\b/,
    answer: "For support, you can reach out directly to your organization administrator or use the system help desk options on the Sign-in/Login page.",
  },
  {
    match: /\b(page|pages|homepage|home page|url|urls|route|routes)\b/,
    answer: "The public pages include the Home/Landing page (/), Login (/login), and Sign up (/signup). Once signed in, you will be redirected to your dedicated role dashboard.",
  },
  {
    match:
      /\b(what (is|does)|tell me about|overview|purpose|system do|how does (this|the) system work)\b/,
    answer:
      "This platform helps teams manage inventory, suppliers, orders, and deliveries in one place with role-based access.",
  },
  {
    match: /\b(get started|getting started|how do i start|setup|set up|onboard|onboarding)\b/,
    answer:
      "To get started: create an organization, add products & categories (with minimum stock levels), then place and track orders/deliveries based on your role.",
  },
  {
    match: /\b(feature|features|capabilit|what can (it|this) do)\b/,
    answer:
      "Core features include stock tracking, product & order management, supplier workflows, and delivery status updates (based on your role).",
  },
  {
    match: /\b(role|roles|who can use|user types|user roles)\b/,
    answer:
      "Common roles include Admin, Inventory Manager, Supplier, and Transporter—each sees only what they need to do their tasks.",
  },
  {
    match: /\b(inventory|stock) (work|tracking|manage|management|update|adjust)\b|\breorder\b|\bminimum stock\b|\bstockout\b/,
    answer:
      "Inventory is tracked per product. You can monitor current stock, set minimum levels, and follow reorder/fulfillment workflows based on your role.",
  },
  {
    match: /\b(stock alert|alerts|low stock|below minimum|minimum level)\b/,
    answer:
      "Low-stock alerts are triggered when items drop below your minimum level, helping you reorder before a stockout.",
  },
  {
    match: /\b(receiv|receive|goods received|grn|inbound)\b/,
    answer:
      "When an order is received, stock can be updated to reflect what arrived so inventory stays accurate for the next steps.",
  },
  {
    match: /\b(product|products|category|categories)\b/,
    answer:
      "Products are organized with categories and basic details so stock, orders, and reporting stay consistent across the workflow.",
  },
  {
    match: /\b(order|orders|purchase|purchasing)\b/,
    answer:
      "Orders move through clear status steps so teams can request, approve/confirm, and track progress without losing visibility.",
  },
  {
    match: /\b(status|statuses|workflow|step|steps)\b/,
    answer:
      "Each workflow uses clear statuses (for example: created → confirmed/approved → in progress → completed) so every role can track what’s next.",
  },
  {
    match: /\b(supplier|suppliers)\b/,
    answer:
      "Suppliers can receive and confirm orders, while your team can track supplier activity and lead times (depending on permissions).",
  },
  {
    match: /\b(stock tracking|supplier and stock|supplier tracking)\b/,
    answer:
      "You can track stock levels per product and follow supplier-related orders through their status updates (visibility depends on your role).",
  },
  {
    match: /\b(delivery|deliveries|transporter|driver|tracking|in transit)\b/,
    answer:
      "Deliveries can be tracked by status so everyone knows what’s pending, in transit, or completed—without sharing unnecessary details.",
  },
  {
    match: /\b(login|log in|sign in|account|password|forgot|reset|otp|code)\b/,
    answer:
      "If you’re having trouble signing in, double-check your email and password, then try a password reset if available on the sign-in page.",
  },
  {
    match: /\b(can't|cannot|can not|unable|failed).*\b(login|log in|sign in)\b|\b(login|log in|sign in).*\b(can't|cannot|can not|unable|failed)\b/,
    answer:
      "If sign-in fails: confirm your email, retry with the correct password, then use password reset if available. If you still can’t access, contact your organization admin to confirm your account is active.",
  },
  {
    match: /\b(sign up|signup|create account|register)\b/,
    answer:
      "To create an account, use the Sign up page and follow the organization setup/invite flow. If you don’t have access yet, ask your admin for an invite.",
  },
  {
    match: /\b(navigate|navigation|where do i|how do i find)\b/,
    answer:
      "Use the sidebar/dashboard links for your role. Start with Products/Inventory for stock, Orders for purchasing, and Deliveries for logistics.",
  },
  {
    match: /\b(where is|where are|how do i open|open the)\b.*\b(dashboard|inventory|products|orders|deliveries|suppliers)\b/,
    answer:
      "After signing in, use your role dashboard navigation to open Inventory/Products, Orders, Suppliers, or Deliveries. If you don’t see a section, your role may not have access.",
  },
  {
    match: /\b(api|database|sql|admin password|credentials|secret|token|key)\b/,
    answer: SIGN_IN_FOR_DETAILS,
  },
  {
    match: /\b(export|download|report|reports|analytics|chart|csv|pdf)\b/,
    answer: SIGN_IN_FOR_DETAILS,
  },
  {
    match: /\b(price|pricing|plan|billing|subscription)\b/,
    answer: SIGN_IN_FOR_DETAILS,
  },
] as const;

export function getInventoryAssistantReply(question: string): InventoryAssistantReply {
  const normalized = normalize(question);

  if (!isInventoryQuestionInScope(question)) {
    return { type: "unrelated", answer: UNRELATED_MESSAGE };
  }

  for (const rule of RULES) {
    if (rule.match.test(normalized)) {
      return { type: "supported", answer: rule.answer };
    }
  }

  return { type: "unknown", answer: SIGN_IN_FOR_DETAILS };
}
