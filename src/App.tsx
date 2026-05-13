import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HeartPulse,
  ChevronRight,
  X,
  ArrowRight,
  Phone,
  Stethoscope,
  Home,
  Headset,
  Languages,
  CheckCircle,
  AlertTriangle,
  CalendarCheck,
  Droplets,
  Info,
  Bell,
  BarChart,
  MapPin,
  Award,
  Clock,
  Search,
  PlusCircle,
  Heart,
  UserCheck,
} from 'lucide-react';
import { Language, RiskLevel, Message, Nurse, TriageResult, RegionRiskCluster } from './types';
import { fetchNurses, fetchRiskClusters } from './services/apiService';
import { getFinalTriageSummary } from './services/aiService';

// ─────────────────────────────────────────────
// LOCAL DATA — no API calls during the chat
// ─────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 'weeks',
    text: {
      English: 'How many weeks or months pregnant are you?',
      Twi: 'Mfirihyia sɛn na wowↄ yedɔm mu?',
      Ga: 'Gbɛɛ hɛɛ lɛ ni wↄ kpↄi mu?',
    },
    options: ['Less than 20 weeks', '20–30 weeks', 'More than 30 weeks'],
  },
  {
    id: 'bleeding',
    text: {
      English: 'Have you had any bleeding or spotting today or this week?',
      Twi: 'Woadɔ anaa woadɔ kete da yi anaa nnansa yi?',
      Ga: 'Wↄ bleed abe gbɛɛ yi?',
    },
    options: ['Yes', 'No', 'Not sure'],
  },
  {
    id: 'headache',
    text: {
      English: "Do you have a severe headache that won't go away?",
      Twi: 'Wowↄ tirim yaw a ento da?',
      Ga: 'Wↄ ti yeli shwane?',
    },
    options: ['Yes, severe', 'Mild headache', 'No'],
  },
  {
    id: 'swelling',
    text: {
      English: 'Are your face, hands, or feet more swollen than usual?',
      Twi: 'Wo ho, nsa anaa nan ho yɛ hunu sen daa?',
      Ga: 'Wo kponyo, nii anaabi etↄ kpee?',
    },
    options: ['Yes, very swollen', 'A little swollen', 'No'],
  },
  {
    id: 'movement',
    text: {
      English: 'Have you felt your baby move today?',
      Twi: 'Wuhu wo ba keka da yi?',
      Ga: 'Wↄ hu ni bia yi gbii?',
    },
    options: ['Yes, normally', 'Less than usual', 'Not at all'],
    skipIf: (answers: Record<string, string>) => answers.weeks === 'Less than 20 weeks',
  },
  {
    id: 'urination',
    text: {
      English: 'Do you feel pain or burning when you urinate?',
      Twi: 'Woyaw anaa yɛ ya bere a woye nsuo?',
      Ga: 'Yeli ya abe nsuo ye?',
    },
    options: ['Yes', 'No', 'Sometimes'],
  },
  {
    id: 'fever',
    text: {
      English: 'Do you have a fever or feel very hot?',
      Twi: 'Wowↄ afurum anaa wuda hyɛ?',
      Ga: 'Wↄ fɛɛ kɛ wↄ haa?',
    },
    options: ['Yes, I have a fever', 'I feel warm', 'No'],
  },
  {
    id: 'vomiting',
    text: {
      English: 'Have you vomited more than 3 times today?',
      Twi: 'Wotutu mprɛ 3 senkyerɛ da yi?',
      Ga: 'Wↄ tutu mprɛ 3 abe yi?',
    },
    options: ['Yes', '1–2 times', 'No'],
  },
  {
    id: 'dizzy',
    text: {
      English: 'Do you feel dizzy or like you might faint?',
      Twi: 'Wo tiri bo anaa woda wiram?',
      Ga: 'Wↄ dii kɛ wↄ gbɛɛ?',
    },
    options: ['Yes', 'A little', 'No'],
  },
  {
    id: 'eating',
    text: {
      English: 'Have you been able to eat and drink water today?',
      Twi: 'Woatumi adidi na nomm nsu da yi?',
      Ga: 'Wↄ di loo kɛ nom nsu yi?',
    },
    options: ['Yes, normally', 'Very little', 'Nothing at all'],
  },
];

const GREETINGS: Record<Language, string> = {
  English:
    "Hello! I'm Ama, your MamaMatch health assistant. I'll ask you 10 quick questions about how you're feeling today. Take your time — there are no wrong answers.",
  Twi: 'Akwaaba! Me din de Ama. Mɛbisa wo nsɛm 10 fa wo ho nsɛm ho. Yɛ wo ntɛm — nna mmuae bɔne biara.',
  Ga: 'He shɛɛ! Mi nyɛ Ama. Mibↄↄ ji hɛɛ ko shi 10 ni ye gbɛɛ nɔɔ. Tena yoo — mli mmuae bɔne.',
};

const CLOSING_MESSAGES: Record<Language, string> = {
  English: 'Thank you for sharing that with me. Let me check your results now...',
  Twi: 'Medawase wↄ wo ho nsɛm a wokyerɛɛ me no ho. Mede wo mmuae hwɛ seesei...',
  Ga: 'Migbele afi ni wↄ ka kyɛ mi. Mihe ni bo...',
};

const EMOTIONAL_RESPONSES: Record<string, Partial<Record<string, Record<Language, string>>>> = {
  bleeding: {
    Yes: {
      English: "I hear you. You're doing the right thing by checking in. Let's continue.",
      Twi: 'Medawase. Woyɛ ade pa pa pa. Yɛn kↄ so.',
      Ga: 'Mi tie wo. Wↄ yɛ adepa. Yɛ kↄ.',
    },
  },
  headache: {
    'Yes, severe': {
      English: "Thank you for telling me that. We'll make sure you get the right support.",
      Twi: 'Medawase sɛ wokyerɛɛ me. Yɛbɛhwɛ sɛ wunya mmoa.',
      Ga: 'Migbele afi ni wↄ ka kyɛ mi. Yɛ bɛ bo ni wↄ nya mmoa.',
    },
  },
};

// ─────────────────────────────────────────────
// RISK CALCULATOR (pure local logic)
// ─────────────────────────────────────────────

function calculateRisk(answers: Record<string, string>): RiskLevel {
  if (
    answers.bleeding === 'Yes' ||
    answers.headache === 'Yes, severe' ||
    answers.swelling === 'Yes, very swollen' ||
    (answers.fever === 'Yes, I have a fever' && answers.dizzy === 'Yes')
  )
    return 'HIGH';

  let concerns = 0;
  if (answers.urination === 'Yes') concerns++;
  if (answers.vomiting === 'Yes') concerns++;
  if (answers.dizzy === 'Yes') concerns++;
  if (answers.eating === 'Nothing at all' || answers.eating === 'Very little') concerns++;
  if (answers.movement === 'Not at all') concerns++;
  if (concerns >= 2) return 'MEDIUM';

  return 'LOW';
}

// ─────────────────────────────────────────────
// LOCAL FALLBACK RESULTS (used when Gemini fails)
// ─────────────────────────────────────────────

function getLocalResult(risk: RiskLevel, language: Language): TriageResult {
  const data: Record<RiskLevel, Record<Language, { title: string; description: string; recommendations: string[]; concerns?: string[] }>> = {
    HIGH: {
      English: {
        title: 'Immediate Attention Needed',
        description:
          "Based on your responses, some symptoms need urgent medical attention. Please connect with a nurse or visit your nearest health facility right away.",
        recommendations: ['Contact a nurse immediately', 'Go to the nearest health facility', 'Do not wait — act now'],
        concerns: ['Requires urgent medical attention'],
      },
      Twi: {
        title: 'Hwɛ Ntɛm Ntɛm',
        description: 'Wo nsɛm bi hia saa hwɛ ntɛm. Kↄ hospital anaa kasa nurse bi ho ntɛm.',
        recommendations: ['Kasa nurse ntɛm', 'Kↄ hospital a ɛbɛn wo', 'Nnhwɛ'],
        concerns: ['Hia hwɛ ntɛm ntɛm'],
      },
      Ga: {
        title: 'Hwɛ Ntɛm',
        description: 'Bↄ wↄ ni eba attenshion ntɛm. Kↄ hospital kɛ kasa nurse.',
        recommendations: ['Kasa nurse ntɛm', 'Kↄ hospital', 'Tena yoo'],
        concerns: ['Hia hwɛ ntɛm'],
      },
    },
    MEDIUM: {
      English: {
        title: 'Some Things Need Attention',
        description:
          "Some responses suggest you should speak with a nurse soon. You're not in immediate danger, but please don't delay.",
        recommendations: ['Speak with a nurse within 24 hours', 'Monitor your symptoms closely', 'Stay hydrated and rested'],
      },
      Twi: {
        title: 'Biribi Hia Wo Adwene',
        description: 'Wo mmuae bi kyerɛ sɛ ɛsɛ sɛ kasa nurse bi ho ntɛm.',
        recommendations: ['Kasa nurse nnansa mu', 'Hwɛ wo yareɛ so', 'Nom nsu na home'],
      },
      Ga: {
        title: 'Bↄ Hia Attenshion',
        description: 'Mmuae bi kyerɛ kɛ ɛsɛ kasa nurse.',
        recommendations: ['Kasa nurse nnansa mu', 'Hwɛ wo yareɛ so', 'Nom nsu'],
      },
    },
    LOW: {
      English: {
        title: "You're Doing Well!",
        description: "Your responses suggest you're in good health. Keep up the great work and continue your antenatal visits.",
        recommendations: ['Continue attending antenatal visits', 'Drink 8 glasses of water daily', 'Rest well and eat nutritious food'],
      },
      Twi: {
        title: 'Woyɛ Adepa!',
        description: 'Wo nsɛm kyerɛ sɛ wo ho ye. Kↄ wo hospital nhyiamu na nom nsu.',
        recommendations: ['Kↄ hospital nhyiamu', 'Nom nsu daa', 'Home yiye na didi adeɛ pa'],
      },
      Ga: {
        title: 'Wↄ Yɛ Fine!',
        description: 'Mmuae kyerɛ kɛ wↄ ho ye. Kↄ hospital nhyiamu.',
        recommendations: ['Kↄ hospital nhyiamu', 'Nom nsu daa', 'Home yiye'],
      },
    },
  };

  const d = data[risk][language] ?? data[risk].English;
  return { riskLevel: risk, ...d };
}

// ─────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────

const Layout = ({ children, activeTab, onTabChange, showNav = true, title = 'MamaMatch GH', onBack }: any) => (
  <div className="flex flex-col min-h-screen bg-surface">
    <header className="sticky top-0 z-50 w-full bg-surface-container-lowest shadow-sm border-b border-outline-variant/30">
      <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-1 hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronRight className="rotate-180 w-6 h-6 text-primary" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1 rounded-lg">
              <HeartPulse className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-heading text-xl font-bold text-primary tracking-tight">{title}</h1>
          </div>
        </div>
        <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
          <Bell className="w-5 h-5 text-on-surface-variant" />
        </button>
      </div>
    </header>

    <main className="flex-grow flex flex-col max-w-2xl mx-auto w-full mb-24">{children}</main>

    {showNav && (
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest border-t border-outline-variant/30 rounded-t-2xl shadow-lg">
        <div className="flex justify-around items-center px-4 py-2 max-w-2xl mx-auto">
          <button
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'home' ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase mt-1">Home</span>
          </button>
          <button
            onClick={() => onTabChange('health')}
            className={`flex flex-col items-center bg-secondary-container px-6 py-2 rounded-full transition-all ${activeTab === 'health' ? 'text-primary' : 'text-on-secondary-container'}`}
          >
            <Stethoscope className="w-6 h-6" fill="currentColor" />
            <span className="text-[10px] font-bold uppercase mt-1">Health Info</span>
          </button>
          <button
            onClick={() => onTabChange('support')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'support' ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <Headset className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase mt-1">Support</span>
          </button>
        </div>
      </nav>
    )}
  </div>
);

// ─────────────────────────────────────────────
// SPLASH
// ─────────────────────────────────────────────

const SplashScreen = ({ onStart }: { onStart: () => void }) => (
  <div className="flex-grow flex flex-col items-center justify-between bg-primary-container p-6 text-center text-on-primary">
    <div className="flex flex-col items-center mt-12 space-y-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface-container-lowest p-6 rounded-full shadow-xl"
      >
        <HeartPulse className="w-12 h-12 text-primary" />
      </motion.div>
      <h1 className="font-heading text-4xl font-bold text-surface-container-lowest tracking-tight">MamaMatch GH</h1>
      <p className="text-secondary-fixed text-lg opacity-80">Safe pregnancies. Closer care.</p>
    </div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl rotate-2"
    >
      <img
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1mbXb4KE1rH0o-tkFGsEANNmML97AnMN4D49O9ydRhcvumzeTjt9-mv966-dB906AC12xa_CW_FoG8FUDO1sSKzCPVliqMuMEfuuBzmZvcFY3Rx6Vj2JEwUuvB1kj_ZKHbd9icouaEawKqme_FDVZyH_GbtLBef17Gz8036sByChHE_xYEyFCwCs67L0SUQL2Cr_QwbtPJOcPMXHyj8oRFFN_oSNe0hb6bOGH5_IaSYqLqYRNQMk_My5ZSLO_Kas2mtRC6mR_ifqB"
        alt="Maternal Care"
      />
    </motion.div>

    <div className="w-full space-y-6 pb-12">
      <button
        onClick={onStart}
        className="w-full h-14 bg-surface-container-lowest text-primary font-bold rounded-2xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
      >
        <span>Start My Check-in</span>
        <ArrowRight className="w-5 h-5" />
      </button>
      <div className="flex justify-center items-center gap-2 opacity-60">
        <UserCheck className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Trusted GH Health Care</span>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// LANGUAGE SELECTION
// ─────────────────────────────────────────────

const LanguageSelection = ({ onSelect }: { onSelect: (l: Language) => void }) => (
  <div className="p-6 flex flex-col flex-grow">
    <div className="text-center mb-12 mt-8">
      <div className="inline-flex p-5 bg-secondary-container rounded-full mb-6">
        <Languages className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-heading text-3xl font-bold text-primary mb-2">Choose your language</h2>
      <p className="text-on-surface-variant">Select the language you are most comfortable using.</p>
    </div>

    <div className="space-y-4">
      {(['English', 'Twi', 'Ga'] as Language[]).map((lang) => (
        <button
          key={lang}
          onClick={() => onSelect(lang)}
          className="w-full flex items-center justify-between p-5 bg-surface-container-lowest border-2 border-outline-variant/30 rounded-2xl shadow-sm hover:border-primary transition-all active:scale-95"
        >
          <span className="text-xl font-bold">{lang}</span>
          <ChevronRight className="w-5 h-5 text-outline" />
        </button>
      ))}
    </div>

    <div className="mt-auto pt-10">
      <div className="p-4 bg-secondary-container/50 rounded-2xl flex items-start gap-4">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-on-secondary-container">
          You can change your language settings at any time from your profile menu.
        </p>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// CHAT TRIAGE — fixed, no per-answer API calls
// ─────────────────────────────────────────────

const ChatTriage = ({
  language,
  onComplete,
}: {
  language: Language;
  onComplete: (res: TriageResult) => void;
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helpers
  const addNurseMsg = (text: string) =>
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        role: 'nurse',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

  const addUserMsg = (text: string) =>
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        role: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Greet on mount then ask first question
  useEffect(() => {
    addNurseMsg(GREETINGS[language]);
    setTimeout(() => poseQuestion(0, {}), 1400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poseQuestion = (index: number, currentAnswers: Record<string, string>) => {
    // Skip questions that don't apply
    while (index < QUESTIONS.length && QUESTIONS[index].skipIf?.(currentAnswers)) {
      index++;
    }
    if (index >= QUESTIONS.length) {
      finishTriage(currentAnswers);
      return;
    }
    const q = QUESTIONS[index];
    const text = (q.text as Record<string, string>)[language] ?? q.text.English;
    setTimeout(() => addNurseMsg(text), 300);
  };

  const handleAnswer = (option: string) => {
    if (loading || finished) return;

    const q = QUESTIONS[questionIndex];
    addUserMsg(option);

    const newAnswers = { ...answers, [q.id]: option };
    setAnswers(newAnswers);

    // Emotional follow-up if needed
    const emotional = EMOTIONAL_RESPONSES[q.id]?.[option]?.[language];
    if (emotional) setTimeout(() => addNurseMsg(emotional), 500);

    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);

    const delay = emotional ? 1600 : 750;
    setTimeout(() => poseQuestion(nextIndex, newAnswers), delay);
  };

  const finishTriage = async (finalAnswers: Record<string, string>) => {
    setFinished(true);
    addNurseMsg(CLOSING_MESSAGES[language]);
    setLoading(true);

    const risk = calculateRisk(finalAnswers);

    try {
      // ONE Gemini call — only here, at the very end
      const result = await getFinalTriageSummary(
        Object.entries(finalAnswers).map(([k, v]) => ({ role: 'user' as const, content: `${k}: ${v}` })),
        language,
        risk,
      );
      setTimeout(() => onComplete(result), 1500);
    } catch (err) {
      // Gemini failed (503 / rate limit) — use local fallback silently
      console.warn('Gemini unavailable, using local fallback:', err);
      const fallback = getLocalResult(risk, language);
      setTimeout(() => onComplete(fallback), 1500);
    } finally {
      setLoading(false);
    }
  };

  const effectiveIndex = questionIndex < QUESTIONS.length ? questionIndex : QUESTIONS.length - 1;
  const currentQ = QUESTIONS[effectiveIndex];
  const showButtons =
    !loading &&
    !finished &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === 'nurse' &&
    questionIndex < QUESTIONS.length;

  const progress = Math.min(Math.round((questionIndex / QUESTIONS.length) * 100), 100);

  return (
    <div className="flex flex-col flex-grow bg-surface">
      {/* Progress */}
      <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/30">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-primary uppercase">
            Question {Math.min(questionIndex + 1, 10)} of 10
          </span>
          <X className="w-5 h-5 text-primary" />
        </div>
        <div className="w-full bg-surface-container-highest h-1.5 rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Ama header */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-outline-variant/20 bg-surface-container-lowest">
        <div className="relative">
          <img
            className="w-10 h-10 rounded-full border-2 border-primary-container"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkjFwwYqM0gBA13ICDqystES-6EnfvRIqVvqzmrxpQXMKVaSPsChZMUp3Y71xcb5G9PZb-0ixFKvh4g_OnYYVzdlC3P1jBND5zK9Nrc8NSOQfJIUm5AMTB0l1Z3irWZTlObbZYB8TaLKWzAFoH6E3abCXHN3Bk2utQ9KeBjmrqGa_w7N-Xeazp-SLREhny5EfjXMMjA6bRdm7otP1D6ipZIiDySb3L5pnrhR3Z-YSxMB8YZrbGnEZRf1OSYz1FuDuytDa5PSZHyGEx"
            alt="Ama"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-primary">Ama</h3>
          <p className="text-[10px] text-outline uppercase font-bold tracking-wider">Online · AI-Assisted</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow p-4 space-y-4 overflow-y-auto pb-44">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${m.role === 'nurse' ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                  m.role === 'nurse'
                    ? 'bg-surface-container-highest border-l-4 border-primary text-on-surface'
                    : 'bg-primary text-on-primary'
                }`}
              >
                <p className="text-base">{m.text}</p>
              </div>
              <span className="text-[10px] text-outline mt-1 px-1">{m.timestamp}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-outline">
            <div className="flex gap-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
            <span>Ama is reviewing your answers...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Answer buttons */}
      {showButtons && currentQ && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest p-4 rounded-t-3xl shadow-[0px_-8px_24px_rgba(123,0,153,0.1)] z-40">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            <button
              onClick={() => handleAnswer(currentQ.options[0])}
              className="w-full bg-primary text-on-primary py-4 rounded-2xl flex items-center justify-between px-6 active:scale-95 transition-all shadow-md font-bold"
            >
              <span>{currentQ.options[0]}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className={`grid gap-3 ${currentQ.options.length >= 3 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {currentQ.options.slice(1).map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className="bg-secondary-container text-on-secondary-container py-4 rounded-2xl font-bold border border-outline-variant/30 hover:bg-outline-variant/20 active:scale-95 transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// RESULT SCREEN
// ─────────────────────────────────────────────

const ResultScreen = ({ result, onNext }: { result: TriageResult; onNext: () => void }) => {
  const getRiskStyles = () => {
    switch (result.riskLevel) {
      case 'HIGH':
        return 'border-risk-high bg-red-50 text-risk-high';
      case 'MEDIUM':
        return 'border-risk-medium bg-amber-50 text-risk-medium';
      case 'LOW':
        return 'border-risk-low bg-green-50 text-risk-low';
    }
  };

  return (
    <div className="p-4 space-y-6 flex-grow bg-surface">
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`bg-surface-container-lowest p-6 rounded-3xl shadow-md border-l-[8px] ${getRiskStyles()}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div
            className={`p-3 rounded-2xl ${
              result.riskLevel === 'HIGH'
                ? 'bg-red-100'
                : result.riskLevel === 'MEDIUM'
                ? 'bg-amber-100'
                : 'bg-green-100'
            }`}
          >
            <AlertTriangle className="w-8 h-8" fill="currentColor" />
          </div>
          <span
            className={`px-4 py-1 rounded-full text-xs font-bold text-white ${
              result.riskLevel === 'HIGH'
                ? 'bg-risk-high'
                : result.riskLevel === 'MEDIUM'
                ? 'bg-risk-medium'
                : 'bg-risk-low'
            }`}
          >
            {result.riskLevel} RISK
          </span>
        </div>
        <h2 className="font-heading text-2xl font-bold text-on-surface mb-2">{result.title}</h2>
        <p className="text-on-surface-variant leading-relaxed">{result.description}</p>
      </motion.section>

      {result.concerns && result.concerns.length > 0 && (
        <section className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30">
          <div className="flex items-start gap-4 mb-4">
            <Info className="w-5 h-5 text-risk-high" />
            <h3 className="font-bold text-on-surface">Identified Concerns</h3>
          </div>
          <ul className="space-y-3">
            {result.concerns.map((c, i) => (
              <li key={i} className="flex items-center gap-3 text-on-surface-variant text-sm">
                <div className="w-1.5 h-1.5 bg-risk-high rounded-full" />
                {c}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-outline px-1">Recommendations</h3>
        <div className="space-y-3">
          {result.recommendations.map((rec, i) => (
            <div key={i} className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="bg-secondary-container p-2 rounded-full text-primary">
                {i === 0 ? <CalendarCheck className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
              </div>
              <span className="text-sm font-medium">{rec}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-4 pt-4">
        <button
          onClick={onNext}
          className="w-full h-14 bg-primary text-on-primary font-bold rounded-full shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Phone className="w-5 h-5" />
          <span>Talk to a Nurse Soon</span>
        </button>
        <button className="w-full h-14 border-2 border-outline/30 text-on-surface font-bold rounded-full flex items-center justify-center active:scale-95 transition-all">
          View Local Clinics
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// NURSE MATCH
// ─────────────────────────────────────────────

const MessageCircleIcon = (props: any) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
  </svg>
);

const NurseMatchPage = ({ onBack }: { onBack: () => void }) => {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNurses().then((data) => {
      setNurses(data);
      setLoading(false);
    });
  }, []);

  if (loading)
    return <div className="p-8 text-center animate-pulse text-on-surface-variant">Matching with top midwives...</div>;

  const nurse = nurses[0];

  return (
    <div className="p-6 flex flex-col items-center flex-grow bg-surface">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-surface-container-lowest rounded-3xl overflow-hidden shadow-xl border border-outline-variant/30"
      >
        <div className="bg-primary h-28 relative flex justify-center">
          <div className="absolute -bottom-12 border-8 border-surface-container-lowest rounded-full overflow-hidden w-28 h-28 bg-surface-container-highest shadow-inner">
            <img src={nurse.avatar} alt={nurse.name} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="pt-16 pb-8 px-8 text-center flex flex-col items-center gap-6">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold flex items-center justify-center gap-2">
              {nurse.name}
              <CheckCircle className="w-5 h-5 text-green-500 fill-current bg-white rounded-full" />
            </h1>
            <div className="flex items-center justify-center gap-1 text-on-surface-variant text-sm font-medium">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{nurse.region}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {nurse.languages.map((l) => (
              <span key={l} className="bg-secondary-container text-primary font-bold px-4 py-1.5 rounded-full text-xs">
                {l}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 px-4 py-1.5 bg-green-50 rounded-full border border-green-100">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Available Now</span>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col items-center gap-2">
              <Award className="w-6 h-6 text-primary" />
              <span className="text-xs font-bold text-on-surface">{nurse.role}</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              <span className="text-xs font-bold text-on-surface">{nurse.experience}</span>
            </div>
          </div>

          <button className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
            <MessageCircleIcon className="w-6 h-6 fill-current" />
            <span className="text-lg">WhatsApp Support</span>
          </button>
        </div>
      </motion.div>

      <button
        onClick={onBack}
        className="mt-8 flex items-center gap-2 text-outline hover:text-primary transition-colors font-bold uppercase text-xs tracking-widest"
      >
        <Search className="w-4 h-4" />
        Find a different nurse
      </button>

      <div className="pb-12 mt-12 w-full max-w-sm">
        <p className="text-[10px] text-center font-bold text-outline-variant uppercase tracking-[0.2em] mb-4">
          Certified Maternal Care Guidance
        </p>
        <div className="flex justify-center gap-4">
          <PlusCircle className="w-6 h-6 text-primary/30" />
          <Heart className="w-6 h-6 text-primary/30" />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// RISK DASHBOARD
// ─────────────────────────────────────────────

const RiskDashboard = () => {
  const [clusters, setClusters] = useState<RegionRiskCluster[]>([]);
  useEffect(() => {
    fetchRiskClusters().then(setClusters);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl font-bold text-primary">Maternal Risk Dashboard</h2>
        <p className="text-on-surface-variant text-sm">Mapping high-risk clusters in Ghana</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {clusters.map((c) => (
          <div
            key={c.region}
            className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{c.region}</h3>
              <div className="flex gap-2">
                <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-lg">
                  {c.highRiskCount} High
                </span>
                <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">
                  {c.medRiskCount} Med
                </span>
              </div>
            </div>
            <div className="w-full flex h-3 rounded-full overflow-hidden">
              <div
                className="bg-risk-high"
                style={{
                  width: `${(c.highRiskCount / (c.highRiskCount + c.medRiskCount + c.lowRiskCount)) * 100}%`,
                }}
              />
              <div
                className="bg-risk-medium"
                style={{
                  width: `${(c.medRiskCount / (c.highRiskCount + c.medRiskCount + c.lowRiskCount)) * 100}%`,
                }}
              />
              <div className="bg-risk-low flex-grow" />
            </div>
            <p className="text-[10px] text-outline font-bold mt-2 text-right">
              TOTAL: {c.highRiskCount + c.medRiskCount + c.lowRiskCount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────

type View = 'splash' | 'language' | 'chat' | 'result' | 'nurse-match' | 'dashboard' | 'info';

export default function App() {
  const [view, setView] = useState<View>('splash');
  const [language, setLanguage] = useState<Language>('English');
  const [activeTab, setActiveTab] = useState('home');
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'health') setView('info');
    else if (tab === 'home') setView('splash');
    else if (tab === 'support') setView('nurse-match');
  };

  const renderView = () => {
    switch (view) {
      case 'splash':
        return <SplashScreen onStart={() => setView('language')} />;
      case 'language':
        return (
          <LanguageSelection
            onSelect={(lang) => {
              setLanguage(lang);
              setView('chat');
            }}
          />
        );
      case 'chat':
        return (
          <ChatTriage
            language={language}
            onComplete={(res) => {
              setTriageResult(res);
              setView('result');
            }}
          />
        );
      case 'result':
        return <ResultScreen result={triageResult!} onNext={() => setView('nurse-match')} />;
      case 'nurse-match':
        return <NurseMatchPage onBack={() => setView('result')} />;
      case 'dashboard':
        return <RiskDashboard />;
      case 'info':
        return (
          <div className="p-6 text-center space-y-4">
            <h2 className="font-heading text-2xl font-bold">Health Information</h2>
            <p className="text-on-surface-variant">
              Access educational resources on prenatal care, nutrition, and essential preparation for childbirth.
            </p>
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 mx-auto text-primary font-bold"
            >
              <BarChart className="w-5 h-5" />
              Risk Dashboard (Admin)
            </button>
          </div>
        );
      default:
        return <SplashScreen onStart={() => setView('language')} />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      showNav={view !== 'splash' && view !== 'language'}
      title={
        view === 'nurse-match' ? 'Midwife Match' : view === 'chat' ? 'Check-in with Ama' : 'MamaMatch GH'
      }
      onBack={
        view === 'chat' || view === 'result' ? () => setView('language') : undefined
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-grow flex flex-col"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
