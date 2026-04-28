import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { getFoodCategoryMeta } from '../data/foodCategories';
import { getCurrentUser } from '../lib/auth';

export interface ExpiringItem {
  inventoryId: number;
  name: string;
  daysLeft: number;
  imageUrl: string | null;
  quantity?: number | null;
  unit?: string | null;
}

export interface InventoryItem {
  inventoryId: number;
  name: string;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  daysLeft: number | null;
  status: string | null;
}

export interface Recipe {
  id: number;
  title: string;
  matchPercentage: number;
  cookTime: number;
  calories: number;
  difficulty: string;
  imageUrl: string;
  savedIngredients: string[];
}

function parseRecipe(raw: any): Recipe {
  const cookTime =
    typeof raw.cookTime === 'number'
      ? raw.cookTime
      : Number(String(raw.cookTime || '20').replace(/[^\d]/g, '')) || 20;
  const calories =
    typeof raw.calories === 'number'
      ? raw.calories
      : Number(String(raw.calories || '0').replace(/[^\d]/g, '')) || 0;

  return {
    id: raw.id || Date.now(),
    title: raw.title || 'AI Recipe',
    matchPercentage: Number(raw.matchPercentage) || 85,
    cookTime,
    calories,
    difficulty: raw.difficulty || 'Medium',
    imageUrl: raw.imageUrl || '',
    savedIngredients: Array.isArray(raw.savedIngredients) ? raw.savedIngredients : [],
  };
}

export default function Recipes() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());

  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientMode, setIngredientMode] = useState<'auto' | 'manual'>('auto');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const [expiringRes, recommendedRes] = await Promise.all([
          fetch(`/api/recipes/expiring/${user.userId}`),
          fetch(`/api/recipes/recommended/${user.userId}`)
        ]);
        const inventoryRes = await fetch(`/api/inventory/${user.userId}`);

        if (expiringRes.ok) {
          const expiringData = await expiringRes.json();
          setExpiringItems(expiringData);
        }
        
        if (recommendedRes.ok) {
          const recommendedData = await recommendedRes.json();
          setRecipes((Array.isArray(recommendedData) ? recommendedData : []).map(parseRecipe));
        }

        if (inventoryRes.ok) {
          const inventoryData = await inventoryRes.json();
          setInventoryItems(inventoryData);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchData();
  }, [navigate, user]);

  const handleGenerate = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      const res = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.userId,
          preference: userInput.trim() || 'Suggest a practical recipe using my available ingredients.',
          selectedIngredients: ingredientMode === 'manual' && selectedIngredients.length > 0
            ? selectedIngredients
            : undefined,
        }),
      });

      if (res.status === 429) {
        alert('Chef AI 正在思考中，請求次數過多請稍後再試！ (Rate Limit: 429)');
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate recipe');
      }

      const newRecipe = parseRecipe(await res.json());
      setRecipes((prev) => [newRecipe, ...prev]);
      setUserInput('');
      setActiveFilter('All'); // Switch to All to show the newly generated recipe
    } catch (error: any) {
      console.error('Error generating recipe:', error);
      alert(`發生錯誤：${error.message || '無法生成食譜，請稍後再試！'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  };

  const filteredRecipes = recipes.filter(r => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Under 30m') return r.cookTime < 30;
    if (activeFilter === 'Vegetarian') {
      const text = `${r.title} ${r.savedIngredients.join(' ')}`.toLowerCase();
      const meats = ['meat', 'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'lamb', 'bacon', 'sausage'];
      return !meats.some(m => text.includes(m));
    }
    if (activeFilter === 'Dinner') {
      // Simple heuristic for dinner: slightly heavier calories or dinner keywords
      const dinnerWords = ['dinner', 'steak', 'chicken', 'pasta', 'stew', 'soup', 'roast', 'rice', 'noodle', 'curry', 'grill', 'bake', 'bowl', 'stir-fry'];
      const text = r.title.toLowerCase();
      if (r.calories >= 400) return true;
      return dinnerWords.some(w => text.includes(w));
    }
    return true;
  });

  const renderFilterBtn = (label: string, icon?: string) => {
    const isSelected = activeFilter === label;
    return (
      <button 
        key={label}
        onClick={() => setActiveFilter(label)}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm transition shadow-sm border ${
          isSelected 
            ? 'bg-primary text-white border-primary shadow-primary/20 font-bold' 
            : 'bg-white border-orange-100 text-[#8d6e63] font-medium hover:bg-orange-50 hover:text-primary'
        }`}
      >
        {icon && <span className="material-symbols-outlined text-lg">{icon}</span>}
        {label === 'All' && !icon ? 'All' : label}
      </button>
    );
  };

  return (
    <div className="bg-[#fff8f0] text-[#2d1b0e] flex flex-col h-full relative">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white/90 px-5 py-3 backdrop-blur-md border-b border-orange-100">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-orange-900">Chef AI</h1>
        </div>
        <button className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-50 text-[#2d1b0e] transition hover:bg-orange-100">
          <span className="material-symbols-outlined">tune</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth no-scrollbar">
        <section className="px-5 pt-6 pb-4">
          <h2 className="text-[28px] font-extrabold leading-tight mb-2 text-orange-950">What's cooking tonight?</h2>
          <p className="text-[#8d6e63] text-sm leading-relaxed">Use your expiring items to create these dishes.</p>
          
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white p-1.5 pl-2 shadow-sm border border-orange-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff3e0] text-primary">
              <span className={`material-symbols-outlined ${isGenerating ? 'animate-spin' : ''}`}>
                {isGenerating ? 'autorenew' : 'auto_awesome'}
              </span>
            </div>
            <input 
              type="text" 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isGenerating}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder={isGenerating ? "Chef AI is thinking..." : "Optional: spicy, quick dinner..."} 
              className="flex-1 min-w-0 bg-transparent border-none text-sm font-medium focus:ring-0 placeholder-orange-300 text-[#2d1b0e] disabled:opacity-50 outline-none"
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="shrink-0 rounded-xl bg-gradient-to-r from-primary to-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              Generate
            </button>
          </div>
        </section>

        <section className="mb-6 px-5">
          <div className="rounded-2xl bg-white border border-orange-100 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-orange-950">Ingredient Picker</h3>
                <p className="text-[11px] font-semibold text-[#8d6e63]">
                  {ingredientMode === 'auto'
                    ? 'Chef AI will choose from your inventory.'
                    : selectedIngredients.length > 0
                    ? `${selectedIngredients.length} selected`
                    : 'Select ingredients or switch back to auto.'}
                </p>
              </div>
              <div className="flex rounded-full bg-orange-50 p-1">
                {(['auto', 'manual'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setIngredientMode(mode)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-black capitalize transition-colors ${
                      ingredientMode === mode ? 'bg-primary text-white shadow-sm' : 'text-primary'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {inventoryItems.length > 0 ? (
                inventoryItems.map((item) => {
                  const meta = getFoodCategoryMeta(item.category);
                  const selected = selectedIngredients.includes(item.name);
                  return (
                    <button
                      key={item.inventoryId}
                      onClick={() => {
                        setIngredientMode('manual');
                        toggleIngredient(item.name);
                      }}
                      className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-all ${
                        selected && ingredientMode === 'manual'
                          ? 'border-primary bg-orange-50 text-primary'
                          : 'border-slate-100 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${meta.tone}`}>
                        <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                      </span>
                      <span className="max-w-24 truncate text-xs font-black">{item.name}</span>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm font-semibold text-slate-400">No inventory items yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="px-5 mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8d6e63]">Expiring Soon</h3>
            <button onClick={() => navigate('/dashboard')} className="text-xs font-semibold text-primary hover:text-orange-600 transition-colors">View All</button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar snap-x">
            {expiringItems.length > 0 ? (
              expiringItems.map((item) => (
                <div key={item.inventoryId} className="flex shrink-0 w-40 snap-start items-center gap-3 rounded-xl bg-white p-2 pr-3 shadow-sm border border-red-100">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-orange-300">
                        restaurant
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-[#2d1b0e] truncate">{item.name}</span>
                    <span className={`text-[10px] font-medium whitespace-nowrap ${item.daysLeft <= 2 ? 'text-red-500' : 'text-orange-500'}`}>
                      {item.daysLeft} days left
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 text-sm text-gray-400">Loading expiring items...</div>
            )}
          </div>
        </section>

        <section className="mb-5 flex gap-2 px-5 overflow-x-auto no-scrollbar">
          {renderFilterBtn('All')}
          {renderFilterBtn('Under 30m', 'timer')}
          {renderFilterBtn('Vegetarian', 'eco')}
          {renderFilterBtn('Dinner', 'restaurant')}
        </section>

        <section className="flex flex-col gap-6 px-5 pb-6">
          {recipes.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">restaurant_menu</span>
              <p>No saved recommendations yet.</p>
              <p className="mt-1 text-xs text-gray-400">Generate one with Chef AI above.</p>
            </div>
          ) : filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe, index) => (
              <div key={recipe.id || `recipe-${index}`} className="group relative overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:shadow-lg border border-orange-50">
                <div className="relative h-48 w-full">
                  <img src={recipe.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} alt={recipe.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 bg-gray-100" />
                  <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 backdrop-blur-md shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className={`material-symbols-outlined text-sm ${recipe.matchPercentage >= 90 ? 'text-primary' : 'text-yellow-500'}`}>verified</span>
                      <span className="text-xs font-bold text-[#2d1b0e]">{recipe.matchPercentage}% Match</span>
                    </div>
                  </div>
                  <div className="absolute left-3 bottom-3 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md text-white border border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#ffb74d]">schedule</span>
                      <span className="text-xs font-bold">{recipe.cookTime}m</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 pt-5">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="text-xl font-bold text-[#2d1b0e] leading-tight group-hover:text-primary transition-colors">{recipe.title}</h3>
                    <button className="text-orange-200 hover:text-red-500 transition-colors -mt-1 -mr-1 p-1">
                      <span className="material-symbols-outlined fill-current text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </button>
                  </div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-800 border border-orange-100">
                    <span className="material-symbols-outlined text-sm text-primary">recycling</span>
                    Saves: {recipe.savedIngredients.join(', ')}
                  </div>
                  <div className="flex items-center justify-between border-t border-orange-50 pt-3.5">
                    <div className="flex items-center gap-4 text-xs font-medium text-[#8d6e63]">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-orange-400">local_fire_department</span>
                        {recipe.calories} Kcal
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">signal_cellular_alt</span>
                        {recipe.difficulty}
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/recipe-detail/${recipe.id}`)}
                      className="flex items-center text-xs font-bold text-primary hover:underline decoration-2 underline-offset-2"
                    >
                      View Recipe <span className="material-symbols-outlined text-sm ml-0.5">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="text-center py-10 text-gray-500">
              <span className="material-symbols-outlined text-4xl mb-2 text-orange-200">search_off</span>
              <p>目前沒有符合條件的食譜</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
