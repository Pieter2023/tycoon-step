/**
 * Global quiz metadata + behavior configuration.
 * Keeps the question array export intact so existing implementations can continue to work.
 */
export const SALES_ACCELERATOR_QUIZ_META = {
  id: 'sales_accelerator_cert_v1',
  version: 1,

  // Where it lives in the product/game
  category: 'side_hustles',
  track: 'Sales Accelerator',

  title: 'Sales Accelerator Certification',
  titleKey: 'salesQuiz.meta.title',
  description:
    'A short, scenario-based certification focused on ethical, effective B2B selling and negotiation fundamentals.',
  descriptionKey: 'salesQuiz.meta.description',

  // UI behavior (matches the "no intrusive popups" update)
  ui: {
    launchMode: 'onDemand',
    entryPointLabel: 'Start Certification',
    entryPointLabelKey: 'salesQuiz.meta.entryPointLabel',

    // Placeholders for images to be added later
    coverImage: {
      src: '/images/sales-accelerator/cover.webp',
      alt: 'Sales Accelerator Certification cover image',
    },

    // Optional "result screen" images
    resultImages: {
      pass: {
        src: '/images/sales-accelerator/pass.webp',
        alt: 'Certification passed',
      },
      fail: {
        src: '/images/sales-accelerator/fail.webp',
        alt: 'Certification failed',
      },
    },

    // Optional short intro tips panel
    quickTips: [
      'Answer honestly - this is about long-term trust, not tricks.',
      'Focus on outcomes, proof, and alignment.',
      'Use ethical persuasion: clarity beats pressure.',
    ],
    quickTipsKeys: [
      'salesQuiz.meta.tip1',
      'salesQuiz.meta.tip2',
      'salesQuiz.meta.tip3',
    ],
  },

  // Rules (fits the "clear scoring + retry policy" update)
  rules: {
    questionCount: 15,
    shuffleQuestions: false,
    shuffleOptions: false,
    showExplanationAfterAnswer: true,
    allowReviewAtEnd: true,

    passCondition: 'allCorrect',
    passPercentage: 100,

    attemptsAllowed: 3,
    onFail: {
      cashPenalty: 25000,
      stressDelta: 0,
      careerDemotion: false,
    },
  },

  // Rewards placeholders (wire to your stat system)
  rewards: {
    onPass: {
      cash: 25000,
      fiq: 10,
      happiness: 5,
      perkId: 'perk_sales_accelerator_certified',
      perkLabel: 'Sales Accelerator Certified',
    },
    onFail: {
      cash: 0,
      fiq: 0,
      happiness: 0,
    },
  },

  // Accessibility + content support
  accessibility: {
    supportsReduceMotion: true,
    supportsKeyboardOnly: true,
    supportsScreenReaders: true,
    captionsOrTranscriptRequired: true,
  },

  // Optional: video support (kept on-demand, not auto)
  tutorialVideo: {
    src: '__VIDEO_PLACEHOLDER__/sales-accelerator/intro.mp4',
    captionsVtt: '__CAPTIONS_PLACEHOLDER__/sales-accelerator/intro.vtt',
    transcriptText: '__TRANSCRIPT_PLACEHOLDER__/sales-accelerator/intro.txt',
  },

  // Optional analytics hooks (no-op until you wire them)
  analytics: {
    quizStartedEvent: 'quiz_started',
    quizCompletedEvent: 'quiz_completed',
    quizQuestionAnsweredEvent: 'quiz_question_answered',
  },
} as const;

/**
 * Question array (compatible with your current structure),
 * enhanced with media placeholders, tags, i18n keys, glossary hooks, and option feedback.
 */
export const SALES_ACCELERATOR_QUIZ = [
  {
    id: 'sales_q1',
    i18n: {
      promptKey: 'quiz.sales_q1.prompt',
      explanationKey: 'quiz.sales_q1.explanation',
      optionKeys: {
        a: 'quiz.sales_q1.option_a',
        b: 'quiz.sales_q1.option_b',
        c: 'quiz.sales_q1.option_c',
        d: 'quiz.sales_q1.option_d',
      },
    },
    prompt:
      'A prospect asks for functionality your product does not currently support. What is the best ethical response?',
    media: {
      image: {
        src: '/images/sales-accelerator/q1.webp',
        alt: 'A prospect asking about a missing feature during a sales call',
      },
    },
    tags: ['ethics', 'trust', 'discovery'],
    difficulty: 'easy',
    glossaryTerms: ['outcome_focus', 'trust', 'scope'],
    options: [
      {
        id: 'a',
        text:
          'Be clear about the limitation, confirm the outcome they need, and offer the best current path.',
        feedbackKey: 'quiz.sales_q1.feedback_a',
        correct: true,
        feedback:
          'Correct: accuracy builds trust, and outcome alignment keeps momentum without misrepresentation.',
      },
      {
        id: 'b',
        text: "Suggest it's nearly ready so the deal doesn't slow down.",
        feedbackKey: 'quiz.sales_q1.feedback_b',
        feedback:
          'Risky: misleading capability claims create churn, escalations, and reputational damage.',
      },
      {
        id: 'c',
        text: "Deflect to pricing and hope they don't circle back.",
        feedbackKey: 'quiz.sales_q1.feedback_c',
        feedback:
          'Avoidance lowers credibility - capability fit must be clarified before pricing makes sense.',
      },
      {
        id: 'd',
        text: 'Promise a custom build even though delivery is uncertain.',
        feedbackKey: 'quiz.sales_q1.feedback_d',
        feedback:
          'Unethical if uncertain: only commit to delivery timelines and scope you can confidently meet.',
      },
    ],
    explanation:
      'Trust comes from accuracy and alignment. Clear limits plus outcome focus builds long-term credibility.',
  },
  {
    id: 'sales_q2',
    i18n: {
      promptKey: 'quiz.sales_q2.prompt',
      explanationKey: 'quiz.sales_q2.explanation',
      optionKeys: {
        a: 'quiz.sales_q2.option_a',
        b: 'quiz.sales_q2.option_b',
        c: 'quiz.sales_q2.option_c',
        d: 'quiz.sales_q2.option_d',
      },
    },
    prompt:
      'Why does the early phase of a sales conversation matter so much, even in B2B?',
    media: {
      image: {
        src: '/images/sales-accelerator/q2.webp',
        alt: 'Early discovery conversation shaping decision direction',
      },
    },
    tags: ['psychology', 'positioning'],
    difficulty: 'easy',
    glossaryTerms: ['decision_framing', 'loss_aversion'],
    options: [
      { id: 'a', text: 'Because buyers never review data unless it is tattooed.' },
      { id: 'b', text: 'Because the first vendor always wins by law (apparently).' },
      {
        id: 'c',
        text: 'Because early emotional preference often guides which facts feel convincing later.',
        feedbackKey: 'quiz.sales_q2.feedback_c',
        correct: true,
        feedback:
          'Correct: early framing influences what evidence feels relevant and persuasive afterward.',
      },
      { id: 'd', text: 'Because it guarantees a short sales cycle for everyone, always.' },
    ],
    explanation:
      'Early intuition shapes direction; later analysis usually justifies a direction already forming.',
  },
  {
    id: 'sales_q3',
    i18n: {
      promptKey: 'quiz.sales_q3.prompt',
      explanationKey: 'quiz.sales_q3.explanation',
      optionKeys: {
        a: 'quiz.sales_q3.option_a',
        b: 'quiz.sales_q3.option_b',
        c: 'quiz.sales_q3.option_c',
        d: 'quiz.sales_q3.option_d',
      },
    },
    prompt:
      'Which action best builds genuine goodwill before asking for anything in return?',
    media: {
      image: {
        src: '/images/sales-accelerator/q3.webp',
        alt: 'Sharing tailored insights before requesting a meeting',
      },
    },
    tags: ['trust', 'value_first'],
    difficulty: 'easy',
    glossaryTerms: ['reciprocity', 'value'],
    options: [
      { id: 'a', text: 'Send multiple follow-ups so they remember your calendar exists.' },
      {
        id: 'b',
        text: 'Share a tailored insight or small fix they can use immediately.',
        feedbackKey: 'quiz.sales_q3.feedback_b',
        correct: true,
        feedback:
          'Correct: useful value up front builds credibility and reciprocity without pressure.',
      },
      { id: 'c', text: 'Push for a quick meeting while interest is still warm.' },
      { id: 'd', text: 'Offer a discount first and hope value sorts itself out.' },
    ],
    explanation:
      'Useful value up front creates trust and makes the relationship feel cooperative.',
  },
  {
    id: 'sales_q4',
    i18n: {
      promptKey: 'quiz.sales_q4.prompt',
      explanationKey: 'quiz.sales_q4.explanation',
      optionKeys: {
        a: 'quiz.sales_q4.option_a',
        b: 'quiz.sales_q4.option_b',
        c: 'quiz.sales_q4.option_c',
        d: 'quiz.sales_q4.option_d',
      },
    },
    prompt:
      'What is the most ethical way to build credibility in a high-stakes sale?',
    media: {
      image: {
        src: '/images/sales-accelerator/q4.webp',
        alt: 'Using proof points and benchmarks in a proposal',
      },
    },
    tags: ['credibility', 'proof'],
    difficulty: 'easy',
    glossaryTerms: ['proof_points', 'benchmarks'],
    options: [
      { id: 'a', text: 'Talk fast and confident so you sound experienced.' },
      { id: 'b', text: "Keep it vague so nobody can fact-check you." },
      { id: 'c', text: 'Name-drop competitors and hope it counts as proof.' },
      {
        id: 'd',
        text: 'Use verified outcomes, benchmarks, and proof points from relevant use cases.',
        feedbackKey: 'quiz.sales_q4.feedback_d',
        correct: true,
        feedback: 'Correct: credibility must be verifiable - evidence beats performance or hype.',
      },
    ],
    explanation:
      'Credibility should come from verifiable evidence, not performance or hype.',
  },
  {
    id: 'sales_q5',
    i18n: {
      promptKey: 'quiz.sales_q5.prompt',
      explanationKey: 'quiz.sales_q5.explanation',
      optionKeys: {
        a: 'quiz.sales_q5.option_a',
        b: 'quiz.sales_q5.option_b',
        c: 'quiz.sales_q5.option_c',
        d: 'quiz.sales_q5.option_d',
      },
    },
    prompt: 'Which type of social proof tends to be strongest for a cautious buyer?',
    media: {
      image: {
        src: '/images/sales-accelerator/q5.webp',
        alt: 'A case study summary with measurable results',
      },
    },
    tags: ['social_proof', 'risk_reduction'],
    difficulty: 'easy',
    glossaryTerms: ['social_proof', 'case_study'],
    options: [
      {
        id: 'a',
        text: 'A case study from a similar company with measurable results.',
        feedbackKey: 'quiz.sales_q5.feedback_a',
        correct: true,
        feedback:
          'Correct: similarity plus measurable outcomes reduce perceived risk and speed consensus.',
      },
      { id: 'b', text: 'A very large total number of users (no context).' },
      { id: 'c', text: 'A long list of vague testimonials and high-fives.' },
      { id: 'd', text: 'A slogan like "industry-leading" with no receipts.' },
    ],
    explanation:
      'Similarity reduces risk. Buyers trust outcomes from situations that look like theirs.',
  },
  {
    id: 'sales_q6',
    i18n: {
      promptKey: 'quiz.sales_q6.prompt',
      explanationKey: 'quiz.sales_q6.explanation',
      optionKeys: {
        a: 'quiz.sales_q6.option_a',
        b: 'quiz.sales_q6.option_b',
        c: 'quiz.sales_q6.option_c',
        d: 'quiz.sales_q6.option_d',
      },
    },
    prompt:
      'Why do small early commitments (like sharing requirements or agreeing to a short follow-up) matter?',
    media: {
      image: {
        src: '/images/sales-accelerator/q6.webp',
        alt: 'A buyer agreeing to a small next step',
      },
    },
    tags: ['commitment', 'process'],
    difficulty: 'easy',
    glossaryTerms: ['commitment_consistency'],
    options: [
      { id: 'a', text: 'They legally force the buyer into a contract.' },
      {
        id: 'b',
        text: 'People naturally try to stay aligned with earlier actions and statements.',
        feedbackKey: 'quiz.sales_q6.feedback_b',
        correct: true,
        feedback:
          'Correct: small commitments build momentum ethically when value and fit are real.',
      },
      { id: 'c', text: 'They replace discovery, so you can skip the boring part.' },
      { id: 'd', text: 'They guarantee an immediate close every time.' },
    ],
    explanation:
      'Consistency is a real human tendency, but it must be earned ethically, not exploited.',
  },
  {
    id: 'sales_q7',
    i18n: {
      promptKey: 'quiz.sales_q7.prompt',
      explanationKey: 'quiz.sales_q7.explanation',
      optionKeys: {
        a: 'quiz.sales_q7.option_a',
        b: 'quiz.sales_q7.option_b',
        c: 'quiz.sales_q7.option_c',
        d: 'quiz.sales_q7.option_d',
      },
    },
    prompt: 'Which example of scarcity is ethical and professional?',
    media: {
      image: {
        src: '/images/sales-accelerator/q7.webp',
        alt: 'A transparent onboarding capacity calendar',
      },
    },
    tags: ['ethics', 'scarcity'],
    difficulty: 'easy',
    glossaryTerms: ['scarcity'],
    options: [
      { id: 'a', text: 'A fake countdown timer that mysteriously resets.' },
      { id: 'b', text: 'Claiming limited availability with no real constraint.' },
      { id: 'c', text: 'Pressuring them with "buy now or regret it."'},
      {
        id: 'd',
        text: 'Explain a real onboarding limit and offer the next available start date.',
        feedbackKey: 'quiz.sales_q7.feedback_d',
        correct: true,
        feedback:
          'Correct: scarcity must be real, transparent, and tied to operational constraints.',
      },
    ],
    explanation:
      'Scarcity must be real and transparent, otherwise it damages trust.',
  },
  {
    id: 'sales_q8',
    i18n: {
      promptKey: 'quiz.sales_q8.prompt',
      explanationKey: 'quiz.sales_q8.explanation',
      optionKeys: {
        a: 'quiz.sales_q8.option_a',
        b: 'quiz.sales_q8.option_b',
        c: 'quiz.sales_q8.option_c',
        d: 'quiz.sales_q8.option_d',
      },
    },
    prompt:
      'Which statement typically motivates action most effectively in B2B decision-making?',
    media: {
      image: {
        src: '/images/sales-accelerator/q8.webp',
        alt: 'A chart showing cost of inaction increasing over time',
      },
    },
    tags: ['loss_aversion', 'urgency'],
    difficulty: 'easy',
    glossaryTerms: ['cost_of_inaction', 'loss_aversion'],
    options: [
      { id: 'a', text: 'This adds some great new features.' },
      { id: 'b', text: 'This is the cheapest option on the spreadsheet.' },
      {
        id: 'c',
        text: 'This prevents ongoing losses caused by the current problem.',
        feedbackKey: 'quiz.sales_q8.feedback_c',
        correct: true,
        feedback:
          'Correct: avoiding losses is often a stronger driver than optional upside.',
      },
      { id: 'd', text: 'This is popular on social media right now.' },
    ],
    explanation:
      'Decision-makers often move faster to avoid losses than to chase optional gains.',
  },
  {
    id: 'sales_q9',
    i18n: {
      promptKey: 'quiz.sales_q9.prompt',
      explanationKey: 'quiz.sales_q9.explanation',
      optionKeys: {
        a: 'quiz.sales_q9.option_a',
        b: 'quiz.sales_q9.option_b',
        c: 'quiz.sales_q9.option_c',
        d: 'quiz.sales_q9.option_d',
      },
    },
    prompt: 'Which behavior best demonstrates real active listening?',
    media: {
      image: {
        src: '/images/sales-accelerator/q9.webp',
        alt: 'Seller summarizing the buyer needs',
      },
    },
    tags: ['listening', 'communication'],
    difficulty: 'easy',
    glossaryTerms: ['active_listening'],
    options: [
      {
        id: 'a',
        text: 'Summarize their point in your own words and ask if you understood correctly.',
        feedbackKey: 'quiz.sales_q9.feedback_a',
        correct: true,
        feedback:
          'Correct: reflection plus confirmation prevents misalignment and builds trust.',
      },
      { id: 'b', text: 'Wait silently until they stop talking and then pivot.' },
      { id: 'c', text: 'Jump in quickly with a solution before they finish.' },
      { id: 'd', text: 'Agree with everything they say so it feels smooth.' },
    ],
    explanation: 'Summarizing plus confirming builds trust and prevents misunderstanding.',
  },
  {
    id: 'sales_q10',
    i18n: {
      promptKey: 'quiz.sales_q10.prompt',
      explanationKey: 'quiz.sales_q10.explanation',
      optionKeys: {
        a: 'quiz.sales_q10.option_a',
        b: 'quiz.sales_q10.option_b',
        c: 'quiz.sales_q10.option_c',
        d: 'quiz.sales_q10.option_d',
      },
    },
    prompt:
      'Which discovery question most reliably reveals urgency and consequences?',
    media: {
      image: {
        src: '/images/sales-accelerator/q10.webp',
        alt: 'Discovery question about consequences of inaction',
      },
    },
    tags: ['discovery', 'urgency'],
    difficulty: 'easy',
    glossaryTerms: ['cost_of_inaction'],
    options: [
      { id: 'a', text: 'Do you like your current provider?' },
      { id: 'b', text: 'Would you like a demo soon?' },
      {
        id: 'c',
        text: 'What happens over the next 6-12 months if nothing changes?',
        feedbackKey: 'quiz.sales_q10.feedback_c',
        correct: true,
        feedback:
          'Correct: this exposes consequences, timelines, stakeholders, and true priority.',
      },
      { id: 'd', text: 'Is pricing your biggest concern right now?' },
    ],
    explanation:
      'The cost of inaction is what makes problems real and priorities clear.',
  },
  {
    id: 'sales_q11',
    i18n: {
      promptKey: 'quiz.sales_q11.prompt',
      explanationKey: 'quiz.sales_q11.explanation',
      optionKeys: {
        a: 'quiz.sales_q11.option_a',
        b: 'quiz.sales_q11.option_b',
        c: 'quiz.sales_q11.option_c',
        d: 'quiz.sales_q11.option_d',
      },
    },
    prompt:
      'A buyer says: "This feels expensive." What is the most accurate interpretation in many cases?',
    media: {
      image: {
        src: '/images/sales-accelerator/q11.webp',
        alt: 'Buyer raising a price concern',
      },
    },
    tags: ['objections', 'value'],
    difficulty: 'medium',
    glossaryTerms: ['value_clarity', 'roi'],
    options: [
      { id: 'a', text: 'They are insulting you personally.' },
      {
        id: 'b',
        text: 'They are not fully convinced the outcome is worth the investment yet.',
        feedbackKey: 'quiz.sales_q11.feedback_b',
        correct: true,
        feedback:
          'Correct: price objections often indicate unclear ROI, not personal hostility.',
      },
      { id: 'c', text: 'They will never buy anything, ever.' },
      { id: 'd', text: 'They are always lying to everyone.' },
    ],
    explanation:
      'Price objections often signal a value-clarity problem, not a pure budget problem.',
  },
  {
    id: 'sales_q12',
    i18n: {
      promptKey: 'quiz.sales_q12.prompt',
      explanationKey: 'quiz.sales_q12.explanation',
      optionKeys: {
        a: 'quiz.sales_q12.option_a',
        b: 'quiz.sales_q12.option_b',
        c: 'quiz.sales_q12.option_c',
        d: 'quiz.sales_q12.option_d',
      },
    },
    prompt:
      'What is the best first response to a price objection if you want to stay ethical and effective?',
    media: {
      image: {
        src: '/images/sales-accelerator/q12.webp',
        alt: 'Seller reconnecting price to outcomes',
      },
    },
    tags: ['objections', 'roi'],
    difficulty: 'medium',
    glossaryTerms: ['roi', 'cost_of_inaction'],
    options: [
      { id: 'a', text: 'Offer a discount immediately to keep momentum.' },
      { id: 'b', text: 'Argue that competitors are worse and louder.' },
      { id: 'c', text: 'End the call and follow up when it is awkward.' },
      {
        id: 'd',
        text: 'Reconnect price to outcomes and quantify the cost of the status quo.',
        feedbackKey: 'quiz.sales_q12.feedback_d',
        correct: true,
        feedback:
          'Correct: the buyer must be able to justify the spend internally using impact.',
      },
    ],
    explanation:
      "If you cannot tie price to impact, the buyer cannot defend the spend internally.",
  },
  {
    id: 'sales_q13',
    i18n: {
      promptKey: 'quiz.sales_q13.prompt',
      explanationKey: 'quiz.sales_q13.explanation',
      optionKeys: {
        a: 'quiz.sales_q13.option_a',
        b: 'quiz.sales_q13.option_b',
        c: 'quiz.sales_q13.option_c',
        d: 'quiz.sales_q13.option_d',
      },
    },
    prompt:
      'When is it appropriate to ask for a decision (close) without being pushy?',
    media: {
      image: {
        src: '/images/sales-accelerator/q13.webp',
        alt: 'Natural close after alignment',
      },
    },
    tags: ['closing', 'integrity'],
    difficulty: 'medium',
    glossaryTerms: ['alignment', 'mutual_plan'],
    options: [
      {
        id: 'a',
        text: 'After you align on fit, outcomes, and they agree the value is real.',
        feedbackKey: 'quiz.sales_q13.feedback_a',
        correct: true,
        feedback:
          'Correct: closing should be the next logical step after shared agreement on value.',
      },
      { id: 'b', text: 'As early as possible before objections appear.' },
      { id: 'c', text: 'Immediately after the first feature demo.' },
      { id: 'd', text: 'Only if they ask you to, in writing.' },
    ],
    explanation:
      'A confident close is a natural next step once alignment is established.',
  },
  {
    id: 'sales_q14',
    i18n: {
      promptKey: 'quiz.sales_q14.prompt',
      explanationKey: 'quiz.sales_q14.explanation',
      optionKeys: {
        a: 'quiz.sales_q14.option_a',
        b: 'quiz.sales_q14.option_b',
        c: 'quiz.sales_q14.option_c',
        d: 'quiz.sales_q14.option_d',
      },
    },
    prompt: 'Which is a fair conditional close that maintains integrity?',
    media: {
      image: {
        src: '/images/sales-accelerator/q14.webp',
        alt: 'Conditional close with a clear concession',
      },
    },
    tags: ['closing', 'negotiation'],
    difficulty: 'medium',
    glossaryTerms: ['conditional_close'],
    options: [
      { id: 'a', text: 'If you do not sign today, you lose the deal.' },
      { id: 'b', text: 'Everyone else is buying, so you should too.' },
      {
        id: 'c',
        text: 'If we include X, are you comfortable moving forward this week?',
        feedbackKey: 'quiz.sales_q14.feedback_c',
        correct: true,
        feedback:
          'Correct: it ties a concession to a clear next step, not intimidation.',
      },
      { id: 'd', text: 'I cannot help you unless you commit now.' },
    ],
    explanation:
      'It is ethical because the concession is tied to a clear next step, not pressure.',
  },
  {
    id: 'sales_q15',
    i18n: {
      promptKey: 'quiz.sales_q15.prompt',
      explanationKey: 'quiz.sales_q15.explanation',
      optionKeys: {
        a: 'quiz.sales_q15.option_a',
        b: 'quiz.sales_q15.option_b',
        c: 'quiz.sales_q15.option_c',
        d: 'quiz.sales_q15.option_d',
      },
    },
    prompt:
      'What most consistently drives renewals, referrals, and long-term growth?',
    media: {
      image: {
        src: '/images/sales-accelerator/q15.webp',
        alt: 'Strong onboarding handoff and early check-ins after closing',
      },
    },
    tags: ['post_sale', 'retention', 'trust'],
    difficulty: 'easy',
    glossaryTerms: ['handoff', 'renewals'],
    options: [
      { id: 'a', text: 'Aggressive follow-ups after signing.' },
      {
        id: 'b',
        text: 'Deliver what you promised and stay engaged through handoff and early check-ins.',
        feedbackKey: 'quiz.sales_q15.feedback_b',
        correct: true,
        feedback:
          'Correct: outcomes and follow-through create durable trust and expansion opportunities.',
      },
      { id: 'c', text: 'Pushing upgrades immediately after signatures dry.' },
      { id: 'd', text: 'Keeping contract terms vague for flexibility.' },
    ],
    explanation:
      'Long-term trust is built after the signature through outcomes and follow-through.',
  },
] as const;
