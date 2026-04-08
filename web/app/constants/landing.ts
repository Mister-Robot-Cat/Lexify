export const HERO_CONTENT = {
  headline: "Master English with AI: Faster, Smarter, Contextual.",
  subheadline: "Your personal AI language tutor inside Telegram. Get deep, contextual explanations for any word, practice IELTS writing, and build vocabulary that actually sticks.",
  cta: "Try on Telegram",
  ctaLink: "https://t.me/LexifyBot",
  stats: [
    { value: 50000, suffix: "+", label: "Words Explained" },
    { value: 12000, suffix: "+", label: "Essays Evaluated" },
    { value: 10000, suffix: "+", label: "Active Learners" }
  ]
};

export const HOW_IT_WORKS_STEPS = [
  {
    icon: "MessageSquare",
    title: "Send a Word or Essay",
    description: "Type any English word or paste your IELTS essay directly in Telegram. No apps to download, no accounts to create."
  },
  {
    icon: "Brain",
    title: "Groq AI Analysis",
    description: "Our AI powered by Groq's lightning-fast LLMs analyzes your input, understands context, and generates personalized explanations."
  },
  {
    icon: "Sparkles",
    title: "Get Contextual Results",
    description: "Receive detailed breakdowns with definitions, examples, synonyms, and tailored feedback based on your English level."
  }
];

export const WHY_TELEGRAM_CARDS = [
  {
    icon: "Smartphone",
    title: "No App Download Required",
    description: "Start learning instantly. Everything happens in Telegram — no installation, no updates, no storage used."
  },
  {
    icon: "Clock",
    title: "24/7 Access on All Devices",
    description: "Your progress syncs across phone, tablet, and desktop. Learn anywhere, anytime, on any platform."
  },
  {
    icon: "Zap",
    title: "High-Speed AI (Groq Powered)",
    description: "Experience sub-second responses. Groq's LPU technology delivers AI answers faster than traditional GPUs."
  },
  {
    icon: "Github",
    title: "Free & Open Source",
    description: "100% free to use. Open source on GitHub — inspect the code, contribute, or self-host if you prefer."
  }
];

export const BEFORE_AFTER_CONTENT = {
  before: {
    title: "Traditional Dictionary",
    word: "serendipity",
    content: `**serendipity** /ˌser.ənˈdɪp.ə.ti/

*The fact of finding interesting or valuable things by chance.*

Example: "The discovery of penicillin was a serendipity."`,
    label: "Boring & Forgettable"
  },
  after: {
    title: "Lexify AI Explanation",
    word: "serendipity",
    content: `**serendipity** — *noun* [C or U]

🎯 **Meaning**: A happy accident — finding something good without looking for it.

💡 **Memory Hook**: Think of a "serene dip" into luck. You're calm, not searching, and suddenly treasure appears.

📝 **Real-World Examples**:
• "Finding my favorite coffee shop while lost was pure serendipity."
• "Silicon Valley thrives on serendipity — many startups began as side projects."

🔗 **Connected Words**: luck, coincidence, fortune, happenstance
📊 **IELTS Frequency**: Common in Speaking Part 2 (describing experiences)`,
    label: "Deep & Memorable"
  }
};

export const USE_CASES_TABS = [
  {
    id: "exam-prep",
    label: "Exam Prep (IELTS/TOEFL)",
    icon: "GraduationCap",
    title: "Ace Your English Exams",
    description: "Get detailed IELTS Writing Task 1 & 2 evaluations with band score predictions. Practice vocabulary at C1-C2 level. Track your progress with personalized analytics.",
    features: ["Writing evaluation with band scores", "Academic vocabulary building", "Grammar error analysis", "Exam-specific tips"]
  },
  {
    id: "career",
    label: "Career Growth",
    icon: "Briefcase",
    title: "Professional English Mastery",
    description: "Elevate your business communication. Master corporate vocabulary, email writing, and presentation skills. Perfect for non-native professionals in English-speaking workplaces.",
    features: ["Business vocabulary", "Email templates & tips", "Presentation phrases", "Industry-specific terms"]
  },
  {
    id: "daily",
    label: "Daily Learning",
    icon: "BookOpen",
    title: "Build Habits That Stick",
    description: "Learn 5-10 new words daily with spaced repetition. Get Word of the Day notifications. Review words at optimal intervals for maximum retention.",
    features: ["Spaced repetition reviews", "Word of the Day", "Personal word library", "Progress tracking"]
  }
];

export const STATS_CONTENT = {
  title: "Trusted by Learners Worldwide",
  subtitle: "Real numbers from our active community",
  stats: [
    { value: 50000, suffix: "+", label: "Words Explained" },
    { value: 12000, suffix: "+", label: "Essays Evaluated" },
    { value: 10000, suffix: "+", label: "Active Learners" },
    { value: 98, suffix: "%", label: "Satisfaction Rate" }
  ]
};

export const TECH_STACK = {
  title: "Built with Modern Tech",
  subtitle: "Powered by industry-leading technologies",
  technologies: [
    { name: "Groq", description: "LPU Inference Engine", color: "#f97316" },
    { name: "FastAPI", description: "High-performance Backend", color: "#059669" },
    { name: "Telegram API", description: "Bot Platform", color: "#0088cc" },
    { name: "PostgreSQL", description: "Reliable Database", color: "#3b82f6" },
    { name: "Next.js", description: "React Framework", color: "#ffffff" }
  ]
};

export const ROADMAP_ITEMS = [
  {
    phase: "Now",
    quarter: "Q1 2024",
    features: ["AI Word Explanations", "IELTS Writing Coach", "Smart Quizzes", "Spaced Repetition"],
    status: "completed"
  },
  {
    phase: "Next",
    quarter: "Q2 2024",
    features: ["Text-to-Speech (TTS)", "Progress Analytics Dashboard", "Vocabulary Collections"],
    status: "in-progress"
  },
  {
    phase: "Soon",
    quarter: "Q3 2024",
    features: ["WebApp Interface", "Global Leaderboards", "Achievement System"],
    status: "planned"
  },
  {
    phase: "Future",
    quarter: "Q4 2024",
    features: ["Mobile App", "Premium Features", "API Access", "Team/Enterprise Plans"],
    status: "planned"
  }
];

export const PRICING_CONTENT = {
  title: "Simple, Transparent Pricing",
  card: {
    name: "Community",
    price: "Free",
    priceNote: "Forever",
    description: "Full access to all features. No credit card required. Open source and community-driven.",
    features: [
      "Unlimited word explanations",
      "IELTS Writing evaluations",
      "Smart quizzes & reviews",
      "Personal vocabulary library",
      "Spaced repetition system",
      "Community support"
    ],
    cta: "Get Started Free",
    ctaLink: "https://t.me/LexifyBot"
  }
};

export const FAQ_ITEMS = [
  {
    question: "Is Lexify really free?",
    answer: "Yes, Lexify is 100% free to use. We're open source and community-supported. There are no hidden fees, no premium tiers, and no credit card required."
  },
  {
    question: "How accurate is the AI?",
    answer: "We use Groq's LPU inference engine with state-of-the-art LLMs. Our AI provides contextual, nuanced explanations. For IELTS writing, evaluations align closely with official band descriptors."
  },
  {
    question: "Do I need to install anything?",
    answer: "No installation needed. Lexify runs entirely within Telegram. Just search for @LexifyBot and start learning instantly on any device."
  },
  {
    question: "Is my data private?",
    answer: "We only store your vocabulary words and quiz progress to enable spaced repetition. We don't sell data or show ads. Your learning history belongs to you."
  },
  {
    question: "Can I use it for exams other than IELTS?",
    answer: "Absolutely! While we optimize for IELTS, the vocabulary and grammar features work great for TOEFL, Cambridge exams, GRE, or general English improvement."
  },
  {
    question: "How do I contribute to the project?",
    answer: "Visit our GitHub repository to contribute code, report issues, or suggest features. We welcome pull requests and community feedback!"
  }
];

export const OPEN_SOURCE_CONTENT = {
  title: "Open Source & Community Driven",
  subtitle: "Transparent, auditable, and built by the community",
  github: {
    stars: 150,
    forks: 25,
    repoUrl: "https://github.com/Mister-Robot-Cat/Lexify",
    docsUrl: "https://github.com/Mister-Robot-Cat/Lexify#readme"
  }
};

export const FOOTER_CONTENT = {
  brand: "Lexify",
  tagline: "Master English with AI",
  social: {
    telegram: "https://t.me/LexifyBot",
    github: "https://github.com/Mister-Robot-Cat/Lexify",
    twitter: "https://twitter.com/lexify"
  },
  links: {
    product: [
      { label: "Features", href: "#features" },
      { label: "Roadmap", href: "#roadmap" },
      { label: "Pricing", href: "#pricing" }
    ],
    resources: [
      { label: "Documentation", href: "https://github.com/Mister-Robot-Cat/Lexify#readme" },
      { label: "GitHub", href: "https://github.com/Mister-Robot-Cat/Lexify" },
      { label: "API", href: "#" }
    ],
    legal: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" }
    ]
  },
  copyright: "© 2024 Lexify. Open source under MIT License."
};
