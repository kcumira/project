import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="absolute bottom-0 z-40 w-full bg-white border-t border-slate-100 pb-8 pt-3 px-4">
      <div className="flex justify-between items-center">
        <Link to="/dashboard" className="flex flex-col items-center gap-1 w-[60px] group">
          <div className={`p-1.5 rounded-full ${path === '/dashboard' ? 'bg-primary/20 text-orange-600' : 'group-hover:bg-primary/5 text-slate-400'}`}>
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: path === '/dashboard' ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
          </div>
          <span className={`text-[10px] uppercase tracking-tight ${path === '/dashboard' ? 'font-bold text-orange-600' : 'font-medium text-slate-400'}`}>Home</span>
        </Link>
        <Link to="/map" className="flex flex-col items-center gap-1 w-[60px] group">
          <div className={`p-1.5 rounded-full ${path === '/map' ? 'bg-primary/20 text-orange-600' : 'group-hover:bg-primary/5 text-slate-400'}`}>
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: path === '/map' ? "'FILL' 1" : "'FILL' 0" }}>map</span>
          </div>
          <span className={`text-[10px] uppercase tracking-tight ${path === '/map' ? 'font-bold text-orange-600' : 'font-medium text-slate-400'}`}>Maps</span>
        </Link>
        <Link to="/recipes" className="flex flex-col items-center gap-1 w-[60px] group">
          <div className={`p-1.5 rounded-full ${path === '/recipes' ? 'bg-primary/20 text-orange-600' : 'group-hover:bg-primary/5 text-slate-400'}`}>
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: path === '/recipes' ? "'FILL' 1" : "'FILL' 0" }}>menu_book</span>
          </div>
          <span className={`text-[10px] uppercase tracking-tight ${path === '/recipes' ? 'font-bold text-orange-600' : 'font-medium text-slate-400'}`}>Recipes</span>
        </Link>
        <Link to="/impact" className="flex flex-col items-center gap-1 w-[60px] group">
          <div className={`p-1.5 rounded-full ${path === '/impact' ? 'bg-primary/20 text-orange-600' : 'group-hover:bg-primary/5 text-slate-400'}`}>
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: path === '/impact' ? "'FILL' 1" : "'FILL' 0" }}>person</span>
          </div>
          <span className={`text-[10px] uppercase tracking-tight ${path === '/impact' ? 'font-bold text-orange-600' : 'font-medium text-slate-400'}`}>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
