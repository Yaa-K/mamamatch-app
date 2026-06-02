<<<<<<< HEAD
<<<<<<< HEAD
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  ChevronRight, 
  Globe, 
  MessageCircle, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Phone, 
  MapPin, 
  Clock, 
  User,
  ShieldCheck,
  X,
  Sparkles,
  Activity,
  FileText,
  Search,
  Check,
  Building,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  UserPlus,
  HeartHandshake,
  Milestone,
  Lock,
  KeyRound
} from 'lucide-react';
import { translations } from './translations';
import { AppState, Language, ChatMessage, RiskLevel } from './types';
=======
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
=======
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
>>>>>>> parent of b615fe7 (Update print statement to say 'Goodbye World')
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
>>>>>>> parent of b615fe7 (Update print statement to say 'Goodbye World')

export default function App() {
  const [state, setState] = useState<AppState>({
    screen: 'start',
    language: 'english',
    currentQuestionIndex: -1, // -1 means intro
    answers: {},
    riskLevel: null,
    detailedAnalysis: null,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [customInputText, setCustomInputText] = useState("");
  const [showClinics, setShowClinics] = useState(false);
  const [clinicSearch, setClinicSearch] = useState("");
  const [clinicRegion, setClinicRegion] = useState("All");

<<<<<<< HEAD
  // Full-Stack Database Integration states
  const [activePortal, setActivePortal] = useState<'mother' | 'nurse' | 'ghs'>('mother');
  const [nursesList, setNursesList] = useState<any[]>([]);
  const [allCheckIns, setAllCheckIns] = useState<any[]>([]);
  
  // Professional Access Authentication States (Separates patient from midwife & GHS)
  const [isNurseUnlocked, setIsNurseUnlocked] = useState(false);
  const [isGhsUnlocked, setIsGhsUnlocked] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  
  // Patient details collection before midwife match
  const [showPatientMatchModal, setShowPatientMatchModal] = useState(false);
  const [patientForm, setPatientForm] = useState({ name: "", phone: "", region: "Ashanti" });
  const [activeMatchedNurse, setActiveMatchedNurse] = useState<any | null>(null);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

  // Midwife Portal States
  const [selectedNurseId, setSelectedNurseId] = useState<string>("");
  const [showNurseRegisterForm, setShowNurseRegisterForm] = useState(false);
  const [newNurseForm, setNewNurseForm] = useState({
    name: "",
    licenseNumber: "",
    region: "Ashanti",
    whatsapp: "",
    languages: [] as string[]
  });

  // GHS Dashboard Filters
  const [ghsFilterRegion, setGhsFilterRegion] = useState("All");
  const [ghsFilterRisk, setGhsFilterRisk] = useState("All");
  const [ghsSearchNurse, setGhsSearchNurse] = useState("");

  // Voice Interaction States
  const [voicePlaybackActive, setVoicePlaybackActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Speak text function with appropriate localized accent matching Ghana
  const speakText = (text: string, lang: Language) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Remove any asterisks, hashes or brackets
      const cleaned = text
        .replace(/[*_#]/g, '')
        .replace(/\[.*?\]/g, '')
        .trim();
      
      const utterance = new SpeechSynthesisUtterance(cleaned);
      
      // Determine voice & accent
      utterance.lang = 'en-GH'; // Prefers Ghana standard english pronunciations
      
      const voices = window.speechSynthesis.getVoices();
      
      // Focus on English or Ghanaian voices
      const targetVoices = voices.filter(v => v.lang.includes('GH') || v.lang.includes('gh') || v.lang.startsWith('en'));
      
      // Known feminine voice patterns in browser TTS engines
      const femalePatterns = [
        /samantha/i,
        /zira/i,
        /hazel/i,
        /susan/i,
        /victoria/i,
        /moira/i,
        /tessa/i,
        /karen/i,
        /fiona/i,
        /veena/i,
        /female/i,
        /google us english/i
      ];
      
      let selectedVoice = null;
      
      // 1. Try to find a feminine voice matching the targeted languages
      for (const pattern of femalePatterns) {
        const found = targetVoices.find(v => pattern.test(v.name));
        if (found) {
          selectedVoice = found;
          break;
        }
      }
      
      // 2. Fallback to any Ghanaian localized voice
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.includes('GH') || v.lang.includes('gh'));
      }
      
      // 3. Fallback to any general English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en'));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = 0.92; // warm maternal pacing
      utterance.pitch = 1.15; // friendly, feminine-tuned pitch scale
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis failed:", err);
    }
  };

  // Manage Speech-To-Text Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-GH'; // Localized acoustic model matching Ghana speech styles
      
      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setCustomInputText(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };
      
      rec.onerror = (event: any) => {
        console.warn("Speech error caught:", event.error);
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = rec;
    }
  }, [state.language]);

  // Read response on changes if voice playback active
  useEffect(() => {
    if (messages.length > 0 && voicePlaybackActive) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'ama') {
        speakText(lastMsg.text, state.language);
      }
    }
  }, [messages, voicePlaybackActive]);

  // Handle page transitions properly
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [state.screen]);

  // Fetch real-time DB data from Express database store
  const fetchLiveDatabase = async () => {
    try {
      const respN = await fetch("/api/nurses");
      if (respN.ok) {
        const dataN = await respN.json();
        setNursesList(dataN);
        if (dataN.length > 0 && !selectedNurseId) {
          const verified = dataN.find((n: any) => n.status === "VERIFIED") || dataN[0];
          setSelectedNurseId(verified.id);
        }
      }
      
      const respC = await fetch("/api/check-ins");
      if (respC.ok) {
        const dataC = await respC.json();
        setAllCheckIns(dataC);
      }
    } catch (err) {
      console.warn("Express database fetch missed connection:", err);
    }
  };

  useEffect(() => {
    fetchLiveDatabase();
  }, [state.screen, activePortal]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Acoustic voice modeling is not native to this browser. For hands-free vocal triage, we recommend Google Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const t = translations[state.language];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleStart = () => {
    setState(prev => ({ ...prev, screen: 'language-select' }));
  };

  const handleLanguageSelect = (lang: Language) => {
    setState(prev => ({ ...prev, language: lang, screen: 'chat' }));
    // Wait a bit then show intro
    setTimeout(() => {
      addAmaMessage(translations[lang].amaIntro);
    }, 500);
  };

  const addAmaMessage = (text: string) => {
    if (!text || !text.trim()) return;
    setMessages(prev => [
      ...prev,
      { id: Math.random().toString(), sender: 'ama', text, timestamp: new Date() }
    ]);
  };

  const addUserMessage = (text: string) => {
    if (!text || !text.trim()) return;
    setMessages(prev => [
      ...prev,
      { id: Math.random().toString(), sender: 'user', text, timestamp: new Date() }
    ]);
  };

  const fetchAmaResponse = async (
    nextIndex: number,
    currentAnswers: Record<number, any>,
    userJustAnsweredIndex: number,
    userJustAnsweredValue: any,
    userTypedText?: string
  ): Promise<{ text: string; interpretedValue: any }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Allow slightly longer for dual classified answers

      const response = await fetch('/api/ama-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          language: state.language,
          nextIndex,
          answers: currentAnswers,
          userJustAnsweredIndex,
          userJustAnsweredValue,
          userTypedText,
          messages: messages.map(m => ({ sender: m.sender, text: m.text })),
          predefinedQuestion: translations[state.language].questions[nextIndex],
          emotionalQ2Response: translations[state.language].emotionalQ2,
          emotionalQ3Response: translations[state.language].emotionalQ3
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('API failed');
      }

      const data = await response.json();
      if (data && typeof data.text === 'string') {
        return {
          text: data.text,
          interpretedValue: data.interpretedValue !== undefined ? data.interpretedValue : null
        };
      }
      throw new Error('Invalid response data');
    } catch (err) {
      console.warn("Falling back to predefined question due to error:", err);
      let fallbackText = '';
      let fallbackValue = userJustAnsweredValue;

      // Simple regex fallback classification
      if (userTypedText) {
        const textLower = userTypedText.toLowerCase();
        if (userJustAnsweredIndex === 0) {
          const numMatch = textLower.match(/\d+/);
          fallbackValue = numMatch ? parseInt(numMatch[0]) : 12;
        } else {
          const yesWords = ["yes", "yeah", "yup", "aane", "hɛɛ", "he", "true", "it hurts", "i have", "spotting", "bleeding"];
          const noWords = ["no", "nope", "dabi", "false", "haven't", "none", "not really", "all clear"];
          if (yesWords.some(w => textLower.includes(w))) fallbackValue = true;
          else if (noWords.some(w => textLower.includes(w))) fallbackValue = false;
          else fallbackValue = null;
        }
      }

      if (userJustAnsweredIndex === 1 && fallbackValue === true) {
        fallbackText += translations[state.language].emotionalQ2 + " ";
      }
      if (userJustAnsweredIndex === 2 && fallbackValue === true) {
        fallbackText += translations[state.language].emotionalQ3 + " ";
      }
      if (nextIndex < 10) {
        fallbackText += translations[state.language].questions[nextIndex];
      } else {
        fallbackText += translations[state.language].calculating;
      }
      return { text: fallbackText, interpretedValue: fallbackValue };
    }
  };

  const handleAnswer = async (value: any, label: string) => {
    addUserMessage(label);
    
    const currentQIdx = state.currentQuestionIndex;
    const nextIndex = currentQIdx + 1;

    // Record answer
    const newAnswers = { ...state.answers, [currentQIdx]: value };
    
    if (nextIndex < 10) {
      // Logic for Q5 (index 4): skip if < 20 weeks (or 5 months?)
      let skipQ5 = false;
      if (nextIndex === 4) {
        const stage = parseInt(newAnswers[0]);
        if (!isNaN(stage) && stage < 20 && stage > 0) {
             if (stage < 10 && stage < 5) skipQ5 = true; 
             else if (stage >= 10 && stage < 20) skipQ5 = true;
        }
      }

      const finalNextIndex = (skipQ5 && nextIndex === 4) ? 5 : nextIndex;

      setState(prev => ({
        ...prev,
        answers: newAnswers,
        currentQuestionIndex: finalNextIndex
      }));

      setIsTyping(true);
      const result = await fetchAmaResponse(finalNextIndex, newAnswers, currentQIdx, value);
      setIsTyping(false);
      addAmaMessage(result.text);
    } else {
      // Finished all questions
      setState(prev => ({ ...prev, answers: newAnswers, currentQuestionIndex: 10 }));
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addAmaMessage(t.calculating);
        setTimeout(() => {
          calculateRisk(newAnswers);
        }, 2000);
      }, 1000);
    }
  };

  const handleCustomAnswer = async (typedText: string) => {
    if (!typedText || !typedText.trim()) return;
    
    addUserMessage(typedText);
    
    const currentQIdx = state.currentQuestionIndex;
    const nextIndex = currentQIdx + 1;

    setIsTyping(true);

    // Call API with custom typed responses to both determine next response and classify user answer
    const result = await fetchAmaResponse(
      nextIndex < 10 ? nextIndex : 10,
      state.answers,
      currentQIdx,
      undefined,
      typedText
    );

    setIsTyping(false);

    const interpretedVal = result.interpretedValue !== null ? result.interpretedValue : false;
    const newAnswers = { ...state.answers, [currentQIdx]: interpretedVal };

    if (nextIndex < 10) {
      // Logic for Q5 (index 4): skip if < 20 weeks (or 5 months?)
      let skipQ5 = false;
      if (nextIndex === 4) {
        const stage = parseInt(newAnswers[0]);
        if (!isNaN(stage) && stage < 20 && stage > 0) {
             if (stage < 10 && stage < 5) skipQ5 = true; 
             else if (stage >= 10 && stage < 20) skipQ5 = true;
        }
      }

      const finalNextIndex = (skipQ5 && nextIndex === 4) ? 5 : nextIndex;

      setState(prev => ({
        ...prev,
        answers: newAnswers,
        currentQuestionIndex: finalNextIndex
      }));

      addAmaMessage(result.text);
    } else {
      // Finished all questions
      setState(prev => ({ ...prev, answers: newAnswers, currentQuestionIndex: 10 }));
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addAmaMessage(t.calculating);
        setTimeout(() => {
          calculateRisk(newAnswers);
        }, 2000);
      }, 1000);
    }
  };

  const handleSubmitCustom = () => {
    if (!customInputText.trim()) return;
    const textToSend = customInputText;
    setCustomInputText("");
    handleCustomAnswer(textToSend);
  };

  const calculateRisk = async (answers: Record<number, any>) => {
    // HIGH: Q2=Yes(1) OR Q3=Yes(2) OR Q4=Yes(3) OR (Q7=Yes(6) AND Q9=Yes(8))
    const isHigh = 
      answers[1] === true || 
      answers[2] === true || 
      answers[3] === true || 
      (answers[6] === true && answers[8] === true);

    // MEDIUM: Any 2 or more of Q6(5), Q8(7), Q9(8), Q10=No(9)
    const mediumSymptoms = [
      answers[5] === true,
      answers[7] === true,
      answers[8] === true,
      answers[9] === false // Q10: "Have you been able to eat/drink?" -> No is concern
    ].filter(Boolean).length;

    let risk: RiskLevel = 'LOW';
    if (isHigh) risk = 'HIGH';
    else if (mediumSymptoms >= 2) risk = 'MEDIUM';

    setState(prev => ({ ...prev, riskLevel: risk, screen: 'loading' }));
    
    try {
      const response = await fetch('/api/generate-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ sender: m.sender, text: m.text })),
          language: state.language,
          answers,
          riskLevel: risk
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const reportData = await response.json();
      setState(prev => ({ ...prev, detailedAnalysis: reportData, screen: 'result' }));
    } catch (err) {
      console.warn("Detailed report generation failed, using structured fallback:", err);
      const isTwi = state.language === 'twi';
      const isGa = state.language === 'ga';
      const fallbackReport = {
        summary: isTwi ? "Yɛayɛ wo check-in ho kyerɛwtohɔ ama wo." : isGa ? "Wɔgbe check-in lɛ naa ha bo." : "We have completed your detailed health check-in report.",
        riskExplanation: isTwi ? "Sɛ yɛhwɛ wo mmuaeɛ no a, yɛbɛma wo afutuo pa a ɛbɛma wo ne wo mma a ɔwɔ wo mu nyinaa asisene yiye." : isGa ? "Kɛ wɔkwɛ osaji amli lɛ, wɔbaaha bo gbɛtsɔɔmɔ kpakpa kɛha bo kɛ obifio lɛ fɛɛ hewalɛnamɔ." : "Based on your check-in, we advise monitoring your symptoms closely and staying connected with your local midwife.",
        pregnancyTips: [
          isTwi ? "Nom nsuo pii, na di nnuane a ɛmã nipadua no ahoɔden te sɛ kontomire." : isGa ? "Num nu pii, ni oye nii ni baaha ohewalɛ agbo tamɔ kontomire." : "Ensure you stay hydrated by drinking water and eat iron-rich foods like Kontomire.",
          isTwi ? "Gye wo home yiye seesei na mmrɛ wo ho dodo." : isGa ? "Joo ohe jɔmɔ waa amrɔ nɛɛ ni kaatsu nitsumɔ ni wa." : "Prioritize getting plenty of rest and avoid lifting heavy loads.",
          isTwi ? "Kɔ ayaresabea mma w'asɛm nhia na kɔ antenatal care daa." : isGa ? "Yaa antenatal daa nɛ okɛ dɔkta mra." : "Keep up with your scheduled antenatal clinic visits."
        ],
        nextSteps: [
          isTwi ? "Sɛ wowɔ anyinsɛn mu bɔ biara a kɔ ayaresabea seesei." : isGa ? "Yaa helatsū amrɔ nɛɛ kɛji ona pila ko." : "If you have any severe symptoms, visit the nearest facility immediately.",
          isTwi ? "Bisa wo nurse mmoa te sɛ Abena Mensah." : isGa ? "Bibi shi kɛha tsɔɔmɔ kɛjoo onurse ya nkpa mli." : "Talk to your midwife/nurse to schedule a detailed check."
        ]
      };
      setState(prev => ({ ...prev, detailedAnalysis: fallbackReport, screen: 'result' }));
    }
  };

  const renderClinicsDrawer = () => {
    const clinics = [
      {
        name: "Ridge Hospital (Greater Accra Regional Hospital)",
        region: "Greater Accra",
        location: "Kanda, Accra",
        details: "Specialized High-Risk Maternity Block & General Antenatal Services",
        phone: "+233 30 222 8121",
        badge: "Regional Primary"
      },
      {
        name: "Komfo Anokye Teaching Hospital (KATH)",
        region: "Ashanti",
        location: "Bantama, Kumasi",
        details: "Leading Tertiary Care, Neonatal ICU & Certified Specialist Midwifery",
        phone: "+233 32 202 2381",
        badge: "Tertiary Teaching"
      },
      {
        name: "Tamale Teaching Hospital",
        region: "Northern",
        location: "Hospital Road, Tamale",
        details: "Certified Regional Maternity Center & Community outreach teams",
        phone: "+233 37 202 2013",
        badge: "Regional Teaching"
      },
      {
        name: "Effia Nkwanta Regional Hospital",
        region: "Western",
        location: "Sekondi-Takoradi",
        details: "Regional Referrals and Complete Pre-and-Post Natal Checkups",
        phone: "+233 31 202 2485",
        badge: "Regional Government"
      },
      {
        name: "LEKMA Hospital",
        region: "Greater Accra",
        location: "Teshie, Accra",
        details: "Maternal Center of Excellence & Outpatient Obstetric Consultations",
        phone: "+233 30 271 2746",
        badge: "Municipal Care"
      }
    ];

    const filtered = clinics.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(clinicSearch.toLowerCase()) || 
                          c.details.toLowerCase().includes(clinicSearch.toLowerCase()) ||
                          c.location.toLowerCase().includes(clinicSearch.toLowerCase());
      const matchRegion = clinicRegion === "All" || c.region === clinicRegion;
      return matchSearch && matchRegion;
    });

    return (
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-4 animate-fade-in">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="bg-white w-full max-w-2xl rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh]"
=======
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
<<<<<<< HEAD
>>>>>>> parent of b615fe7 (Update print statement to say 'Goodbye World')
=======
>>>>>>> parent of b615fe7 (Update print statement to say 'Goodbye World')
        >
          {/* Cover accent pattern */}
          <div className="bg-gradient-to-r from-primary via-secondary to-tertiary h-2 w-full" />
          
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[#5C4300] tracking-tight text-left">GHS Registered Antenatal Clinics</h2>
              <p className="text-xs text-gray-500 font-bold mt-0.5 text-left">Fully certified public & regional maternal wings in Ghana</p>
            </div>
            <button 
              onClick={() => {
                setShowClinics(false);
                setClinicSearch("");
                setClinicRegion("All");
              }} 
              className="p-2 hover:bg-gray-200 text-gray-400 hover:text-gray-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-4 bg-white border-b border-gray-100 space-y-3">
            <div className="relative flex items-center bg-gray-100 border border-gray-200/65 focus-within:border-primary rounded-xl px-3 py-1 transition-all">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input 
                type="text"
                placeholder="Search clinics by hospital name, town or details..."
                value={clinicSearch}
                onChange={(e) => setClinicSearch(e.target.value)}
                className="w-full bg-transparent border-none text-gray-800 text-sm md:text-base font-bold py-2.5 px-2 outline-none focus:outline-none"
              />
              {clinicSearch && (
                <button onClick={() => setClinicSearch("")} className="text-xs text-gray-400 hover:text-gray-600 font-bold px-1">Clear</button>
              )}
            </div>

            {/* Regional Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {["All", "Greater Accra", "Ashanti", "Northern", "Western"].map((reg) => (
                <button
                  key={reg}
                  onClick={() => setClinicRegion(reg)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-black tracking-tight transition-all border ${
                    clinicRegion === reg 
                      ? "bg-primary text-white border-primary shadow-sm" 
                      : "bg-[#F5F3F7] hover:bg-gray-200 text-gray-600 border-gray-200"
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          {/* List content */}
          <div className="overflow-y-auto p-4 md:p-6 space-y-4 flex-grow bg-gray-50/40">
            {filtered.length > 0 ? (
              filtered.map((clinic, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1.5 max-w-md text-left">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-black bg-primary/10 text-primary border border-primary/10 mb-1">
                      {clinic.badge}
                    </span>
                    <h3 className="font-extrabold text-[#340042] text-sm md:text-base leading-snug">{clinic.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{clinic.location} ({clinic.region} Region)</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 font-medium leading-relaxed bg-[#FAF9FB] p-2.5 rounded-xl border-l-2 border-primary/35 mt-1">
                      {clinic.details}
                    </p>
                  </div>

                  <a 
                    href={`tel:${clinic.phone.replace(/\s+/g, '')}`}
                    className="w-full md:w-auto shrink-0 bg-[#046d40] hover:bg-[#035532] text-white px-4 py-3 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    Call Ward
                  </a>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <Building className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-bold">No clinics matched your query</p>
                <button onClick={() => { setClinicSearch(""); setClinicRegion("All"); }} className="text-xs font-black text-primary underline mt-1">Reset Filters</button>
              </div>
            )}
          </div>

          {/* Sticky footer info */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-[10px] font-black text-gray-400 tracking-wider">
            🚨 ALWAYS Call Emergency 112 IF IN IMMEDIATE DANGER
          </div>
        </motion.div>
      </div>
    );
  };

  const renderStart = () => (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Main Grid Section */}
      <main className="max-w-7xl mx-auto px-6 py-8 md:py-16 w-full flex-grow flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center w-full">
          
          {/* Left Column Text / CTA */}
          <div className="md:col-span-7 flex flex-col space-y-6 md:space-y-8 items-start text-left">
            
            {/* Health System Trust Badge */}
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-[#D0F2E1] text-[#046d40] tracking-widest uppercase border border-emerald-500/10">
              <span className="w-2 h-2 rounded-full bg-[#046d40] animate-ping" />
              ● TRUSTED BY GHS PARTNERS
            </span>

            {/* Standard Headline Logo styling */}
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-black font-display text-gray-400">MamaMatch <span className="text-primary tracking-tight font-black">GH</span></p>
              <h1 className="text-4xl md:text-5.5xl font-black font-display tracking-tight text-[#4f4634] leading-[1.1]">
                SAFE PREGNANCIES.<br />
                CLOSER CARE.
              </h1>
            </div>

            {/* Paragraph with 3 dots stacked next for styling details */}
            <div className="flex gap-4 md:gap-6 items-center bg-gray-50/50 p-4 rounded-3xl border border-gray-100 max-w-xl">
              <p className="text-gray-600 font-bold text-sm md:text-base leading-relaxed">
                Connecting Ghanaian mothers with premium personalized prenatal care, expert support, and a community that understands your journey.
              </p>
              
              {/* Three dots - representation of Kente palette circles */}
              <div className="flex flex-col gap-2.5 shrink-0 select-none border-l border-gray-200 pl-4">
                <span className="w-4 h-4 rounded-full bg-[#F1E3D3] shadow-inner animate-bounce" style={{ animationDelay: '0ms' }} title="Adinkra" />
                <span className="w-4 h-4 rounded-full bg-[#E8B4B8] shadow-inner animate-bounce" style={{ animationDelay: '150ms' }} title="Heritage" />
                <span className="w-4 h-4 rounded-full bg-[#B3D1C4] shadow-inner animate-bounce" style={{ animationDelay: '300ms' }} title="Growth" />
              </div>
            </div>

            {/* Buttons Row with dynamic color matching */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Gold Check-in Button */}
              <button 
                id="btn-start"
                onClick={handleStart}
                style={{ backgroundColor: '#795900' }}
                className="w-full sm:w-auto text-white px-8 py-4 rounded-2xl md:rounded-3xl font-extrabold text-base flex items-center justify-center gap-3 shadow-lg hover:brightness-105 active:scale-95 hover:scale-[1.02] transition-all cursor-pointer"
              >
                {t.start}
                <ChevronRight className="w-5 h-5 text-white" />
              </button>

              {/* White BG Red-outline button */}
              <button 
                id="btn-clinics-browse"
                onClick={() => setShowClinics(true)}
                className="w-full sm:w-auto bg-white border-2 border-[#bb001e] hover:bg-red-50/50 text-[#bb001e] px-8 py-4 rounded-2xl md:rounded-3xl font-extrabold text-base flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Browse Clinics
              </button>
            </div>
          </div>

          {/* Right Column Mother Banner Card */}
          <div className="md:col-span-5 flex justify-center w-full relative">
            <div className="relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border-4 border-white aspect-[3/4] max-h-[460px]">
              <img 
                src="/src/assets/images/560740e01ab88a39d1530c1b7c572220.jpg" 
                alt="MamaMatch Ghanaian Mother" 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1582562124811-c09040d0a901?q=80&w=2574";
                }}
              />
              {/* Overlay weekly milestone card */}
              <div className="absolute bottom-4 left-4 right-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[#795900] flex items-center justify-center text-white shrink-0 shadow-inner">
                  <Heart className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-[#795900] uppercase tracking-wider block">Weekly Milestone</span>
                  <span className="text-xs md:text-sm font-black text-gray-800 leading-none">Your baby is the size of a mango.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Aesthetic multi-gradient line & footer status */}
      <footer className="w-full pb-8 shrink-0">
        <div className="bg-gradient-to-r from-[#795900] via-[#bb001e] to-[#046d40] h-1.5 rounded-full select-none max-w-7xl mx-auto mx-4 mb-5" />
        
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black bg-[#FAF9F6] border border-[#d3c5ae]/40 text-[#4f4634] shadow-sm select-none uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-[#046d40]" />
            🏆 {t.trust}
          </span>
        </div>
      </footer>
    </div>
  );

  const renderLanguageSelect = () => (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 bg-[#FCFBF9]">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-8 animate-fade-in text-center">
        <div className="space-y-6">
          <div className="inline-flex p-5 bg-[#daa520]/15 rounded-full border border-[#daa520]/20 text-[#795900]">
            <Globe className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[#5c4300] tracking-tight">{t.selectLanguage}</h2>
            <p className="text-gray-500 font-bold text-sm">Choose the language you are most comfortable with.</p>
          </div>
        </div>
        
        <div className="space-y-3.5">
          {(['english', 'twi', 'ga'] as Language[]).map(lang => (
            <button
              key={lang}
              id={`lang-${lang}`}
              onClick={() => handleLanguageSelect(lang)}
              className="w-full bg-white border border-[#d3c5ae]/65 p-5 rounded-2xl flex items-center justify-between group hover:border-[#795900] hover:bg-[#795900]/5 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="text-lg font-black text-gray-800 capitalize select-none">{lang}</span>
              <div className="w-7 h-7 rounded-full border-2 border-gray-200 group-hover:border-[#795900] group-hover:bg-[#795900]/10 flex items-center justify-center transition-all">
                <div className="w-3 h-3 rounded-full bg-[#795900] opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col justify-between">
      {/* Aligned Header bar */}
      <header className="sticky top-0 bg-white border-b border-[#d3c5ae]/45 shadow-sm z-15 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-left">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-[#daa520]/10 flex items-center justify-center overflow-hidden border border-gray-200">
               <User className="text-[#795900] w-6 h-6 shrink-0" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#4f4634] leading-tight">Ama</h3>
            <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest leading-none">Online Midwife Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Ama Read-Aloud Toggle */}
          <button 
            onClick={() => {
              const nextVal = !voicePlaybackActive;
              setVoicePlaybackActive(nextVal);
              if (!nextVal && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              } else if (nextVal && messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg.sender === 'ama') {
                  speakText(lastMsg.text, state.language);
                }
              }
            }}
            className={`p-2 px-3 rounded-full border text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all select-none cursor-pointer ${
              voicePlaybackActive 
                ? 'bg-[#795900]/10 border-[#795900] text-[#795900]' 
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-[#795900]'
            }`}
            title={voicePlaybackActive ? "Turn off voice" : "Turn on voice"}
          >
            {voicePlaybackActive ? (
              <>
                <Volume2 className="w-4 h-4 text-[#795900] animate-bounce" />
                <span className="hidden xs:inline">Ama Reading</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-gray-400" />
                <span className="hidden xs:inline">No Voice</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500/10 to-amber-500/5 rounded-full border border-[#d3c5ae]/40 shadow-sm">
             <Heart className="w-4 h-4 text-[#795900]" fill="currentColor" />
             <span className="font-extrabold text-[#795900] text-[11px] uppercase tracking-wide hidden sm:inline">MamaMatch GH</span>
          </div>
        </div>
      </header>

      {/* Main chat messages scrolling area */}
      <main className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-[#d3c5ae]/30 flex items-start gap-3 shadow-inner max-w-2xl mx-auto text-left">
          <AlertCircle className="w-5 h-5 text-[#bb001e] shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-gray-500 leading-normal">
            {(t as any).infoNote}
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.sender === 'ama' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] px-5 py-4 rounded-2xl shadow-sm ${
                  msg.sender === 'ama' 
                    ? 'bg-white rounded-bl-none border-l-4 border-[#795900]' 
                    : 'bg-[#FAF5E8]/85 rounded-br-none border-r-4 border-[#bb001e]'
                }`}>
                  <p className="text-base text-left font-bold leading-relaxed text-[#1a1c1c] whitespace-pre-line">
                    {msg.text}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-1.5 items-start text-left"
              >
                <div className="bg-white rounded-2xl rounded-bl-none border-l-4 border-[#795900] px-5 py-3 shadow-sm flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-[#795900] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-[#795900] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-[#795900] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] font-black text-[#795900]/70 italic animate-pulse ml-2 uppercase tracking-wide">
                  {state.language === 'twi' ? "Ama redwene..." : state.language === 'ga' ? "Ama esusu mli..." : "Ama is thinking..."}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div ref={chatEndRef} />
      </main>

      <footer className="p-4 bg-white border-t border-[#d3c5ae]/40 shadow-lg flex flex-col gap-3 sticky bottom-0 z-20">
        {state.currentQuestionIndex === -1 && (
          <button 
            id="chat-start"
            onClick={async () => {
              addUserMessage(t.start);
              setState(prev => ({ ...prev, currentQuestionIndex: 0 }));
              setIsTyping(true);
              const result = await fetchAmaResponse(0, {}, -1, null);
              setIsTyping(false);
              addAmaMessage(result.text);
            }}
            className="w-full max-w-xl mx-auto bg-[#795900] hover:bg-[#5c4300] text-white h-14 rounded-2xl font-black shadow-lg active:scale-95 transition-all text-lg cursor-pointer"
          >
            {t.start}
          </button>
        )}

        {state.currentQuestionIndex >= 0 && state.currentQuestionIndex < 10 && (
          <div className="w-full max-w-xl mx-auto space-y-3">
            {/* Horizontal suggestion chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center">
              <span className="text-[11px] font-black uppercase text-gray-400 shrink-0 select-none mr-1">
                {state.language === 'twi' ? "Mmuaeɛ mmoa:" : state.language === 'ga' ? "Gbɛtsɔɔmɔ:" : "Suggestions:"}
              </span>
              {state.currentQuestionIndex === 0 ? (
                // Weeks suggestions
                [4, 8, 12, 16, 20, 24, 28, 32, 36, 40].map(weeksNum => (
                  <button
                    key={weeksNum}
                    onClick={() => handleAnswer(weeksNum, `${weeksNum} Weeks`)}
                    className="shrink-0 bg-[#daa520]/10 hover:bg-[#795900]/10 text-[#795900] text-xs font-black px-3.5 py-2 rounded-full border border-[#795900]/20 transition-all cursor-pointer select-none"
                  >
                    {weeksNum} Weeks
                  </button>
                ))
              ) : (
                // Yes / No default quick chips
                [
                  { value: true, label: t.yes, emoji: "👍" },
                  { value: false, label: t.no, emoji: "👎" },
                  { value: true, label: state.language === 'twi' ? "Ɛyɛ me ya" : "A bit/Sometimes", emoji: "🤕" },
                  { value: false, label: state.language === 'twi' ? "Dabi koraa" : "Not at all", emoji: "✨" }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(chip.value, chip.label)}
                    className="shrink-0 bg-[#F5F3F7] hover:bg-[#daa520]/15 text-gray-700 hover:text-[#795900] text-xs font-black px-4 py-2.5 rounded-full border border-gray-200 hover:border-[#795900]/30 transition-all cursor-pointer"
                  >
                    {chip.emoji} {chip.label}
                  </button>
                ))
              )}
            </div>

            {/* Main Interactive Chat Box */}
            <div className="flex items-center gap-2 text-left">
              <div className="relative flex-grow flex items-center bg-gray-50 border border-gray-200 focus-within:border-[#795900] focus-within:ring-2 focus-within:ring-[#795900]/10 rounded-2xl px-3.5 py-1 transition-all">
                <MessageCircle className="w-5 h-5 text-gray-400 shrink-0" />
                <input 
                  type="text" 
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  placeholder={
                    isListening
                      ? (state.language === 'twi' ? "Yɛretie wo, kasa seesei..." : "Listening to your voice, speak now...")
                      : state.currentQuestionIndex === 0
                      ? (state.language === 'twi' ? "Twerɛ anaa kasa nnawɔtwe ahen..." : "Type or speak weeks e.g. 14 weeks...")
                      : (state.language === 'twi' ? "Twerɛ anaa kasa wo mmuaeɛ..." : "Type or speak pregnancy status...")
                  }
                  className="w-full bg-transparent border-none text-gray-800 text-xs sm:text-sm md:text-base font-bold py-3.5 px-3 outline-none focus:outline-none placeholder-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                       handleSubmitCustom();
                    }
                  }}
                />

                {/* Microphone Button with elegant pulsing animation */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center relative select-none shrink-0 ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse shadow-md scale-105' 
                      : 'text-gray-400 hover:text-[#795900] hover:bg-[#795900]/5'
                  }`}
                  title={isListening ? "Stop listening" : "Speak your message"}
                >
                  {isListening ? (
                    <>
                      <Mic className="w-4.5 h-4.5" />
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                      </span>
                    </>
                  ) : (
                    <Mic className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
              <button 
                onClick={handleSubmitCustom}
                disabled={!customInputText.trim() || isTyping}
                className="bg-[#795900] hover:bg-[#5c4300] disabled:bg-gray-200 text-white p-4 rounded-2xl shadow-lg active:scale-95 disabled:scale-100 disabled:shadow-none transition-all duration-200 shrink-0 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );

  const renderLoading = () => (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 space-y-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        className="text-[#795900] bg-white p-6 rounded-full shadow-xl border border-gray-100 shrink-0"
      >
        <Loader2 className="w-14 h-14 text-[#795900] animate-pulse" />
      </motion.div>
      <div className="space-y-1.5 text-center">
        <p className="text-xl font-black text-[#5c4300] animate-pulse">Evaluating midwife evaluation...</p>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none">{t.calculating}</p>
      </div>
    </div>
  );

  const renderResult = () => {
    const risk = state.riskLevel || 'LOW';
    const config = {
      LOW: { 
        icon: CheckCircle2, 
        bg: 'bg-emerald-50/70', 
        border: 'border-[#046d40]', 
        text: 'text-[#046d40]', 
        badgeBg: 'bg-emerald-100 text-[#004c2b]',
        btn: t.lowRiskBtn, 
        msg: t.lowRiskMsg, 
        iconColor: 'text-[#046d40]' 
      },
      MEDIUM: { 
        icon: AlertTriangle, 
        bg: 'bg-[#fdfbf2]', 
        border: 'border-[#daa520]', 
        text: 'text-[#795900]', 
        badgeBg: 'bg-[#ffdea0]/80 text-[#261900]',
        btn: t.mediumRiskBtn, 
        msg: t.mediumRiskMsg, 
        iconColor: 'text-[#795900]' 
      },
      HIGH: { 
        icon: AlertCircle, 
        bg: 'bg-red-50/70', 
        border: 'border-[#bb001e]', 
        text: 'text-[#bb001e]', 
        badgeBg: 'bg-[#ffdad7] text-[#410004]',
        btn: t.highRiskBtn, 
        msg: t.highRiskMsg, 
        iconColor: 'text-[#bb001e]' 
      }
    }[risk];

    // Determine the user's primary language based on selection for custom headings
    const isTwi = state.language === 'twi';
    const isGa = state.language === 'ga';

    const headings = {
      title: isTwi ? "Wo Nyinsɛn Check-In Ho Kyerɛwtohɔ" : isGa ? "O-Check-In He Saji Amasusu" : "Your Pregnancy Assessment Report",
      subtitle: isTwi ? "Ama afutuo ne kyerɛkyerɛmu dodoɔ" : isGa ? "Ama mu Gbɛtsɔɔmɔ kɛ kyerɛkyerɛmu" : "Midwifery health insights completely matched to your answers",
      riskBadge: isTwi ? "Kɔgyee gyinabea:" : isGa ? "Bɔ ni hewalɛ lɛ teo:" : "Calculated Status:",
      analysisTitle: isTwi ? "Ama mu nkyerɛmu ne awerehyekyerɛ" : isGa ? "Ama mu He-Kpakpa Wiemɔ" : "Midwife Ama's Detailed Insight",
      adviceTitle: isTwi ? "Nyinsɛn mu afutuo pa ne nnuane" : isGa ? "Nii sa akɛ oye kɛ hewalɛnamɔ" : "Personalized Pregnancy & Nutrition Tips",
      actionTitle: isTwi ? "Nneɛma a ɛsɛ sɛ woyɛ mprepren" : isGa ? "Gbɛtsɔɔmɔ kukuu kɛha bo" : "Recommended Immediate Actions",
      disclaimer: isTwi 
        ? "Wiemɔ yi yɛ mmoa kɛkɛ. Sɛ wo ho yɛ kyere yɛ adom firi ayaresabea kɔ ayaresabea seesei anaasɛ frɛ 112." 
        : isGa 
        ? "Gbɛtsɔɔmɔ nɛɛ ji mɔbɔ mɔbɔ fari nitsumo. Sɛ hewalɛgbeyeegbee te shi ya dɔkta-tsu amrɔ nɛɛ loo tsɛ 112." 
        : "This AI check-in is an automated midwife helper for MamaMatch GH and is not a formal medical diagnosis. In case of emergency, please visit the nearest Ghanaian healthcare facility safely or call 112."
    };

    const report = state.detailedAnalysis || {
      summary: config.msg,
      riskExplanation: config.msg,
      pregnancyTips: [
        isTwi ? "Nom nsuo pii, na di nnuane a ɛmã nipadua no ahoɔden te sɛ kontomire." : isGa ? "Num nu pii, ni oye nii ni baaha ohewalɛ agbo tamɔ kontomire." : "Ensure you stay hydrated by drinking water and eat iron-rich foods.",
        isTwi ? "Gye wo home yiye seesei." : isGa ? "Joo ohe jɔmɔ yiye." : "Prioritize getting plenty of rest.",
        isTwi ? "Kɔ ayaresabea mma w'asɛm nhia." : isGa ? "Yaa helatsū daa mɛ okɛ dɔkta mra." : "Keep up with your scheduled clinic visits."
      ],
      nextSteps: [
        isTwi ? "Sɛ wowɔ anyinsɛn mu bɔ biara a kɔ ayaresabea." : isGa ? "Yaa helatsū amrɔ kɛji ona pila ko." : "If you have any severe symptoms, visit the nearest facility.",
        isTwi ? "Bisa wo nurse mmoa." : "Talk to your midwife/nurse."
      ]
    };

    return (
      <div className="min-h-screen bg-[#FCFBF8] pb-12 flex flex-col items-center">
        <header className="w-full max-w-xl p-6 flex justify-between items-center bg-white border-b border-gray-100 shadow-sm sticky top-0 z-25">
          <div className="flex items-center gap-2">
            <Heart className="text-primary w-6 h-6 animate-pulse" fill="currentColor" />
            <span className="font-extrabold text-primary tracking-tight text-sm uppercase">Report Dashboard</span>
          </div>
          <button 
            onClick={() => setState(prev => ({...prev, screen: 'start', detailedAnalysis: null}))} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </header>

        <div className="w-full max-w-xl px-4 py-6 space-y-6 text-left">
          {/* Main Assessment Header Card */}
          <div className="text-center space-y-2 mt-2">
            <h1 className="text-2xl md:text-3xl font-black text-[#5c4300] tracking-tight leading-tight">
              {headings.title}
            </h1>
            <p className="text-gray-500 text-sm font-bold">
              {headings.subtitle}
            </p>
          </div>

          {/* Risk Badge card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl border-2 ${config.border} p-5 flex items-center justify-between shadow-md ${config.bg}`}
          >
            <div className="flex items-center gap-4">
              <div className={`${config.iconColor} bg-white p-3 rounded-2xl shadow-sm shrink-0`}>
                <config.icon className="w-7 h-7" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-black text-gray-400 block tracking-widest">{headings.riskBadge}</span>
                <span className={`text-lg font-black tracking-tight ${config.text} uppercase`}>
                  {risk.toLowerCase()} Risk
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full ${config.badgeBg} shadow-sm border border-black/5`}>
              {risk} STATUS
            </span>
          </motion.div>

          {/* Detailed Overview Section */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
              <h3 className="font-extrabold text-[#795900] text-lg">{headings.analysisTitle}</h3>
            </div>
            <div className="space-y-3">
              <p className="text-gray-800 text-base font-bold bg-[#FAF9F5] p-4.5 rounded-2xl leading-relaxed italic border-l-4 border-primary">
                "{report.summary}"
              </p>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed font-semibold">
                {report.riskExplanation}
              </p>
            </div>
          </motion.div>

          {/* Pregnancy & Nutrition Tips Section */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
              <Activity className="w-5 h-5 text-[#046d40] shrink-0" />
              <h3 className="font-extrabold text-[#046d40] text-lg">{headings.adviceTitle}</h3>
            </div>
            <div className="space-y-3">
              {report.pregnancyTips.map((tip, index) => (
                <div key={index} className="flex gap-3 bg-[#F9FAF9] p-3.5 rounded-2xl border border-emerald-500/10 items-start">
                  <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm">
                    {index + 1}
                  </span>
                  <p className="text-xs md:text-sm text-gray-700 font-bold leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Action Steps Section */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
              <FileText className="w-5 h-5 text-[#bb001e] shrink-0" />
              <h3 className="font-extrabold text-[#bb001e] text-lg">{headings.actionTitle}</h3>
            </div>
            <div className="space-y-3">
              {report.nextSteps.map((step, index) => (
                <div key={index} className="flex gap-3 bg-[#FFFAFA] p-3.5 rounded-2xl border border-red-500/10 items-start italic">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#bb001e] shrink-0 mt-1.5 animate-bounce" />
                  <p className="text-xs md:text-sm text-gray-700 font-extrabold leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Safety Disclaimer */}
                    {/* Primary Action Button */}
          <button 
            onClick={() => {
              if (risk === 'LOW') {
                setShowClinics(true);
              } else {
                const weeks = parseInt(state.answers[0]) || 12;
                setPatientForm({ name: "", phone: "", region: "Ashanti" });
                setShowPatientMatchModal(true);
              }
            }}
            className={`w-full h-16 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all text-white cursor-pointer ${
              risk === 'LOW' ? 'bg-[#046d40] hover:bg-[#03512f]' : risk === 'MEDIUM' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#bb001e] hover:bg-[#9c0218]'
            }`}
          >
            {config.btn}
          </button>
        </div>
      </div>
    );
  };

  const submitPatientTriageAndMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientForm.name.trim() || !patientForm.phone.trim()) {
      alert("Please provide both name and contact number.");
      return;
    }

    setIsSubmittingCheckIn(true);
    try {
      const weeks = parseInt(state.answers[0]) || 12;
      const response = await fetch('/api/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: patientForm.name,
          phone: patientForm.phone,
          language: state.language,
          gestationalWeeks: weeks,
          region: patientForm.region,
          riskLevel: state.riskLevel,
          answers: state.answers,
          summary: state.detailedAnalysis?.summary || "Completed check-in.",
          riskExplanation: state.detailedAnalysis?.riskExplanation || "",
          pregnancyTips: state.detailedAnalysis?.pregnancyTips || [],
          nextSteps: state.detailedAnalysis?.nextSteps || []
        })
      });

      if (!response.ok) {
        throw new Error("Could not save diagnostic check-in");
      }

      const verifiedCheckIn = await response.json();
      await fetchLiveDatabase();

      const matchedMidwife = nursesList.find(n => n.id === verifiedCheckIn.matchedNurseId) || nursesList[0];
      setActiveMatchedNurse(matchedMidwife);
      
      setShowPatientMatchModal(false);
      setState(prev => ({ ...prev, screen: 'nurse-match' }));
    } catch (err) {
      console.warn("DB submit failed, using midwife fallback:", err);
      setActiveMatchedNurse(nursesList[0] || null);
      setShowPatientMatchModal(false);
      setState(prev => ({ ...prev, screen: 'nurse-match' }));
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  const renderNurseMatch = () => {
    const midwife = activeMatchedNurse || nursesList[0] || {
      name: "Abena Mensah",
      region: "Ashanti",
      languages: ["English", "Twi"],
      availability: "Available",
      whatsapp: "233501234567",
      avatar: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?q=80&w=2574"
    };

    const cleanWhatsapp = midwife.whatsapp ? midwife.whatsapp.replace(/\+/g, "").trim() : "233501234567";
    const greetingText = `Medaase! Hello Nurse ${midwife.name}, I completed the triage check-in on MamaMatch GH. My name is ${patientForm.name || "Maa"} from ${patientForm.region || "Ashanti"}. My assessed risk is ${state.riskLevel}. Can you please review my answers?`;
    const whatsAppLink = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(greetingText)}`;

    return (
      <div className="min-h-screen bg-[#FAF9F5] p-6 flex flex-col items-center justify-center">
        <header className="w-full max-w-sm flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
             <Heart className="text-[#bb001e] w-6 h-6 shrink-0" fill="currentColor" />
             <span className="font-black text-[#5c4300] uppercase text-xs tracking-wider">MamaMatch GH</span>
          </div>
          <button className="p-2 hover:bg-white rounded-full transition-colors active:scale-95 cursor-pointer" onClick={() => setState(prev => ({...prev, screen: 'start'}))}>
             <X className="text-gray-400 w-5 h-5" />
          </button>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden text-center"
        >
          <div className="bg-[#795900] h-32 relative flex justify-center bg-gradient-to-br from-[#795900] to-[#5c4300]">
             <div className="absolute -bottom-12 w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-[#FAF9F5] shadow-lg">
               <img 
                 src={midwife.avatar || "https://images.unsplash.com/photo-1582562124811-c09040d0a901?q=80&w=2574"} 
                 alt={midwife.name} 
                 className="w-full h-full object-cover"
               />
             </div>
          </div>

          <div className="pt-16 pb-8 px-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-gray-800">{midwife.name}</h2>
              <div className="flex items-center justify-center gap-1.5 text-gray-500 font-bold">
                <MapPin className="w-4 h-4 text-[#795900]" />
                <span className="text-sm">Region: {midwife.region}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
               <span className="bg-[#daa520]/15 px-3.5 py-1.5 rounded-full text-xs font-black text-[#5c4300] border border-[#daa520]/20">
                 Languages: {Array.isArray(midwife.languages) ? midwife.languages.join(", ") : midwife.languages}
               </span>
            </div>

            <div className="flex items-center justify-center gap-2 text-emerald-600 border bg-emerald-50 border-emerald-200/50 py-1.5 px-4 rounded-xl max-w-xs mx-auto">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
               <span className="text-xs font-black uppercase tracking-widest leading-none">Verified {midwife.availability || "Available"}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
               <div className="bg-gray-50 rounded-2xl p-4 space-y-1 border border-gray-100/70 text-center">
                  <Clock className="w-5 h-5 text-[#795900] mx-auto" />
                  <p className="text-[10px] font-black uppercase text-gray-400 block tracking-wider mt-0.5">Experience</p>
                  <p className="text-xs font-black text-gray-800">Midwife Officer</p>
               </div>
               <div className="bg-gray-50 rounded-2xl p-4 space-y-1 border border-gray-100/70 text-center">
                  <ShieldCheck className="w-5 h-5 text-[#046d40] mx-auto" />
                  <p className="text-[10px] font-black uppercase text-gray-400 block tracking-wider mt-0.5">License</p>
                  <p className="text-xs font-black text-[#046d40]">{midwife.licenseNumber || "Certified GHS"}</p>
               </div>
            </div>

            <a 
              href={whatsAppLink}
              target="_blank" 
              rel="noreferrer"
              className="block w-full bg-[#25D366] text-white h-16 rounded-2xl font-black flex items-center justify-center gap-2.5 shadow-lg hover:brightness-95 hover:scale-[1.02] transition-all text-base/none cursor-pointer"
            >
               <MessageCircle className="w-6 h-6 fill-current shrink-0" />
               WhatsApp Consultation
            </a>
          </div>
        </motion.div>
        
        <button 
          onClick={() => setState(prev => ({...prev, screen: 'start'}))}
          className="mt-8 text-gray-500 hover:text-[#795900] font-black text-xs uppercase tracking-widest decoration-primary/30 cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    );
  };

  const renderPortalGate = (type: 'nurse' | 'ghs') => {
    const handleAuthSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const user = authUsername.trim().toLowerCase();
      const pass = authPassword.trim().toLowerCase();
      
      if (user === 'admin' && pass === 'admin') {
        if (type === 'nurse') {
          setIsNurseUnlocked(true);
        } else {
          setIsGhsUnlocked(true);
        }
        setAuthError("");
        setAuthUsername("");
        setAuthPassword("");
      } else {
        setAuthError("Invalid credentials. Please enter 'admin' for both fields.");
      }
    };

    const targetTitle = type === 'nurse' ? "GHS Midwife Care Station" : "Ghana Health Service Official Registry";
    const targetSub = type === 'nurse' 
      ? "Confidential clinical monitoring dashboard. Registered midwives can review assessments, contact local mothers over WhatsApp, and approve triage plans."
      : "National clinical logs and antenatal risk profiles. Authorized directors and clinical administrators only.";

    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] border border-gray-150 p-8 space-y-6 shadow-xl text-left"
        >
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-[#795900] mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-gray-900 leading-tight">{targetTitle}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">{targetSub}</p>
          </div>

          {authError && (
            <div className="p-3.5 bg-red-50 text-[#bb001e] border border-red-200 rounded-2xl text-[11px] font-black tracking-wide leading-relaxed">
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Username</label>
              <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-[#795900] rounded-xl px-4 py-1">
                <input 
                  type="text" 
                  required 
                  placeholder="Enter username..."
                  className="w-full bg-transparent border-none text-gray-800 text-sm font-semibold outline-none py-2" 
                  value={authUsername} 
                  onChange={e => {
                    setAuthUsername(e.target.value);
                    setAuthError("");
                  }} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Password</label>
              <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-[#795900] rounded-xl px-4 py-1">
                <input 
                  type="password" 
                  required 
                  placeholder="Enter password..."
                  className="w-full bg-transparent border-none text-gray-800 text-sm font-semibold outline-none py-2" 
                  value={authPassword} 
                  onChange={e => {
                    setAuthPassword(e.target.value);
                    setAuthError("");
                  }} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              style={{ backgroundColor: '#795900' }}
              className="w-full text-white h-12 rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-95 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none mt-2"
            >
              Sign In
            </button>
          </form>



          <div className="text-center">
            <button 
              type="button"
              onClick={() => setActivePortal('mother')}
              className="text-xs font-black text-gray-500 hover:text-gray-800 underline uppercase tracking-widest cursor-pointer border-none bg-transparent"
            >
              Cancel & Return To Mother Assessor
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderNursePortal = () => {
    const activeNurse = nursesList.find(n => n.id === selectedNurseId) || nursesList[0];
    const matchingCheckIns = allCheckIns.filter(c => c.matchedNurseId === (activeNurse?.id || ""));

    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Registration Overlay Card Form */}
        {showNurseRegisterForm && (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#FCFBF8] rounded-[32px] p-8 max-w-sm w-full shadow-2xl space-y-5 text-left border border-gray-100">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h3 className="font-extrabold text-xl text-gray-800">Midwife Registration</h3>
                <button onClick={() => setShowNurseRegisterForm(false)} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-extrabold hover:bg-gray-200 border-none">X</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newNurseForm.name || !newNurseForm.licenseNumber || !newNurseForm.whatsapp) {
                  alert("Please fill all professional fields.");
                  return;
                }
                try {
                  const res = await fetch('/api/nurses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newNurseForm)
                  });
                  if (res.ok) {
                    const saved = await res.json();
                    alert(`Submission received! Nurse ${saved.name} status is set to PENDING verification by GHS.`);
                    await fetchLiveDatabase();
                    setSelectedNurseId(saved.id);
                    setShowNurseRegisterForm(false);
                  }
                } catch (err) {
                  console.error(err);
                }
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Midwife Full Name</label>
                  <input type="text" required placeholder="e.g., Faustina Gyamfi" className="w-full bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-800 outline-none focus:border-[#795900] font-semibold text-sm" value={newNurseForm.name} onChange={e => setNewNurseForm(p=>({...p, name: e.target.value}))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">GHS License Number</label>
                  <input type="text" required placeholder="e.g., M-48212" className="w-full bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-800 outline-none focus:border-[#795900] font-mono font-semibold text-sm" value={newNurseForm.licenseNumber} onChange={e => setNewNurseForm(p=>({...p, licenseNumber: e.target.value}))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Assigned Region</label>
                  <select className="w-full bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-800 outline-none focus:border-[#795900] font-semibold text-sm" value={newNurseForm.region} onChange={e => setNewNurseForm(p=>({...p, region: e.target.value}))}>
                    {["Ashanti", "Greater Accra", "Central", "Northern", "Western", "Volta", "Eastern"].map(r => (
                      <option key={r} value={r}>{r} Region</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">WhatsApp Number</label>
                  <input type="text" required placeholder="e.g., 233244123456" className="w-full bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-800 outline-none focus:border-[#795900] font-semibold text-sm" value={newNurseForm.whatsapp} onChange={e => setNewNurseForm(p=>({...p, whatsapp: e.target.value}))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase block tracking-widest">Languages Spoken</label>
                  <div className="flex flex-wrap gap-2">
                    {["English", "Twi", "Ga", "Fante", "Ewe", "Dagbani"].map(lang => {
                      const isSel = newNurseForm.languages.includes(lang);
                      return (
                        <button type="button" key={lang} onClick={() => {
                          setNewNurseForm(p => ({
                            ...p,
                            languages: isSel ? p.languages.filter(l => l !== lang) : [...p.languages, lang]
                          }));
                        }} className={`px-3 py-1.5 rounded-full text-[11px] font-black border transition-all cursor-pointer ${isSel ? "bg-[#795900] text-white border-[#795900]" : "bg-white text-gray-500 border-gray-200"}`}>
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button type="submit" style={{ backgroundColor: '#795900' }} className="w-full text-white h-12 rounded-xl font-black mt-2 shadow-md hover:brightness-95 border-none cursor-pointer">Register and Submit Review</button>
              </form>
            </motion.div>
          </div>
        )}

        {/* TOP ROW: Identity Selector & Verification Status banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-8 mb-8 text-left">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-gray-900 leading-tight">Midwife Workstation</h2>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-widest">Community Care Matching & Triage Engine</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-400 uppercase shrink-0">Active Midwife:</span>
              <select 
                value={selectedNurseId} 
                onChange={e => setSelectedNurseId(e.target.value)} 
                className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-black text-gray-700 outline-none focus:ring-1 focus:ring-emerald-700 w-48"
              >
                {nursesList.map((n: any) => (
                  <option key={n.id} value={n.id}>{n.name} ({n.status === 'VERIFIED' ? 'Verified' : 'Pending'})</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => {
                setNewNurseForm({ name: "", licenseNumber: "", region: "Ashanti", whatsapp: "", languages: [] });
                setShowNurseRegisterForm(true);
              }}
              style={{ backgroundColor: '#795900' }}
              className="text-white px-5 py-3 rounded-xl text-xs font-black cursor-pointer shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 border-none"
            >
              <UserPlus className="w-4 h-4 shrink-0" /> Register as Midwife
            </button>
          </div>
        </div>

        {/* Nurse Bio Summary & Toggle card */}
        {activeNurse ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 shadow-sm text-left">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#795900]/10 shrink-0 bg-[#FAFBF8]">
                <img src={activeNurse.avatar} alt={activeNurse.name} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-gray-900 leading-none">{activeNurse.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border uppercase leading-none ${activeNurse.status === "VERIFIED" ? "bg-emerald-50 text-emerald-700 border-emerald-400/20" : "bg-yellow-50 text-yellow-700 border-yellow-400/20"}`}>
                    {activeNurse.status === "VERIFIED" ? "Verified Midwife" : "Pending Credentials"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-bold">GHS License: <span className="font-mono">{activeNurse.licenseNumber}</span> | Region: {activeNurse.region} Region</p>
                <p className="text-xs text-[#795900] font-extrabold">Languages: {activeNurse.languages ? activeNurse.languages.join(", ") : "English"}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center shrink-0 w-full md:w-auto">
              {/* Availability Toggle */}
              <div className="space-y-1 w-full sm:w-auto">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Duty Availability</p>
                <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
                  {["Available", "Busy", "Off"].map((st) => (
                    <button 
                      key={st}
                      onClick={async () => {
                        try {
                          await fetch(`/api/nurses/${activeNurse.id}/toggle`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ availability: st })
                          });
                          await fetchLiveDatabase();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border-none ${
                        activeNurse.availability === st 
                          ? st === "Available" 
                            ? "bg-emerald-600 text-white shadow-sm"
                            : st === "Busy"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-gray-600 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 p-6 rounded-2xl text-center border border-amber-500/10 mb-8">
            <p className="font-semibold text-amber-800">No active nurses configured. Register or select one from the menu.</p>
          </div>
        )}

        {/* Patients matched grid */}
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-3 text-left">
            <h3 className="text-lg font-extrabold text-gray-800">Your Assigned Matched Cases ({matchingCheckIns.length})</h3>
            <p className="text-xs text-gray-400 mt-0.5">Assigned instantly by the system based on regional proximity and spoken language preferences</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {matchingCheckIns.length > 0 ? (
              matchingCheckIns.slice().reverse().map((triage) => (
                <motion.div 
                  key={triage.id} 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-gray-100/90 shadow-sm overflow-hidden text-left"
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 border-b border-gray-50">
                    <div className="space-y-3 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                          triage.riskLevel === "HIGH" 
                            ? "bg-red-50 text-[#bb001e] border-red-200" 
                            : triage.riskLevel === "MEDIUM" 
                            ? "bg-amber-50 text-amber-700 border-amber-200" 
                            : "bg-emerald-50 text-[#046d40] border-[#D0F2E1]"
                        }`}>
                          Risk Index: {triage.riskLevel}
                        </span>
                        {triage.status === "completed" ? (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">Completed</span>
                        ) : (
                          <span className="bg-rose-100 text-rose-900 border border-rose-300 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">Pending Review</span>
                        )}
                        <span className="text-xs text-gray-400 font-bold ml-1">{new Date(triage.timestamp).toLocaleDateString("en-GH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="text-2xl font-black text-gray-900">{triage.name}</h4>
                        <p className="text-xs text-gray-500 font-bold">Region: {triage.region} | Term: <span className="text-[#795900]">{triage.gestationalWeeks} Weeks</span> | Language preferred: <span className="uppercase font-extrabold">{triage.language}</span></p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/70">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 block border-b border-gray-100 pb-1 mb-1.5">MamaMatch AI Core Diagnosis</p>
                        <p className="text-xs md:text-sm font-semibold text-gray-700 leading-relaxed">{triage.riskExplanation}</p>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-3 shrink-0 items-stretch justify-end">
                      <a 
                        href={`https://wa.me/${triage.phone.replace(/\+/g, "").trim()}?text=Hello%20${encodeURIComponent(triage.name)},%2520this%20is%20Midwife%20${encodeURIComponent(activeNurse?.name || "")}%20from%20GHS.%20My%20care-team%20received%20your%20assessment%20report.%20`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full md:w-auto bg-[#25D366] text-white hover:brightness-95 px-5 py-3 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm transition-all text-center"
                      >
                        <MessageCircle className="w-4 h-4 shrink-0" /> Open WhatsApp
                      </a>
                      
                      {triage.status === "pending" && (
                        <button 
                          onClick={async () => {
                            try {
                              await fetch(`/api/check-ins/${triage.id}/complete`, { method: "POST" });
                              await fetchLiveDatabase();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="w-full md:w-auto bg-[#046d40] text-white px-5 py-3 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-1.5 hover:bg-[#03512f] shadow-sm cursor-pointer border-none"
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> Complete Triage
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Plain Language Answers Expander section */}
                  <div className="bg-[#FAF9F5]/40 px-6 py-4.5 border-t border-gray-50/60 flex flex-wrap gap-4 items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Mother Answers Surfaced:</span>
                    <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-600">
                      {Object.entries(triage.answers).map(([qid, val]) => {
                        const nameMap: Record<string, string> = {
                          "1": "Spotting/Bleeding",
                          "2": "Fever/Hot Body",
                          "3": "Facial Swelling",
                          "4": "Convulsions/Fits",
                          "5": "Discomfort/Pain in belly",
                          "6": "Severe head pain",
                          "7": "Blurred Vision",
                          "8": "Reduced baby kicking",
                          "9": "Painful urination"
                        };
                        const readable = nameMap[qid];
                        if (!readable) return null;
                        
                        return (
                          <span key={qid} className={`px-2.5 py-1 rounded-full border ${val === true ? "bg-red-50 text-red-700 border-red-200 font-extrabold" : "bg-gray-100 text-gray-500 border-gray-200/50"}`}>
                            {readable}: {val === true ? "🚨 Yes" : "No"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                <HeartHandshake className="text-gray-300 w-16 h-16 mx-auto mb-3" />
                <h4 className="font-extrabold text-xl text-gray-700">No Matched Cases Yet</h4>
                <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">Expectant mothers within your region speaking compatible languages will navigate as matches here when completing assessments.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGhsPortal = () => {
    const totalCheckInsCount = allCheckIns.length;
    const highRiskCount = allCheckIns.filter(c => c.riskLevel === 'HIGH').length;
    const activeMidwivesCount = nursesList.length;
    const pendingVerificationsCount = nursesList.filter(n => n.status === 'PENDING').length;

    const filteredCheckIns = allCheckIns.filter(c => {
      const matchRegion = ghsFilterRegion === "All" || c.region === ghsFilterRegion;
      const matchRisk = ghsFilterRisk === "All" || c.riskLevel === ghsFilterRisk;
      return matchRegion && matchRisk;
    });

    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 text-left">
        <div className="space-y-1 border-b border-gray-100 pb-4">
          <h2 className="text-3xl font-black text-[#5c4300] leading-none">Ghana Health Service Admin</h2>
          <p className="text-xs text-gray-400 font-extrabold uppercase mt-0.5 tracking-widest">National Antenatal Risk Monitoring & Maternal Welfare Registry</p>
        </div>

        {/* BENTO STATS CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Maternal Assessments</p>
              <p className="text-3xl font-black text-gray-900LEADING">{totalCheckInsCount}</p>
            </div>
            <Activity className="w-10 h-10 text-emerald-600 shrink-0" />
          </div>

          <div className="bg-red-50 rounded-2xl border border-red-500/10 p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-[#bb001e] tracking-wider">Critical High Risks</p>
              <p className="text-3xl font-black text-[#bb001e]">{highRiskCount}</p>
            </div>
            <Heart className="w-10 h-10 text-[#bb001e] shrink-0" fill="currentColor" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Staff Roster</p>
              <p className="text-3xl font-black text-[#795900]">{activeMidwivesCount}</p>
            </div>
            <ShieldCheck className="w-10 h-10 text-[#795900] shrink-0" />
          </div>

          <div className="bg-rose-50 rounded-2xl border border-rose-500/15 p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Pending Credentials</p>
              <p className="text-3xl font-black text-rose-600">{pendingVerificationsCount}</p>
            </div>
            <Milestone className="w-10 h-10 text-rose-600 shrink-0" />
          </div>
        </div>

        {/* MIDWIFE REGISTRY DIRECTORY */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-50 pb-4 gap-2">
            <div>
              <h3 className="text-lg font-extrabold text-gray-800 leading-tight">Certified Midwife Practice Registry ({nursesList.length})</h3>
              <p className="text-xs text-gray-400">Validate real professional credentials and practice licenses instantly</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nursesList.map((nurse) => (
              <div key={nurse.id} className="border border-gray-100 rounded-2xl p-4 flex justify-between items-center gap-4 bg-[#FAF9F5]/35 hover:bg-gray-100/35 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-gray-100 bg-white">
                    <img src={nurse.avatar} alt={nurse.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm md:text-base leading-none">{nurse.name}</h4>
                    <p className="text-xs text-gray-400 font-bold mt-1">License: <span className="font-mono font-black">{nurse.licenseNumber}</span> | Region: {nurse.region}</p>
                    <p className="text-[11px] text-[#795900] font-black uppercase mt-0.5">Languages: {nurse.languages?.join(", ") || "English"}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {nurse.status === "PENDING" ? (
                    <button 
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/nurses/${nurse.id}/verify`, { method: "POST" });
                          if (res.ok) {
                            alert(`Midwife credentials approved! Nurse ${nurse.name} is now certified to receive triage matches.`);
                            await fetchLiveDatabase();
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-2 px-3.5 border-none rounded-xl uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                    >
                      Verify Practice
                    </button>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 py-1.5 px-3 rounded-full text-[10px] font-black uppercase tracking-wider">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NATIONAL PATIENT MONITORING TABS AND TABLE REPORT */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <div>
              <h3 className="text-lg font-extrabold text-gray-800">Antenatal Clinical Logging Database</h3>
              <p className="text-xs text-gray-400 font-bold mt-0.5">National real-time logs of expectant mothers diagnostic evaluations</p>
            </div>

            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <select 
                value={ghsFilterRegion} 
                onChange={(e) => setGhsFilterRegion(e.target.value)} 
                className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black text-gray-500 outline-none"
              >
                <option value="All">All Regions</option>
                {["Ashanti", "Greater Accra", "Central", "Northern", "Western", "Volta", "Eastern"].map(rg => (
                  <option key={rg} value={rg}>{rg} Region</option>
                ))}
              </select>

              <select 
                value={ghsFilterRisk} 
                onChange={(e) => setGhsFilterRisk(e.target.value)} 
                className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black text-gray-500 outline-none"
              >
                <option value="All">All Risks</option>
                <option value="HIGH">High Risk Cases</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
              <thead>
                <tr className="bg-gray-100 select-none text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200">
                  <th className="py-4 px-6">Assessor Patient Name</th>
                  <th className="py-4 px-6">Ghana Region</th>
                  <th className="py-4 px-6">Risk Profile</th>
                  <th className="py-4 px-6">Gestational Age</th>
                  <th className="py-4 px-6">Assigned Match</th>
                  <th className="py-4 px-6">Status Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600">
                {filteredCheckIns.length > 0 ? (
                  filteredCheckIns.slice().reverse().map((chk) => {
                    const assignedNurse = nursesList.find(n => n.id === chk.matchedNurseId);
                    return (
                      <tr key={chk.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4.5 px-6 font-extrabold text-gray-900 text-sm">{chk.name}</td>
                        <td className="py-4.5 px-6">{chk.region} Region</td>
                        <td className="py-4.5 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                            chk.riskLevel === 'HIGH' 
                              ? 'bg-red-50 text-[#bb001e] border-red-200 font-extrabold' 
                              : chk.riskLevel === 'MEDIUM' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold' 
                              : 'bg-emerald-50 text-[#046d40] border-[#D0F2E1] font-black'
                          }`}>
                            {chk.riskLevel}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 font-bold">{chk.gestationalWeeks} Weeks</td>
                        <td className="py-4.5 px-6">
                          {assignedNurse ? (
                            <span className="text-[#a58120] font-black uppercase text-[11px] block">{assignedNurse.name} ({assignedNurse.region})</span>
                          ) : (
                            <span className="text-gray-400">Not Matched</span>
                          )}
                        </td>
                        <td className="py-4.5 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wider ${
                            chk.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-400/20' : 'bg-yellow-50 text-yellow-800 border-yellow-400/20'
                          }`}>
                            {chk.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 font-bold bg-white">No patient logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen font-sans bg-[#FCFBF8] flex flex-col justify-between">
      {/* Dynamic Header with Switcher Tabs */}
      <header className="w-full border-b border-gray-100 bg-white/85 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => { setActivePortal('mother'); setState(prev => ({ ...prev, screen: 'start' })); }}>
            <Heart className="text-[#bb001e] w-6 h-6 animate-pulse" fill="currentColor" />
            <span className="font-extrabold text-[#795900] tracking-tight text-lg md:text-xl font-display uppercase">
              MamaMatch <span className="text-emerald-700 font-black">GH</span>
            </span>
          </div>

          {/* Interactive Portal Selector */}
          <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200 select-none">
            <button 
              onClick={() => {
                setActivePortal('mother');
                setState(prev => ({ ...prev, screen: 'start' }));
              }}
              className={`py-1.5 px-3.5 rounded-full text-xs font-black transition-all cursor-pointer border-none ${activePortal === 'mother' ? 'bg-[#795900] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 bg-transparent'}`}
            >
              👩‍⚕️ Assessor
            </button>
            <button 
              onClick={() => {
                setActivePortal('nurse');
                if (nursesList.length > 0 && !selectedNurseId) {
                  const verified = nursesList.find((n: any) => n.status === "VERIFIED") || nursesList[0];
                  setSelectedNurseId(verified.id);
                }
              }}
              className={`py-1.5 px-3.5 rounded-full text-xs font-black transition-all cursor-pointer border-none ${activePortal === 'nurse' ? 'bg-[#795900] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 bg-transparent'}`}
            >
              🩺 Midwife Portal
            </button>
            <button 
              onClick={() => setActivePortal('ghs')}
              className={`py-1.5 px-3.5 rounded-full text-xs font-black transition-all cursor-pointer border-none ${activePortal === 'ghs' ? 'bg-[#795900] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 bg-transparent'}`}
            >
              🇬🇭 GHS Admin
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowClinics(true)} className="text-xs font-black text-gray-500 hover:text-gray-800 px-3 py-1.5 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200/50">
              🏥 Clinics Roster
            </button>
            {activePortal === 'nurse' && isNurseUnlocked && (
              <button 
                onClick={() => setIsNurseUnlocked(false)} 
                className="text-xs font-black text-rose-600 hover:text-rose-800 px-3 py-1.5 transition-colors cursor-pointer bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200/50 flex items-center gap-1"
              >
                <Lock className="w-3 h-3 text-rose-500" /> Lock Workspace
              </button>
            )}
            {activePortal === 'ghs' && isGhsUnlocked && (
              <button 
                onClick={() => setIsGhsUnlocked(false)} 
                className="text-xs font-black text-rose-600 hover:text-rose-800 px-3 py-1.5 transition-colors cursor-pointer bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200/50 flex items-center gap-1"
              >
                <Lock className="w-3 h-3 text-rose-500" /> Lock Admin
              </button>
            )}
            {activePortal === 'mother' && state.screen === 'start' && (
              <button 
                onClick={handleStart}
                className="bg-[#795900] hover:bg-[#5c4300] text-white text-xs font-black px-4 py-2 rounded-full transition-all shadow-sm cursor-pointer border-none animate-bounce"
              >
                Assess Now
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body content with full roll override support */}
      <div className="flex-grow">
        {activePortal === 'nurse' ? (
          <div key="nurse-portal">
            {isNurseUnlocked ? renderNursePortal() : renderPortalGate('nurse')}
          </div>
        ) : activePortal === 'ghs' ? (
          <div key="ghs-portal">
            {isGhsUnlocked ? renderGhsPortal() : renderPortalGate('ghs')}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {state.screen === 'start' && (
              <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderStart()}
              </motion.div>
            )}
            {state.screen === 'language-select' && (
              <motion.div key="lang" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {renderLanguageSelect()}
              </motion.div>
            )}
            {state.screen === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderChat()}
              </motion.div>
            )}
            {state.screen === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderLoading()}
              </motion.div>
            )}
            {state.screen === 'result' && (
              <motion.div key="result" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                {renderResult()}
              </motion.div>
            )}
            {state.screen === 'nurse-match' && (
              <motion.div key="nurse" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {renderNurseMatch()}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Patient Triage Matching Collect Info Modal */}
      {showPatientMatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-[#FCFBF8] rounded-[36px] p-8 max-w-sm w-full shadow-2xl space-y-6 text-left border border-gray-100"
          >
            <div className="space-y-2">
              <span className="bg-amber-100 text-amber-900 border border-amber-300 py-1 px-3.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                MamaMatch Connecting
              </span>
              <h3 className="font-black text-2xl text-gray-900 leading-tight">Match with a Certified Midwife</h3>
              <p className="text-xs text-gray-400 font-bold leading-relaxed">
                Connect instantly over WhatsApp with local midwives based on your region and language preferences.
              </p>
            </div>

            <form onSubmit={submitPatientTriageAndMatch} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Your Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g., Efua Serwah" 
                  className="w-full bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-800 outline-none focus:border-[#795900] font-semibold text-sm" 
                  value={patientForm.name} 
                  onChange={e => setPatientForm(p => ({ ...p, name: e.target.value }))} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Contact WhatsApp Number</label>
                <div className="relative flex items-center bg-white border border-gray-200 focus-within:border-[#795900] rounded-xl px-3 py-1">
                  <span className="text-gray-400 font-bold text-xs shrink-0 mr-1">+233</span>
                  <input 
                    type="tel" 
                    required 
                    placeholder="e.g., 244123456" 
                    className="w-full bg-transparent border-none text-gray-800 text-sm font-semibold outline-none py-2" 
                    value={patientForm.phone} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPatientForm(p => ({ ...p, phone: val }));
                    }} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-bold">Your Region in Ghana</label>
                <select 
                  className="w-full bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-800 outline-none focus:border-[#795900] font-black text-xs"
                  value={patientForm.region}
                  onChange={e => setPatientForm(p => ({ ...p, region: e.target.value }))}
                >
                  <option value="Ashanti">Ashanti Region</option>
                  <option value="Greater Accra">Greater Accra Region</option>
                  <option value="Central">Central Region</option>
                  <option value="Western">Western Region</option>
                  <option value="Northern">Northern Region</option>
                  <option value="Volta">Volta Region</option>
                  <option value="Eastern">Eastern Region</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingCheckIn}
                style={{ backgroundColor: '#795900' }}
                className="w-full text-white h-14 rounded-2xl font-black text-xs uppercase tracking-widest mt-2 hover:brightness-95 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none"
              >
                {isSubmittingCheckIn ? (
                  <span className="animate-pulse">Matching Midwife...</span>
                ) : (
                  <>Connect Me Now</>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Slide-over custom sheet drawer for Registered GHS Clinics */}
      <AnimatePresence>
        {showClinics && renderClinicsDrawer()}
      </AnimatePresence>
    </div>
  );
}
