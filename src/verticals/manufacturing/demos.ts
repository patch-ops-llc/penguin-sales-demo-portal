import type { Pack } from "../types";

// Per-demo content for Manufacturing: hero records, rule tables, presets, and prepared output.
// The demo templates in src/demos read everything vertical-specific from here.

export const demos: Pack["demos"] = {
  // ---------- Demo 1: Guided quote ----------
  guidedQuote: {
    dealId: "dl-line4",
    contactId: "ct-hannah",
    intro: "Answer four discovery questions about the application. The rate card follows: the right parts, with prices and quoted lead times.",
    fields: [
      {
        id: "load",
        label: "Peak load",
        help: "Sets the actuator frame and the drive size.",
        options: [
          { id: "1kn", label: "Up to 1 kN", hint: "Frame 40", attrs: { frame: "40", price: 1180, amps: "08", drivePrice: 610, mountPrice: 150 } },
          { id: "2_5kn", label: "Up to 2.5 kN", hint: "Frame 60", attrs: { frame: "60", price: 1640, amps: "12", drivePrice: 890, mountPrice: 210 } },
          { id: "6kn", label: "Up to 6 kN", hint: "Frame 80", attrs: { frame: "80", price: 2390, amps: "20", drivePrice: 1380, mountPrice: 290 } },
        ],
      },
      {
        id: "stroke",
        label: "Stroke length",
        options: [
          { id: "100", label: "100 mm", attrs: { code: "100", price: 0, lead: 0 } },
          { id: "200", label: "200 mm", attrs: { code: "200", price: 140, lead: 0 } },
          { id: "300", label: "300 mm", attrs: { code: "300", price: 260, lead: 0 } },
          { id: "500", label: "500 mm", attrs: { code: "500", price: 480, lead: 7 } },
        ],
      },
      {
        id: "env",
        label: "Environment",
        help: "Washdown switches the build to stainless steel.",
        options: [
          { id: "standard", label: "Standard", hint: "IP54, anodized aluminum", attrs: { suffix: "", nameSuffix: "", mult: 1, lead: 0, cable: "STD", cableName: "", cablePrice: 165 } },
          { id: "washdown", label: "Washdown", hint: "IP69K, stainless steel", attrs: { suffix: "-SS", nameSuffix: ", stainless washdown", mult: 1.35, lead: 14, cable: "WD", cableName: ", washdown rated", cablePrice: 245 } },
        ],
      },
      {
        id: "voltage",
        label: "Supply voltage",
        options: [
          { id: "24vdc", label: "24 VDC", attrs: { code: "24", price: 0 } },
          { id: "48vdc", label: "48 VDC", attrs: { code: "48", price: 60 } },
          { id: "230vac", label: "230 VAC", attrs: { code: "230", price: 120 } },
        ],
      },
    ],
    quantity: { label: "Quantity (axes)", options: [4, 8, 12, 24] },
    needBy: {
      label: "Need-by date",
      options: [
        { id: "2w", label: "In 2 weeks", days: 14 },
        { id: "4w", label: "In 4 weeks", days: 28 },
        { id: "8w", label: "In 8 weeks", days: 56 },
      ],
    },
    constraints: [
      { when: { load: ["1kn"] }, field: "stroke", disable: ["500"], reason: "Frame 40 is limited to 300 mm stroke" },
      { when: { load: ["6kn"] }, field: "voltage", disable: ["24vdc"], reason: "Frame 80 draws more than a 24 VDC drive supplies" },
      { when: { env: ["washdown"] }, field: "voltage", disable: ["230vac"], reason: "Washdown builds are low voltage only" },
    ],
    lines: [
      {
        role: "Actuator",
        sku: "HM-LA{load.frame}-{stroke.code}{env.suffix}",
        name: "Linear actuator, frame {load.frame}, {stroke.label} stroke{env.nameSuffix}",
        description: "{load.label} peak load. {env.hint}.",
        price: { base: 0, add: ["load.price", "stroke.price"], multiply: ["env.mult"] },
        costRatio: 0.6,
        lead: { base: 10, add: ["stroke.lead", "env.lead"] },
        qtyPerUnit: 1,
      },
      {
        role: "Drive",
        sku: "HM-SD{load.amps}-{voltage.code}",
        name: "Servo drive, {load.amps} A, {voltage.label}",
        description: "Sized for frame {load.frame}.",
        price: { base: 0, add: ["load.drivePrice", "voltage.price"], multiply: [] },
        costRatio: 0.6,
        lead: { base: 5, add: [] },
        qtyPerUnit: 1,
      },
      {
        role: "Cable kit",
        sku: "HM-CK-{env.cable}-5M",
        name: "Motor and feedback cable kit, 5 m{env.cableName}",
        description: "One kit per axis.",
        price: { base: 0, add: ["env.cablePrice"], multiply: [] },
        costRatio: 0.6,
        lead: { base: 3, add: [] },
        qtyPerUnit: 1,
      },
      {
        role: "Mounting",
        sku: "HM-MK{load.frame}-TR{env.suffix}",
        name: "Trunnion mounting kit, frame {load.frame}{env.nameSuffix}",
        description: "Matches the actuator frame.",
        price: { base: 0, add: ["load.mountPrice"], multiply: ["env.mult"] },
        costRatio: 0.6,
        lead: { base: 3, add: ["env.lead"] },
        qtyPerUnit: 1,
      },
    ],
    notes: [
      { when: { env: ["washdown"] }, text: "Washdown selected: actuator and mounting switched to stainless steel, cable kit to washdown rated." },
      { when: { stroke: ["500"] }, text: "500 mm stroke is built to order and adds one week." },
    ],
    scripted: { selections: { load: "2_5kn", stroke: "300", env: "washdown", voltage: "48vdc" }, quantity: 8, needBy: "4w" },
    quoteTitle: "Brightwater Packaging: Line 4 retrofit",
  },

  // ---------- Demo 6: Discount approval ----------
  discountApproval: {
    quoteId: "q-1042",
    thresholdPct: 10,
    marginFloorPct: 30,
    approverId: "priya",
    scriptedDiscountPct: 18,
  },

  // ---------- Demo 3: Back-office data in HubSpot ----------
  backOffice: {
    companyId: "co-brightwater",
    contactId: "ct-luis",
    systemLabel: "ERP",
    syncedAt: "@-2mi",
    orders: [
      {
        id: "so-48213",
        number: "SO-48213",
        date: "@-23d",
        status: "Shipped",
        po: "BW-7731",
        total: 21840,
        lines: [
          { sku: "HM-LA60-200", name: "Linear actuator, frame 60, 200 mm stroke", qty: 8, unitPrice: 1655 },
          { sku: "HM-SD12-48", name: "Servo drive, 12 A, 48 VDC", qty: 8, unitPrice: 885 },
          { sku: "HM-CK-STD-5M", name: "Motor and feedback cable kit, 5 m", qty: 10, unitPrice: 152 },
        ],
      },
      {
        id: "so-47102",
        number: "SO-47102",
        date: "@-71d",
        status: "Shipped",
        po: "BW-7604",
        total: 46020,
        lines: [
          { sku: "HM-LA80-300", name: "Linear actuator, frame 80, 300 mm stroke", qty: 12, unitPrice: 2465 },
          { sku: "HM-SD20-48", name: "Servo drive, 20 A, 48 VDC", qty: 12, unitPrice: 1100 },
          { sku: "HM-MK80-TR", name: "Trunnion mounting kit, frame 80", qty: 12, unitPrice: 270 },
        ],
      },
      {
        id: "so-46388",
        number: "SO-46388",
        date: "@-112d",
        status: "Shipped",
        po: "BW-7498",
        total: 9930,
        lines: [
          { sku: "HM-LA60-200", name: "Linear actuator, frame 60, 200 mm stroke", qty: 6, unitPrice: 1655 },
        ],
      },
      {
        id: "so-45511",
        number: "SO-45511",
        date: "@-160d",
        status: "Shipped",
        po: "BW-7350",
        total: 15240,
        lines: [
          { sku: "HM-LA60-200", name: "Linear actuator, frame 60, 200 mm stroke", qty: 6, unitPrice: 1655 },
          { sku: "HM-SD12-48", name: "Servo drive, 12 A, 48 VDC", qty: 6, unitPrice: 885 },
        ],
      },
      {
        id: "so-44790",
        number: "SO-44790",
        date: "@-214d",
        status: "Shipped",
        po: "BW-7212",
        total: 5310,
        lines: [{ sku: "HM-SD12-48", name: "Servo drive, 12 A, 48 VDC", qty: 6, unitPrice: 885 }],
      },
      {
        id: "so-43902",
        number: "SO-43902",
        date: "@-268d",
        status: "Shipped",
        po: "BW-7089",
        total: 21200,
        lines: [
          { sku: "HM-LA60-300", name: "Linear actuator, frame 60, 300 mm stroke", qty: 8, unitPrice: 1765 },
          { sku: "HM-SD12-48", name: "Servo drive, 12 A, 48 VDC", qty: 8, unitPrice: 885 },
        ],
      },
    ],
    invoices: [
      { id: "inv-90412", number: "INV-90412", date: "@-21d", dueDate: "@+9d", amount: 21840, balance: 12480, status: "Open" },
      { id: "inv-89877", number: "INV-89877", date: "@-69d", dueDate: "@-39d", amount: 46020, balance: 5980, status: "Overdue" },
      { id: "inv-89102", number: "INV-89102", date: "@-110d", dueDate: "@-80d", amount: 9930, balance: 0, status: "Paid" },
      { id: "inv-88310", number: "INV-88310", date: "@-158d", dueDate: "@-128d", amount: 15240, balance: 0, status: "Paid" },
      { id: "inv-87554", number: "INV-87554", date: "@-212d", dueDate: "@-182d", amount: 5310, balance: 0, status: "Paid" },
    ],
    stock: [
      { sku: "HM-LA60-200", name: "Linear actuator, frame 60, 200 mm stroke", onHand: 26, leadDays: 2, contractPrice: 1655, listPrice: 1780, unitCost: 1068, lastOrdered: "@-23d", usualQty: 6 },
      { sku: "HM-SD12-48", name: "Servo drive, 12 A, 48 VDC", onHand: 37, leadDays: 2, contractPrice: 885, listPrice: 950, unitCost: 570, lastOrdered: "@-23d", usualQty: 6 },
      { sku: "HM-CK-STD-5M", name: "Motor and feedback cable kit, 5 m", onHand: 210, leadDays: 1, contractPrice: 152, listPrice: 165, unitCost: 99, lastOrdered: "@-23d", usualQty: 12 },
      { sku: "HM-LA80-300", name: "Linear actuator, frame 80, 300 mm stroke", onHand: 9, leadDays: 2, contractPrice: 2465, listPrice: 2650, unitCost: 1590, lastOrdered: "@-71d", usualQty: 12 },
      { sku: "HM-SD20-48", name: "Servo drive, 20 A, 48 VDC", onHand: 11, leadDays: 2, contractPrice: 1100, listPrice: 1440, unitCost: 864, lastOrdered: "@-71d", usualQty: 12 },
      { sku: "HM-MK80-TR", name: "Trunnion mounting kit, frame 80", onHand: 40, leadDays: 1, contractPrice: 270, listPrice: 290, unitCost: 174, lastOrdered: "@-71d", usualQty: 12 },
      { sku: "HM-LA60-300", name: "Linear actuator, frame 60, 300 mm stroke", onHand: 14, leadDays: 2, contractPrice: 1765, listPrice: 1900, unitCost: 1140, lastOrdered: "@-268d", usualQty: 8 },
      { sku: "HM-LA60-300-SS", name: "Linear actuator, frame 60, 300 mm stroke, stainless washdown", onHand: 0, leadDays: 24, contractPrice: 2385, listPrice: 2565, unitCost: 1539, lastOrdered: "", usualQty: 4 },
    ],
    scriptedSkus: ["HM-LA60-200", "HM-SD12-48", "HM-CK-STD-5M"],
    scriptedOrderId: "so-48213",
    quoteTitle: "Brightwater Packaging: Stock reorder",
    dealName: "Brightwater Packaging: Stock reorder",
  },

  // ---------- Demo 2: Lead capture to pipeline ----------
  leadCapture: {
    site: {
      company: "Halvorsen Motion",
      url: "www.halvorsenmotion.example/request-a-quote",
      headline: "Request a quote",
      sub: "Tell us about your application. An engineer in your region replies within one business day.",
      formTitle: "Request a quote",
      interests: ["Washdown linear actuators", "Servo drives", "Something else"],
    },
    presets: [
      {
        id: "hot",
        label: "Northfield Bottling",
        outcome: "Strong fit: routed to the territory rep",
        form: {
          firstName: "Erin",
          lastName: "Castillo",
          email: "erin.castillo@northfieldbottling.example",
          phone: "(555) 0182-4410",
          title: "Director of Engineering",
          company: "Northfield Bottling Co.",
          interest: "Washdown linear actuators",
          message: "We are replacing pneumatic cylinders on two filler lines. 16 axes, washdown rated, needed before our March shutdown.",
        },
        company: {
          domain: "northfieldbottling.example",
          industry: "Beverage production",
          city: "Columbus",
          state: "OH",
          employees: 850,
          revenue: 210_000_000,
          phone: "(555) 0182-4400",
          description: "Contract bottler for regional beverage brands, with three plants in Ohio and Indiana.",
          territory: "Midwest",
          type: "Prospect",
        },
        score: 86,
        reasons: [
          { label: "Industry match", points: 25, detail: "Beverage production is a target industry" },
          { label: "Company size", points: 20, detail: "850 employees, $210M revenue" },
          { label: "Buying intent", points: 21, detail: "3 pricing-page visits in the last 7 days" },
          { label: "RFQ form", points: 20, detail: "Gave quantity and a need-by date" },
        ],
        route: { branchId: "field", ownerId: "dana", summary: "Territory: Midwest. Product line: Actuators. Owner: Dana Ruiz" },
        task: { title: "Follow up on new inquiry: Northfield Bottling Co.", dueInMinutes: 60, notes: "Hot RFQ from Northfield Bottling Co. Score 86. 16 washdown axes before a March shutdown." },
        deal: { name: "Northfield Bottling Co.: Washdown actuators RFQ", amount: 48000 },
        alert: { channel: "#sales-midwest", text: "New RFQ lead: Erin Castillo, Northfield Bottling Co. Score 86. Assigned to Dana Ruiz. Call within 1 hour." },
      },
      {
        id: "mid",
        label: "Tidewater Conveyor",
        outcome: "Medium fit: routed to inside sales",
        form: {
          firstName: "Sam",
          lastName: "Whitaker",
          email: "sam.whitaker@tidewaterconveyor.example",
          phone: "(555) 0175-2296",
          title: "Maintenance Supervisor",
          company: "Tidewater Conveyor",
          interest: "Servo drives",
          message: "Looking for replacement drives for four older conveyor axes. Not urgent.",
        },
        company: {
          domain: "tidewaterconveyor.example",
          industry: "Material handling",
          city: "Norfolk",
          state: "VA",
          employees: 120,
          revenue: 18_000_000,
          phone: "(555) 0175-2200",
          description: "Builds and services conveyor systems for ports and distribution centers.",
          territory: "Southeast",
          type: "Prospect",
        },
        score: 58,
        reasons: [
          { label: "Industry match", points: 25, detail: "Material handling is a target industry" },
          { label: "Company size", points: 10, detail: "120 employees, $18M revenue" },
          { label: "Buying intent", points: 8, detail: "1 pricing-page visit in the last 7 days" },
          { label: "RFQ form", points: 15, detail: "Gave quantity, no need-by date" },
        ],
        route: { branchId: "inside", ownerId: "marcus", summary: "Score under 70: inside sales. Owner: Marcus Lee" },
        task: { title: "Follow up on new inquiry: Tidewater Conveyor", dueInMinutes: 480, notes: "Replacement drives for four conveyor axes. Score 58." },
        deal: { name: "Tidewater Conveyor: Replacement drives", amount: 6500 },
        alert: { channel: "#inside-sales", text: "New RFQ lead: Sam Whitaker, Tidewater Conveyor. Score 58. Assigned to Marcus Lee. Email today." },
      },
      {
        id: "low",
        label: "Lakeview Technical College",
        outcome: "Poor fit: sent to nurture",
        form: {
          firstName: "Jordan",
          lastName: "Pike",
          email: "jordan.pike@lakeviewtech.example",
          phone: "(555) 0143-9087",
          title: "Student",
          company: "Lakeview Technical College",
          interest: "Something else",
          message: "Need one small actuator for a capstone project. Do you offer student pricing?",
        },
        company: {
          domain: "lakeviewtech.example",
          industry: "Education",
          city: "Duluth",
          state: "MN",
          employees: 400,
          revenue: 0,
          phone: "(555) 0143-9000",
          description: "Two-year technical college.",
          territory: "Midwest",
          type: "Other",
        },
        score: 22,
        reasons: [
          { label: "Industry match", points: 0, detail: "Education is not a target industry" },
          { label: "Company size", points: 7, detail: "400 employees, no revenue on record" },
          { label: "Buying intent", points: 0, detail: "No pricing-page visits" },
          { label: "RFQ form", points: 15, detail: "Quantity of one" },
        ],
        route: { branchId: "nurture", ownerId: null, summary: "Score under 40: nurture. No owner assigned" },
      },
    ],
    scriptedPresetId: "hot",
    workflowId: "wf-rfq-routing",
    dealStage: "new-rfq",
  },

  // ---------- Demo 4: Email to deal ----------
  emailToDeal: { sampleIds: ["th-kestrel-rfq", "th-brightwater-po", "th-orchard-rfq"], scriptedThreadId: "th-kestrel-rfq", dealStage: "new-rfq" },

  // ---------- Demo 5: AI prospecting ----------
  aiProspecting: {
    companyId: "co-corvale",
    signalDetail: {
      fed: {
        title: "Reorder gap",
        source: "ERP order history",
        detail: "14 months since the last order, against a 9-month average between orders.",
        bars: [
          { label: "Usual gap between orders", value: 9, unit: "months" },
          { label: "Since the last order", value: 14, unit: "months", now: true },
        ],
        footnote: "Calculated from ERP Last Order Date and the account's order history.",
      },
      native: {
        title: "Plant expansion",
        source: "Company news",
        detail: "A fifth plant in Greenville, SC was announced last week, opening next year.",
        footnote: "Found by Breeze from public company news.",
      },
    },
    whyNow: {
      headline: "Corvale Foods is overdue to reorder and is building a new plant.",
      points: [
        { label: "Reorder gap", detail: "14 months since the last order, against a 9-month average between orders.", source: "ERP order history" },
        { label: "Plant expansion", detail: "A fifth plant in Greenville, SC was announced last week, opening next year.", source: "Company news" },
        { label: "Installed base", detail: "62 Halvorsen actuators across three plants, most past their 5-year service interval.", source: "ERP order history" },
      ],
    },
    buyingGroup: [
      { id: "bg-renee", name: "Renee Hallas", title: "Plant Manager", role: "Decision Maker", email: "renee.hallas@corvalefoods.example", contactId: "ct-renee", why: "Signed the last two orders." },
      { id: "bg-victor", name: "Victor Dunn", title: "Maintenance Lead", role: "Champion", email: "victor.dunn@corvalefoods.example", contactId: "ct-victor", why: "Runs the lines that use Halvorsen actuators." },
      { id: "bg-priyanka", name: "Priyanka Rao", title: "Director of Procurement", role: "Budget Holder", email: "priyanka.rao@corvalefoods.example", contactId: null, why: "Joined four months ago. Owns equipment sourcing for the new plant." },
      { id: "bg-owen", name: "Owen Liddell", title: "Project Engineer, Greenville expansion", role: "Influencer", email: "owen.liddell@corvalefoods.example", contactId: null, why: "Named in the expansion announcement as equipment lead." },
    ],
    drafts: {
      "bg-renee": [
        {
          tone: "Direct",
          subject: "Greenville plant and your Halvorsen lines",
          body: "Hi Renee,\n\nCongratulations on the Greenville announcement. It has been 14 months since your last Halvorsen order, and most of the actuators on the Spartanburg filling lines are now past their service interval.\n\nWould it help to review two things together: a refresh plan for the existing lines, and the motion package for Greenville? I can bring current lead times and your contract pricing.\n\nDo you have 20 minutes next week?\n\nAlex Morgan\nHalvorsen Motion",
        },
        {
          tone: "Consultative",
          subject: "Planning motion for Greenville",
          body: "Hi Renee,\n\nI saw the news about the fifth plant. New lines are usually the best moment to standardize on one actuator platform, and you already run 62 of ours across three plants.\n\nI put together a short comparison of what standardizing would save in spares and training. Happy to walk through it, and to look at the service plan for the existing lines at the same time.\n\nWhat does your planning calendar look like this month?\n\nAlex Morgan\nHalvorsen Motion",
        },
        {
          tone: "Brief",
          subject: "Greenville: quick question",
          body: "Hi Renee,\n\nCongratulations on Greenville. Are you specifying motion equipment for the new lines yet? If so, I would like to get you current pricing and lead times before the quarter ends.\n\nAlex Morgan\nHalvorsen Motion",
        },
      ],
      "bg-victor": [
        {
          tone: "Direct",
          subject: "Service interval on your frame 60 actuators",
          body: "Hi Victor,\n\nMost of the frame 60 actuators on your filling lines are past their 5-year service interval, and it has been 14 months since the last spares order.\n\nI can send a list of the units by line with the seal kits and spares we recommend keeping on the shelf. Want me to put that together?\n\nAlex Morgan\nHalvorsen Motion",
        },
        {
          tone: "Consultative",
          subject: "Keeping the filling lines ahead of failures",
          body: "Hi Victor,\n\nWith the Greenville plant coming, I expect your team will be stretched. A few customers in the same position moved to a stocked spares plan so a seal failure never stops a line.\n\nI can share what that looked like for a plant your size, with part numbers matched to what you run today. Worth a call?\n\nAlex Morgan\nHalvorsen Motion",
        },
        {
          tone: "Brief",
          subject: "Spares check",
          body: "Hi Victor,\n\nIt has been a while since your last spares order. Do you want an updated list of recommended spares for the frame 60 units on the filling lines?\n\nAlex Morgan\nHalvorsen Motion",
        },
      ],
      "bg-priyanka": [
        {
          tone: "Direct",
          subject: "Halvorsen Motion and the Greenville plant",
          body: "Hi Priyanka,\n\nI look after Corvale Foods at Halvorsen Motion. We supply the linear actuators and drives on your filling and sealing lines, under a contract price list that runs through next year.\n\nAs you source equipment for Greenville, I can extend that pricing to the new plant and hold stock against your build schedule. Could we set up a short introduction?\n\nAlex Morgan\nHalvorsen Motion",
        },
        {
          tone: "Consultative",
          subject: "One supplier for motion across five plants",
          body: "Hi Priyanka,\n\nWelcome to Corvale. I manage your account at Halvorsen Motion, where three of your plants already buy actuators and drives.\n\nFor Greenville, standardizing on the same platform would mean one price list, one spares pool, and shorter lead times. I have a one-page summary of what you buy today and what it costs. May I send it over?\n\nAlex Morgan\nHalvorsen Motion",
        },
        {
          tone: "Brief",
          subject: "Introduction: Halvorsen Motion",
          body: "Hi Priyanka,\n\nI manage the Corvale Foods account at Halvorsen Motion. I would like to introduce myself ahead of the Greenville sourcing work and share your current contract pricing. Is there a good time this week?\n\nAlex Morgan\nHalvorsen Motion",
        },
      ],
      "bg-owen": [
        {
          tone: "Direct",
          subject: "Motion package for the Greenville lines",
          body: "Hi Owen,\n\nI saw you are leading equipment for the Greenville expansion. Corvale already runs 62 Halvorsen actuators across three plants, so your maintenance team knows the platform.\n\nIf you can share the line layouts, I will turn around a sized motion package with washdown options and lead times within a week.\n\nAlex Morgan\nHalvorsen Motion",
        },
        {
          tone: "Consultative",
          subject: "Lessons from your existing filling lines",
          body: "Hi Owen,\n\nCongratulations on the Greenville project. Before the motion spec is fixed, it may be useful to see how the actuators on the Spartanburg filling lines have held up, and what we would change for a new build.\n\nI can bring an applications engineer to a 30-minute call. Would that be useful at this stage?\n\nAlex Morgan\nHalvorsen Motion",
        },
        {
          tone: "Brief",
          subject: "Greenville equipment",
          body: "Hi Owen,\n\nAre you collecting quotes for motion equipment on the Greenville lines yet? I can size a package from your layouts in about a week.\n\nAlex Morgan\nHalvorsen Motion",
        },
      ],
    },
    followUp: { title: "Follow up with the Corvale Foods buying group", dueInDays: 3 },
  },
};
