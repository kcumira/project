import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const steps = [
  {
    title: 'Smart Inventory\nManagement',
    description: 'Easily track your food inventory using AI-powered image recognition and color-coded expiration alerts.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2FTUMxvJUbmZ9JZK3iPGKiGpzOKMNfSly9W8AB49wnOtzz768zGXdboiztRmLkZUsowos-fL65gd3_oeO3nQEMl-rKK79MYJZJRRBAx-AgBgL9EuAJ5V87j1WtcpOVWxca-kPbH0mFoTFKHK-YhvYvJtuPu3l79Z5KtAtN0A5A8nYECVj848RKicAuWXyDTS2W1Is4Z3udEIvfGrR09g3KQOlNBJXpUH3QcREQjTg8UjwtdjD24bKWFBjuk_zLi5TLGK1RXkYa-7V',
    overlay: (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] bg-white/90 backdrop-blur-md p-3 rounded-2xl flex items-center gap-3 shadow-xl border border-white/20">
        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center shrink-0 text-green-600">
          <span className="material-symbols-outlined text-xl">check_circle</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800">Fresh Avocados</span>
          <span className="text-[10px] font-medium text-slate-500">Exp: 5 days left</span>
        </div>
        <div className="ml-auto bg-green-500 h-2 w-2 rounded-full animate-pulse"></div>
      </div>
    )
  },
  {
    title: 'AI Recipe\nSuggestions',
    description: 'Get personalized recipe ideas based on what you have, prioritizing ingredients that need to be used soon.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMdG0V9LZ9D2XDeSY2r44VZJON9jM3OFQTii6I15DonB0QBGWAhjann8Q1BrhT5xbzkq4776MEEFY1x6uDZxez27I-5YoOufecGpaBdPtsLapyNjByz624yTTnkz62O5KjUESMGNKT-zY_ecdJZfAOHKX76nQJF7ZKNI2Jlq-3pq6Buq8dbh2w0uhlbe8j4NB00RmfAAJGjWqXNoUEdn24kHTAVtU-P6P2XGyCXMpNObETAVeEm0ehr7kyKHyepBIC0-i3evrpGrrl',
    overlay: (
      <>
        <div className="absolute -top-4 -right-4 bg-white p-4 rounded-full shadow-lg border-4 border-[#f8f7f5] flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[40px]">chef_hat</span>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow-xl border border-primary/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl animate-spin-slow">auto_awesome</span>
          <span className="text-sm font-bold text-primary tracking-wide">AI CHEF</span>
        </div>
      </>
    )
  },
  {
    title: 'Community\nSharing Map',
    description: 'Share surplus food with your neighbors and reduce waste together through our local exchange map.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkqcy8LGNg9ZfXGLnPjyHK6d9W8dVmxh5In6RFv01g6LnAc1Zq_J1BvLHdm9ATKfTymgwrXPyLrDkBqxlinfqf3TKEExBJqIq9Nt0RZ2PuG4zwHjRkpbvmnQ7bDmftPsgr4RB79ICRlTcJwz00RZEmYRe1V9CR5ieKjhvucetAXsXYVim9TOiDA-mrbljTgh2IgVbRFet1DcGskDaER9AFnHV6KBQrAfIYU6D37YfYqegBWqd5GGOk4AjRburaMYq4KE3EtNb5Y427',
    overlay: (
      <>
        <div className="absolute top-[20%] left-[20%] z-20 animate-bounce" style={{ animationDuration: '3s' }}>
          <div className="text-primary drop-shadow-md">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          </div>
        </div>
        <div className="absolute top-[35%] right-[25%] z-20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>
          <div className="text-primary drop-shadow-md">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          </div>
        </div>
        <div className="absolute bottom-[10%] left-[50%] -translate-x-1/2 z-20 bg-white p-3 rounded-full shadow-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl">shopping_basket</span>
        </div>
      </>
    )
  },
  {
    title: 'Earn Rewards &\nSave Earth',
    description: 'Earn points for every item saved and see your tangible impact on CO2 reduction.',
    image: '',
    overlay: (
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          <div className="w-48 h-48 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-full flex items-center justify-center shadow-lg border border-yellow-200">
            <span className="material-symbols-outlined text-[100px] text-yellow-500 drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300" }}>
              emoji_events
            </span>
          </div>
          <div className="absolute -right-2 -bottom-2 bg-white p-2 rounded-full shadow-md border border-neutral-200 flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <span className="material-symbols-outlined text-2xl">eco</span>
            </div>
          </div>
          <div className="absolute -left-4 top-10 bg-white py-1.5 px-3 rounded-xl shadow-md border border-neutral-200 flex items-center gap-2 transform -rotate-12">
            <span className="material-symbols-outlined text-orange-500 text-xl">egg_alt</span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Egg Hunter</span>
          </div>
          <span className="material-symbols-outlined absolute -top-4 right-0 text-yellow-400 text-3xl animate-pulse">spark</span>
          <span className="material-symbols-outlined absolute bottom-4 -left-6 text-primary text-2xl animate-pulse" style={{ animationDelay: '500ms' }}>star</span>
        </div>
      </div>
    )
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/login');
    }
  };

  const step = steps[currentStep];

  return (
    <div className="flex flex-col h-full bg-[#f8f7f5] relative">
      <div className="flex items-center justify-end p-6 pt-8 z-10">
        <button onClick={() => navigate('/login')} className="text-slate-500 hover:text-primary transition-colors">
          <span className="text-sm font-bold tracking-wide">Skip</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center"
          >
            {currentStep < 3 ? (
              <div className="w-full relative aspect-[4/5] max-h-[50vh] mb-8 rounded-3xl overflow-hidden shadow-lg bg-white ring-1 ring-black/5 flex items-center justify-center">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="w-full h-full bg-center bg-cover absolute inset-0" style={{ backgroundImage: `url('${step.image}')` }} />
                {step.overlay}
              </div>
            ) : (
              <div className="relative w-full aspect-square max-w-[320px] flex items-center justify-center mb-8">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl transform scale-90"></div>
                <div className="absolute top-10 right-10 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl"></div>
                {step.overlay}
              </div>
            )}

            <div className="flex flex-col items-center text-center max-w-xs mx-auto">
              <div className="flex flex-row items-center justify-center gap-2 mb-6">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentStep ? 'w-8 bg-primary shadow-sm shadow-primary/50' : 'w-2 bg-slate-300'
                    }`}
                  />
                ))}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-slate-900 mb-4 whitespace-pre-line">
                {step.title}
              </h1>
              <p className="text-slate-500 text-base font-medium leading-relaxed px-2">
                {step.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 pb-10 w-full bg-gradient-to-t from-[#f8f7f5] via-[#f8f7f5] to-transparent">
        <button
          onClick={handleNext}
          className="w-full group relative flex items-center justify-center py-4 px-6 bg-primary hover:bg-orange-600 text-white rounded-full transition-all duration-300 shadow-lg shadow-primary/30 active:scale-[0.98]"
        >
          <span className="text-lg font-bold tracking-wide mr-2">
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </span>
          {currentStep < steps.length - 1 && (
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
          )}
        </button>
        {currentStep === steps.length - 1 && (
          <div className="flex items-center justify-center gap-1 mt-4">
            <span className="text-slate-500 text-sm font-medium">Already have an account?</span>
            <button onClick={() => navigate('/login')} className="text-primary hover:text-orange-600 text-sm font-bold transition-colors">
              Log In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
