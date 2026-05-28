/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
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
  X
} from 'lucide-react';
import { translations } from './translations';
import { AppState, Language, ChatMessage, RiskLevel } from './types';

export default function App() {
  const [state, setState] = useState<AppState>({
    screen: 'start',
    language: 'english',
    currentQuestionIndex: -1, // -1 means intro
    answers: {},
    riskLevel: null,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

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
    setMessages(prev => [
      ...prev,
      { id: Math.random().toString(), sender: 'ama', text, timestamp: new Date() }
    ]);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      { id: Math.random().toString(), sender: 'user', text, timestamp: new Date() }
    ]);
  };

  const fetchAmaResponse = async (
    nextIndex: number,
    currentAnswers: Record<number, any>,
    userJustAnsweredIndex: number,
    userJustAnsweredValue: any
  ): Promise<string> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

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
      if (data && data.text) {
        return data.text;
      }
      throw new Error('Invalid response data');
    } catch (err) {
      console.warn("Falling back to predefined question due to error:", err);
      let fallbackText = '';
      if (userJustAnsweredIndex === 1 && userJustAnsweredValue === true) {
        fallbackText += translations[state.language].emotionalQ2 + " ";
      }
      if (userJustAnsweredIndex === 2 && userJustAnsweredValue === true) {
        fallbackText += translations[state.language].emotionalQ3 + " ";
      }
      fallbackText += translations[state.language].questions[nextIndex];
      return fallbackText;
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
      const amaResponseText = await fetchAmaResponse(finalNextIndex, newAnswers, currentQIdx, value);
      setIsTyping(false);
      addAmaMessage(amaResponseText);
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

  const calculateRisk = (answers: Record<number, any>) => {
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
    
    // Transistion from loading to result after 2s
    setTimeout(() => {
      setState(prev => ({ ...prev, screen: 'result' }));
    }, 2000);
  };

  const renderStart = () => (
    <div className="min-h-screen bg-primary-container flex flex-col items-center justify-between p-6">
      <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-white p-6 rounded-full shadow-xl"
        >
          <Heart className="w-12 h-12 text-primary" fill="currentColor" />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">{t.welcomeTitle}</h1>
          <p className="text-white/80 text-lg uppercase tracking-wider text-sm">{t.welcomeSubtitle}</p>
        </div>
        <div className="w-full max-w-xs aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white/20">
          <img 
            src="/src/assets/images/regenerated_image_1778544299200.png" 
            alt="Ghanaian Mother" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      </div>
      <div className="w-full space-y-6 pb-8">
        <button 
          id="btn-start"
          onClick={handleStart}
          className="w-full bg-white text-primary h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:bg-white/90 active:scale-95 transition-all"
        >
          {t.start}
          <ChevronRight className="w-6 h-6" />
        </button>
        <div className="flex justify-center items-center gap-2 text-white/60">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] uppercase font-bold tracking-widest">{t.trust}</span>
        </div>
      </div>
    </div>
  );

  const renderLanguageSelect = () => (
    <div className="min-h-screen bg-surface flex flex-col p-6">
      <div className="pt-12 text-center space-y-8">
        <div className="inline-flex p-5 bg-secondary-container rounded-full">
          <Globe className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-primary">{t.selectLanguage}</h2>
          <p className="text-on-surface-variant">Choose the language you are most comfortable with.</p>
        </div>
      </div>
      <div className="mt-12 space-y-4">
        {(['english', 'twi', 'ga'] as Language[]).map(lang => (
          <button
            key={lang}
            id={`lang-${lang}`}
            onClick={() => handleLanguageSelect(lang)}
            className="w-full bg-white border-2 border-outline-variant p-6 rounded-2xl flex items-center justify-between group hover:border-primary active:scale-[0.98] transition-all"
          >
            <span className="text-xl font-bold text-on-surface capitalize">{lang}</span>
            <div className="w-8 h-8 rounded-full border-2 border-outline-variant group-hover:border-primary group-hover:bg-primary-container flex items-center justify-center transition-colors">
              <div className="w-3 h-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 bg-white border-b border-outline-variant shadow-sm z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border border-outline-variant">
               <User className="text-primary w-6 h-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#340042]">Ama</h3>
            <p className="text-[10px] text-green-700 font-black uppercase tracking-wider">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container/30 rounded-full border border-primary/10">
           <Heart className="w-4 h-4 text-primary" fill="currentColor" />
           <span className="font-black text-primary text-xs tracking-tight">MamaMatch GH</span>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-6 space-y-6">
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30 flex items-start gap-4 shadow-sm">
          <AlertCircle className="w-6 h-6 text-primary shrink-0" />
          <p className="text-sm font-bold text-on-surface-variant leading-relaxed">
            {(t as any).infoNote}
          </p>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'ama' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-md ${
                msg.sender === 'ama' 
                  ? 'bg-white rounded-bl-none border-l-4 border-primary' 
                  : 'bg-secondary-container rounded-br-none border-r-4 border-primary'
              }`}>
                <p 
                  className="text-base md:text-lg font-medium leading-relaxed"
                  style={{ color: '#070707' }}
                >
                  {msg.text}
                </p>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white rounded-2xl rounded-bl-none border-l-4 border-primary px-5 py-3 shadow-md flex items-center gap-1.5">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </main>

      <footer className="p-6 bg-white border-t border-outline-variant">
        {state.currentQuestionIndex === -1 && (
          <button 
            id="chat-start"
            onClick={async () => {
              addUserMessage(t.start);
              setState(prev => ({ ...prev, currentQuestionIndex: 0 }));
              setIsTyping(true);
              const text = await fetchAmaResponse(0, {}, -1, null);
              setIsTyping(false);
              addAmaMessage(text);
            }}
            className="w-full bg-white border-2 border-primary h-14 rounded-xl font-black shadow-lg active:scale-95 transition-all text-xl"
            style={{ color: '#161515' }}
          >
            {t.start}
          </button>
        )}

        {state.currentQuestionIndex === 0 && (
          <div className="grid grid-cols-2 gap-3">
             {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
               <button 
                 key={n}
                 onClick={() => handleAnswer(n, `${n} Weeks`)}
                 className="bg-surface-container-low p-3 rounded-lg font-black text-on-surface border-2 border-outline-variant hover:border-primary"
               >
                 {n}
               </button>
             ))}
             <input 
               type="number" 
               placeholder="More..." 
               className="p-3 bg-surface-container-low rounded-lg border-2 border-outline-variant focus:border-primary outline-none font-bold"
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   const val = (e.currentTarget.value);
                   handleAnswer(val, `${val} Weeks`);
                 }
               }}
             />
          </div>
        )}

        {state.currentQuestionIndex > 0 && state.currentQuestionIndex < 10 && (
          <div className="space-y-3">
            <button 
              id="ans-yes"
              onClick={() => handleAnswer(true, t.yes)}
              className="w-full bg-white border-2 border-outline-variant h-14 rounded-xl font-bold"
              style={{ color: '#000000' }}
            >
              {t.yes}
            </button>
            <button 
              id="ans-no"
              onClick={() => handleAnswer(false, t.no)}
              className="w-full bg-white border-2 border-outline-variant h-14 rounded-xl font-bold"
              style={{ color: '#000000' }}
            >
              {t.no}
            </button>
          </div>
        )}
      </footer>
    </div>
  );

  const renderLoading = () => (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 space-y-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      >
        <Loader2 className="w-16 h-16 text-primary" />
      </motion.div>
      <p className="text-xl font-bold text-primary animate-pulse">{t.calculating}</p>
    </div>
  );

  const renderResult = () => {
    const risk = state.riskLevel || 'LOW';
    const config = {
      LOW: { icon: CheckCircle2, bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', btn: t.lowRiskBtn, msg: t.lowRiskMsg, iconColor: 'text-green-500' },
      MEDIUM: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', btn: t.mediumRiskBtn, msg: t.mediumRiskMsg, iconColor: 'text-amber-500' },
      HIGH: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', btn: t.highRiskBtn, msg: t.highRiskMsg, iconColor: 'text-red-500' }
    }[risk];

    return (
      <div className="min-h-screen bg-surface p-6 flex flex-col items-center justify-center">
        <header className="absolute top-0 w-full p-6 flex justify-between items-center">
           <Heart className="text-primary w-8 h-8" />
           <button onClick={() => setState(prev => ({...prev, screen: 'start'}))} className="p-2 hover:bg-surface-container-low rounded-full">
             <X className="w-6 h-6 text-on-surface-variant" />
           </button>
        </header>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-sm rounded-[32px] border-l-[12px] ${config.border} ${config.bg} shadow-xl overflow-hidden`}
        >
          <div className="p-8 space-y-6">
             <div className={`${config.iconColor} bg-white w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner`}>
                <config.icon className="w-12 h-12" />
             </div>
             <div className="space-y-2">
                <h2 className={`text-3xl font-bold ${config.text} tracking-tight capitalize`}>
                  {risk.toLowerCase()} Risk
                </h2>
                <p className={`text-lg leading-relaxed ${config.text} opacity-90`}>
                  {config.msg}
                </p>
             </div>
          </div>
        </motion.div>

        <button 
          onClick={() => {
            if (risk === 'LOW') {
               // Demo link or logic
               alert("Finding clinics...");
            } else {
               setState(prev => ({ ...prev, screen: 'nurse-match' }));
            }
          }}
          className={`mt-12 w-full max-w-sm h-16 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all text-white ${
            risk === 'LOW' ? 'bg-green-600' : risk === 'MEDIUM' ? 'bg-amber-600' : 'bg-red-600'
          }`}
        >
          {config.btn}
        </button>
      </div>
    );
  };

  const renderNurseMatch = () => (
    <div className="min-h-screen bg-[#F3E5F5] p-6 flex flex-col items-center">
      <header className="w-full flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
           <Heart className="text-primary w-6 h-6" />
           <h1 className="font-bold text-primary">MamaMatch GH</h1>
        </div>
        <button className="relative">
           <MessageCircle className="text-primary w-6 h-6" />
           <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="bg-primary h-32 relative flex justify-center">
           <div className="absolute -bottom-12 w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-primary-container">
             <img 
               src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=2574&auto=format&fit=crop" 
               alt="Nurse Abena" 
               className="w-full h-full object-cover"
             />
           </div>
        </div>

        <div className="pt-16 pb-8 px-8 text-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-on-surface">{(t as any).nurseName}</h2>
            <div className="flex items-center justify-center gap-1 text-on-surface-variant">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-bold">Region: {(t as any).region}</span>
            </div>
          </div>

          <div className="flex gap-2 justify-center">
             <span className="bg-secondary-container px-3 py-1.5 rounded-full text-xs font-black text-primary border border-primary/10">
               Languages: {(t as any).languagesLabel}
             </span>
          </div>

          <div className="flex items-center justify-center gap-2 text-green-600">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-xs font-black uppercase tracking-widest">{(t as any).availability}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="bg-surface-container rounded-2xl p-4 space-y-1 border border-outline-variant/30">
                <Clock className="w-5 h-5 text-primary mx-auto" />
                <p className="text-[10px] font-black uppercase text-outline">Experience</p>
                <p className="text-xs font-black text-on-surface">{(t as any).expYears}</p>
             </div>
             <div className="bg-surface-container rounded-2xl p-4 space-y-1 border border-outline-variant/30">
                <ShieldCheck className="w-5 h-5 text-primary mx-auto" />
                <p className="text-[10px] font-black uppercase text-outline">Role</p>
                <p className="text-xs font-black text-on-surface">{(t as any).experience}</p>
             </div>
          </div>

          <a 
            href="https://wa.me/233XXXXXXXXX" 
            target="_blank" 
            rel="noreferrer"
            className="block w-full bg-[#25D366] text-white h-16 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg hover:brightness-95 transition-all text-lg"
          >
             <MessageCircle className="w-6 h-6 fill-current" />
             {(t as any).whatsappBtn}
          </a>
        </div>
      </motion.div>
      
      <button 
        onClick={() => setState(prev => ({...prev, screen: 'start'}))}
        className="mt-8 text-on-surface-variant font-black text-sm underline underline-offset-8 decoration-primary/30"
      >
        Back to Home
      </button>
    </div>
  );

  return (
    <div className="min-h-screen font-sans">
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
    </div>
  );
}
