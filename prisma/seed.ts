import {
  PrismaClient,
  AccountType,
  ProductStatus,
  CustomizationType,
} from "@prisma/client";

const prisma = new PrismaClient();

// ── Chart of Accounts ──────────────────────────────────────

const accounts = [
  { code: "1000", name: "Cash",                     type: AccountType.ASSET     },
  { code: "1100", name: "Accounts Receivable",      type: AccountType.ASSET     },
  { code: "1200", name: "Raw Material Inventory",   type: AccountType.ASSET     },
  { code: "1300", name: "Finished Goods Inventory", type: AccountType.ASSET     },
  { code: "2000", name: "Accounts Payable",         type: AccountType.LIABILITY },
  { code: "2100", name: "Sales Tax Payable",        type: AccountType.LIABILITY },
  { code: "2200", name: "Gift Card Liability",      type: AccountType.LIABILITY },
  { code: "3000", name: "Owner's Equity",           type: AccountType.EQUITY    },
  { code: "4000", name: "Product Revenue",          type: AccountType.REVENUE   },
  { code: "5000", name: "Cost of Goods Sold",       type: AccountType.EXPENSE   },
  { code: "6000", name: "Operating Expenses",       type: AccountType.EXPENSE   },
];

// ── Unsplash image helpers ─────────────────────────────────
// All photos are candle/luxury/ambiance themed

const IMG = {
  // Warm amber candle jar on marble
  amber:   "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&q=85&auto=format&fit=crop",
  // Minimal white candle on linen
  white:   "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=900&q=85&auto=format&fit=crop",
  // Dark moody candle with smoke
  moody:   "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=900&q=85&auto=format&fit=crop",
  // Candle in bathroom / spa setting
  spa:     "https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=900&q=85&auto=format&fit=crop",
  // Floral arrangement near candle
  floral:  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900&q=85&auto=format&fit=crop",
  // Cedar / woody cabin feel
  cedar:   "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=900&q=85&auto=format&fit=crop",
  // Gift box / packaging
  gift:    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=900&q=85&auto=format&fit=crop",
  // Candle flame close-up
  flame:   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85&auto=format&fit=crop",
};

// ── Seed data ──────────────────────────────────────────────

async function main() {

  // 1. Chart of Accounts
  console.log("Seeding Chart of Accounts...");
  for (const acc of accounts) {
    await prisma.account.upsert({
      where:  { code: acc.code },
      update: { name: acc.name, type: acc.type },
      create: acc,
    });
  }
  console.log(`✓ ${accounts.length} accounts`);

  // 2. Categories
  console.log("Seeding categories...");
  const [catWoody, catFloral, catFresh, catSpiced] = await Promise.all([
    prisma.category.upsert({
      where:  { slug: "woody" },
      update: {},
      create: {
        name: "Woody", slug: "woody",
        description: "Grounding notes of sandalwood, cedar, and vetiver.",
        imageUrl: IMG.cedar, isActive: true,
      },
    }),
    prisma.category.upsert({
      where:  { slug: "floral" },
      update: {},
      create: {
        name: "Floral", slug: "floral",
        description: "Soft and intimate — rose, jasmine, peony.",
        imageUrl: IMG.floral, isActive: true,
      },
    }),
    prisma.category.upsert({
      where:  { slug: "fresh" },
      update: {},
      create: {
        name: "Fresh", slug: "fresh",
        description: "Clean and bright — sea salt, green tea, citrus.",
        imageUrl: IMG.spa, isActive: true,
      },
    }),
    prisma.category.upsert({
      where:  { slug: "spiced" },
      update: {},
      create: {
        name: "Spiced", slug: "spiced",
        description: "Festive and deep — cinnamon, clove, cardamom.",
        imageUrl: IMG.moody, isActive: true,
      },
    }),
  ]);
  console.log("✓ 4 categories");

  // 3. Products
  console.log("Seeding products...");

  // Helper — creates product + images + finished goods + optional customizations + optional reviews
  async function createProduct(data: {
    sku: string;
    name: string;
    slug: string;
    description: string;
    story: string;
    price: number;
    scentFamily: string;
    burnTime: string;
    netWeight: number;
    waxType: string;
    fragranceNotes: string;
    categoryId: string;
    images: { url: string; altText: string; isPrimary: boolean; position: number }[];
    stock: number;
    customizations?: {
      name: string;
      description?: string;
      type: CustomizationType;
      isRequired: boolean;
      priceModifier?: number;
      maxLength?: number;
      placeholder?: string;
      sortOrder: number;
      options?: { label: string; priceModifier?: number; sortOrder: number }[];
    }[];
  }) {
    const product = await prisma.product.upsert({
      where:  { slug: data.slug },
      update: {},
      create: {
        sku: data.sku,
        name: data.name,
        slug: data.slug,
        description: data.description,
        story: data.story,
        price: data.price,
        scentFamily: data.scentFamily,
        burnTime: data.burnTime,
        netWeight: data.netWeight,
        waxType: data.waxType,
        fragranceNotes: data.fragranceNotes,
        categoryId: data.categoryId,
        status: ProductStatus.ACTIVE,
        taxable: true,
      },
    });

    // Images — only insert if none exist yet for this product
    const imgCount = await prisma.productImage.count({ where: { productId: product.id } });
    if (imgCount === 0) {
      await prisma.productImage.createMany({
        data: data.images.map((img) => ({ ...img, productId: product.id })),
      });
    }

    // Finished goods (stock)
    await prisma.finishedGoods.upsert({
      where:  { productId: product.id },
      update: { quantityOnHand: data.stock },
      create: { productId: product.id, quantityOnHand: data.stock, averageCost: data.price * 0.3 },
    });

    // Customizations
    if (data.customizations) {
      for (const c of data.customizations) {
        const existing = await prisma.productCustomization.findFirst({
          where: { productId: product.id, name: c.name },
        });
        const cust = existing ?? await prisma.productCustomization.create({
          data: {
            productId:     product.id,
            name:          c.name,
            description:   c.description ?? null,
            type:          c.type,
            isRequired:    c.isRequired,
            priceModifier: c.priceModifier ?? 0,
            maxLength:     c.maxLength ?? null,
            placeholder:   c.placeholder ?? null,
            sortOrder:     c.sortOrder,
            isActive:      true,
          },
        });

        if (c.options) {
          const optCount = await prisma.customizationOption.count({ where: { customizationId: cust.id } });
          if (optCount === 0) {
            await prisma.customizationOption.createMany({
              data: c.options.map((opt) => ({
                customizationId: cust.id,
                label:           opt.label,
                priceModifier:   opt.priceModifier ?? 0,
                sortOrder:       opt.sortOrder,
              })),
            });
          }
        }
      }
    }

    // Reviews require an orderId (purchase verification) — skipped in seed.
    // Add reviews via the admin portal or customer flow after placing orders.

    return product;
  }

  // ── Product 1: Noir Sandalwood ─────────────────────────
  await createProduct({
    sku: "MSN-001",
    name: "Noir Sandalwood",
    slug: "noir-sandalwood",
    description: "A rich, meditative burn of aged sandalwood and smoky vetiver, grounded in warm amber. For rooms that should feel like a secret.",
    story: "Noir Sandalwood was born from a single afternoon in a Kyoto incense shop — the kind of place where time slows down and the air carries centuries. We spent six months working with our perfumer to capture that feeling: woody without being dry, smoky without being harsh. The result is our most meditative scent.",
    price: 58,
    scentFamily: "Woody",
    burnTime: "55–65 hrs",
    netWeight: "280g",
    waxType: "Coconut-soy blend",
    fragranceNotes: "top: black pepper, cardamom | heart: sandalwood, vetiver | base: amber, musk",
    categoryId: catWoody.id,
    stock: 24,
    images: [
      { url: IMG.amber, altText: "Noir Sandalwood candle in amber glass jar", isPrimary: true,  position: 1 },
      { url: IMG.moody, altText: "Noir Sandalwood — moody detail shot",       isPrimary: false, position: 2 },
    ],
    customizations: [
      {
        name: "Label Engraving",
        description: "Add a personal message to the label — up to 40 characters.",
        type: CustomizationType.TEXT_INPUT,
        isRequired: false,
        priceModifier: 8,
        maxLength: 40,
        placeholder: "e.g. Happy Birthday, Sarah",
        sortOrder: 1,
      },
      {
        name: "Gift Wrapping",
        description: "Hand-tied satin ribbon with a handwritten gift card.",
        type: CustomizationType.CHECKBOX,
        isRequired: false,
        priceModifier: 12,
        sortOrder: 2,
      },
    ],
    reviews: [
      { rating: 5, title: "Absolutely stunning", body: "This is the most sophisticated candle I've ever owned. The sandalwood is rich without being overpowering, and the burn time is incredible. Already on my third one." },
      { rating: 5, title: "My favourite purchase this year", body: "I bought this on a whim and it completely transformed my living room. The scent throw is perfect — fills the room without being overwhelming." },
      { rating: 4, title: "Beautiful but pricey", body: "The quality is undeniable. The glass jar alone is beautiful enough to keep after. Knocking one star only because I wish it came in a larger size." },
    ],
  });

  // ── Product 2: Cedarwood & Smoke ──────────────────────
  await createProduct({
    sku: "MCS-002",
    name: "Cedarwood & Smoke",
    slug: "cedarwood-smoke",
    description: "Virginia cedarwood and birch tar, with a trace of cold ash. Like a fire that's just gone out in a mountain cabin.",
    story: "We created this scent for the people who prefer silence to conversation, fires to central heating, and mountains to cities. Cedarwood & Smoke is uncompromising — it doesn't soften its edges for anyone. And that's exactly why our most loyal customers won't burn anything else in winter.",
    price: 52,
    scentFamily: "Woody",
    burnTime: "50–60 hrs",
    netWeight: "260g",
    waxType: "Coconut-soy blend",
    fragranceNotes: "top: birch tar, eucalyptus | heart: cedarwood, cypress | base: cold ash, oakmoss",
    categoryId: catWoody.id,
    stock: 18,
    images: [
      { url: IMG.cedar, altText: "Cedarwood & Smoke candle",        isPrimary: true,  position: 1 },
      { url: IMG.flame, altText: "Candle flame close-up detail",    isPrimary: false, position: 2 },
    ],
    customizations: [
      {
        name: "Label Engraving",
        description: "Personalise the label — up to 40 characters.",
        type: CustomizationType.TEXT_INPUT,
        isRequired: false,
        priceModifier: 8,
        maxLength: 40,
        placeholder: "e.g. For my favourite person",
        sortOrder: 1,
      },
    ],
    reviews: [
      { rating: 5, title: "Exactly what I wanted", body: "I've been searching for a candle that smells like an actual fire — not a synthetic approximation. This is it. The cold ash note in the dry-down is extraordinary." },
      { rating: 4, title: "Perfectly masculine", body: "Bought this for my husband and he hasn't stopped burning it. We'll be ordering another before it runs out." },
    ],
  });

  // ── Product 3: Rose & Vetiver ──────────────────────────
  await createProduct({
    sku: "MRV-003",
    name: "Rose & Vetiver",
    slug: "rose-vetiver",
    description: "Bulgarian rose absolute and earthy vetiver — a floral with roots. Soft enough for daytime, complex enough for evening.",
    story: "The rose in this candle comes from a family-run distillery in Bulgaria's Rose Valley, where the harvest window is just two weeks each May. We blend it with Haitian vetiver to give it weight — a rose that doesn't apologise for existing. This is our most requested candle for gifting.",
    price: 64,
    scentFamily: "Floral",
    burnTime: "55–65 hrs",
    netWeight: "280g",
    waxType: "Coconut-soy blend",
    fragranceNotes: "top: lychee, bergamot | heart: Bulgarian rose, geranium | base: vetiver, white musk",
    categoryId: catFloral.id,
    stock: 31,
    images: [
      { url: IMG.floral, altText: "Rose & Vetiver candle with floral arrangement", isPrimary: true,  position: 1 },
      { url: IMG.white,  altText: "Rose & Vetiver — minimal product shot",          isPrimary: false, position: 2 },
    ],
    customizations: [
      {
        name: "Label Engraving",
        description: "A personal message on the label — perfect for gifting.",
        type: CustomizationType.TEXT_INPUT,
        isRequired: false,
        priceModifier: 8,
        maxLength: 40,
        placeholder: "e.g. With love, always",
        sortOrder: 1,
      },
      {
        name: "Gift Wrapping",
        description: "Satin ribbon and handwritten gift card on ivory stock.",
        type: CustomizationType.CHECKBOX,
        isRequired: false,
        priceModifier: 12,
        sortOrder: 2,
      },
      {
        name: "Ribbon Colour",
        description: "Choose your ribbon colour for gift wrapping.",
        type: CustomizationType.SELECT,
        isRequired: false,
        priceModifier: 0,
        sortOrder: 3,
        options: [
          { label: "Ivory",      priceModifier: 0, sortOrder: 1 },
          { label: "Blush pink", priceModifier: 0, sortOrder: 2 },
          { label: "Sage green", priceModifier: 0, sortOrder: 3 },
          { label: "Noir",       priceModifier: 0, sortOrder: 4 },
        ],
      },
    ],
    reviews: [
      { rating: 5, title: "The most beautiful thing I own", body: "I don't say this lightly — this candle has changed how I feel in my home. The rose is unmistakable but not sweet. It smells expensive because it is." },
      { rating: 5, title: "Perfect anniversary gift", body: "Ordered with engraving and gift wrap. The presentation was flawless and she cried. Worth every penny." },
      { rating: 5, title: "My signature scent", body: "I've had this burning every evening for three months. When it runs out I feel genuinely lost. Ordering my fourth jar now." },
    ],
  });

  // ── Product 4: White Jasmine ───────────────────────────
  await createProduct({
    sku: "MWJ-004",
    name: "White Jasmine",
    slug: "white-jasmine",
    description: "Night-blooming jasmine captured at peak intensity — indulgent and unapologetically feminine. Best in small rooms.",
    story: "Jasmine is one of the hardest florals to get right in a candle. At low concentration it disappears; at high it becomes synthetic. Our perfumer spent four months finding the exact ratio that lets it bloom naturally as the wax heats. White Jasmine is the result — heady, confident, and true.",
    price: 56,
    scentFamily: "Floral",
    burnTime: "45–55 hrs",
    netWeight: "240g",
    waxType: "Coconut-soy blend",
    fragranceNotes: "top: neroli, green leaves | heart: white jasmine, tuberose | base: sandalwood, vanilla",
    categoryId: catFloral.id,
    stock: 5, // Low stock — triggers "Only 5 left" badge
    images: [
      { url: IMG.white,  altText: "White Jasmine candle in frosted glass",  isPrimary: true,  position: 1 },
      { url: IMG.floral, altText: "White Jasmine — lifestyle shot",         isPrimary: false, position: 2 },
    ],
    reviews: [
      { rating: 4, title: "Almost perfect", body: "The jasmine is gorgeous — real, not synthetic. I only wish the throw was slightly stronger. On a bedside table it's perfect; for a large living room you may need two." },
    ],
  });

  // ── Product 5: Sea Salt & Driftwood ───────────────────
  await createProduct({
    sku: "MSD-005",
    name: "Sea Salt & Driftwood",
    slug: "sea-salt-driftwood",
    description: "Coastal air, salt spray, and sun-bleached wood. Clean, minimal, and effortlessly calming.",
    story: "We develop new scents by starting with a single memory. This one belonged to our founder — a week on the Normandy coast, windows open, reading in a beach house that smelled of salt and old wood. We wanted to bottle that feeling of absolute stillness.",
    price: 48,
    scentFamily: "Fresh",
    burnTime: "50–60 hrs",
    netWeight: "260g",
    waxType: "Coconut-soy blend",
    fragranceNotes: "top: sea salt, citrus | heart: driftwood, white tea | base: clean musk, light amber",
    categoryId: catFresh.id,
    stock: 42,
    images: [
      { url: IMG.spa,   altText: "Sea Salt & Driftwood candle in spa setting",  isPrimary: true,  position: 1 },
      { url: IMG.white, altText: "Sea Salt & Driftwood — clean product shot",   isPrimary: false, position: 2 },
    ],
    customizations: [
      {
        name: "Label Engraving",
        description: "Add a personal message — up to 40 characters.",
        type: CustomizationType.TEXT_INPUT,
        isRequired: false,
        priceModifier: 8,
        maxLength: 40,
        placeholder: "e.g. Our happy place",
        sortOrder: 1,
      },
    ],
    reviews: [
      { rating: 5, title: "Instant calm", body: "I light this every time I need to decompress after work. The saltiness is so real — it genuinely transports you. My most-repurchased candle by far." },
      { rating: 5, title: "Perfect for minimalists", body: "If you want a candle that doesn't announce itself but quietly makes everything better, this is it. Pairs beautifully with linen and oak." },
    ],
  });

  // ── Product 6: Spiced Noir ─────────────────────────────
  await createProduct({
    sku: "MSP-006",
    name: "Spiced Noir",
    slug: "spiced-noir",
    description: "Dark rum, cinnamon bark, and clove — festive but sophisticated. A winter ritual in a jar.",
    story: "Spiced Noir started as a limited Christmas edition and never left. Our customers refused to let it go. There is something about the combination of dark rum and warm spices that makes a room feel like somewhere you'd want to stay. We kept it permanent because we believe every evening deserves that feeling.",
    price: 54,
    scentFamily: "Spiced",
    burnTime: "55–65 hrs",
    netWeight: "280g",
    waxType: "Coconut-soy blend",
    fragranceNotes: "top: dark rum, orange peel | heart: cinnamon, clove | base: vanilla, patchouli",
    categoryId: catSpiced.id,
    stock: 19,
    images: [
      { url: IMG.moody, altText: "Spiced Noir candle — dark moody setting",  isPrimary: true,  position: 1 },
      { url: IMG.amber, altText: "Spiced Noir — amber jar detail",           isPrimary: false, position: 2 },
    ],
    customizations: [
      {
        name: "Label Engraving",
        description: "Personalise for gifting — up to 40 characters.",
        type: CustomizationType.TEXT_INPUT,
        isRequired: false,
        priceModifier: 8,
        maxLength: 40,
        placeholder: "e.g. Warmth & good company",
        sortOrder: 1,
      },
      {
        name: "Gift Wrapping",
        description: "Satin ribbon and handwritten card on ivory stock.",
        type: CustomizationType.CHECKBOX,
        isRequired: false,
        priceModifier: 12,
        sortOrder: 2,
      },
    ],
    reviews: [
      { rating: 5, title: "Christmas in a jar", body: "I buy four of these every November — one for me and three for gifts. The rum note keeps it from being a generic 'Christmas spice' candle. Genuinely sophisticated." },
      { rating: 5, title: "Year-round favourite", body: "Don't let the 'spiced' category fool you — this works every month of the year. On a cold evening it's the coziest thing I own." },
      { rating: 4, title: "Strong scent throw", body: "This is a powerful one. In my open-plan kitchen/living room it fills the whole space. Incredible quality." },
    ],
  });

  console.log("✓ 6 products seeded");
  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
