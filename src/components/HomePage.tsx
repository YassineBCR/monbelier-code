import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, ChevronRight, 
  Shield, Store, CheckCircle2, Clock, Lock, ShoppingBag,
  LogOut, ChevronDown, LayoutDashboard, MapPin, MoonStar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Icone Mosquée pour le logo
const MosqueIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 20h20" />
    <path d="M6 20v-7a6 6 0 1 1 12 0v7" />
    <path d="M12 7V3" />
    <path d="M9 13h6v7H9z" />
    <path d="M4 20V10" />
    <path d="M20 20V10" />
  </svg>
);

export function HomePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
    navigate('/');
  };

  const displayName = profile?.nom || user?.email || '';

  const getDashboardRoute = (role?: string) => {
    switch (role) {
      case 'admin': return '/admin/global';
      case 'abattoir': return '/abattoir';
      case 'livreur': return '/livreur';
      case 'mosquee_admin': return '/mosquee';
      default: return '/reservation'; 
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'abattoir': return 'Abattoir';
      case 'livreur': return 'Livreur';
      case 'mosquee_admin': return 'Admin Mosquée';
      default: return 'Client';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 selection:bg-amber-200 selection:text-green-900 font-sans">

      {/* NAVIGATION BAR */}
      <nav className="bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-50 border-b border-amber-200/40 shadow-sm font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">

            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-green-800 p-2 rounded-xl shadow-lg shadow-green-900/20 group-hover:scale-105 transition-transform">
                <MosqueIcon className="h-7 w-7 text-amber-400" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-green-950 to-green-800 bg-clip-text text-transparent uppercase tracking-tighter">
                Mon Bélier
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4 font-sans">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-green-900/5 text-green-900 px-4 py-2.5 rounded-full font-bold hover:bg-green-900/10 transition-all border border-green-900/10"
                  >
                    <div className="w-7 h-7 bg-green-800 rounded-full flex items-center justify-center text-amber-400 text-xs font-black shadow-inner">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[140px] truncate text-sm">
                      {displayName}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                      <div className="px-5 py-4 border-b border-slate-50 bg-[#FAF7F2]/50">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Compte</p>
                        <p className="text-sm text-slate-800 font-bold truncate">{user.email}</p>
                        <span className="inline-block mt-2 text-[10px] px-2.5 py-1 rounded-full font-black bg-amber-100 text-amber-700 uppercase tracking-tight">
                          {getRoleLabel(profile?.role)}
                        </span>
                      </div>

                      <div className="p-2">
                        <button
                          onClick={() => { navigate(getDashboardRoute(profile?.role)); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-green-50 hover:text-green-900 rounded-xl transition-colors font-bold"
                        >
                          <LayoutDashboard className="h-4 w-4 text-amber-600" />
                          {profile?.role === 'client' || !profile?.role ? 'Mes Commandes' : 'Tableau de bord'}
                        </button>

                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold mt-1"
                        >
                          <LogOut className="h-4 w-4" />
                          Se déconnecter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center space-x-2 text-green-950 hover:text-green-800 px-4 py-2 rounded-full font-bold transition-colors text-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Se connecter</span>
                </button>
              )}

              <button
                onClick={() => navigate('/reservation')}
                className="bg-green-800 text-white px-8 py-2.5 rounded-full font-black hover:bg-green-900 transition-all shadow-xl shadow-green-900/20 active:scale-95 border border-amber-500/20 text-sm uppercase tracking-tight"
              >
                Réserver
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Titre réduit et structuré en 3 lignes */}
      <section className="relative pt-20 pb-20 lg:pt-28 lg:pb-36 z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-100/50 via-transparent to-transparent -z-10 font-sans"></div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center font-sans">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-900/5 border border-green-900/10 text-green-950 font-black text-xs uppercase tracking-[0.2em] mb-12 shadow-sm font-sans">
            <span className="relative flex h-2 w-2 font-sans">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
            </span>
            Aïd Al-Adha 2026 : Réservations Ouvertes
          </div>

          <h2 className="text-4xl lg:text-7xl font-black text-green-950 mb-10 leading-[1.1] tracking-tighter uppercase font-sans">
            Votre sacrifice <br />
            <span className="text-amber-700">Aid Al Adha</span> <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-900 via-amber-600 to-green-800 relative">
              en partenariat avec votre mosquée
              <svg className="absolute w-full h-3 -bottom-3 left-0 text-amber-500/30" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 Q 50 20 100 10" fill="transparent" stroke="currentColor" strokeWidth="6" />
              </svg>
            </span>
          </h2>

          <p className="text-lg lg:text-xl text-slate-700 mb-16 max-w-3xl mx-auto leading-relaxed font-medium">
            Célébrez l'Aïd avec sérénité. 
            Agneau français avec <span className="text-green-800 font-black uppercase tracking-tight">sacrifice manuel garanti</span>. 
            Réservez et soutenez votre mosquée de proximité.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-stretch sm:items-center font-sans">
            <div className="flex flex-col items-center">
              <button
                onClick={() => navigate('/reservation')}
                className="group relative px-12 py-6 bg-green-800 text-white rounded-2xl text-xl font-black hover:bg-green-900 transition-all transform hover:-translate-y-1.5 shadow-[0_25px_60px_rgba(6,78,59,0.3)] overflow-hidden font-sans uppercase tracking-widest"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <span className="relative flex items-center gap-3">
                  JE RÉSERVE MAINTENANT <ChevronRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                </span>
              </button>

              {!user && (
                <span className="mt-5 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2 font-sans">
                  <Lock className="w-3.5 h-3.5 text-amber-600" /> Connexion requise
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-5 text-green-950 font-medium px-10 py-6 bg-white rounded-[2rem] border-2 border-amber-200/60 shadow-2xl shadow-amber-900/10 h-full relative font-sans">
               <div className="absolute -top-4 -right-4 bg-amber-400 text-green-950 text-xs font-black px-3 py-1.5 rounded-xl rotate-12 shadow-md border border-amber-500 animate-pulse font-sans">OFFRE</div>
              <span className="text-5xl font-black font-sans">350€</span>
              <div className="text-xs leading-tight text-left border-l-2 border-amber-300 pl-5 font-black opacity-80 uppercase tracking-tighter font-sans">
                Prix unique<br/><span className="text-green-800 text-lg">Tout inclus</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="details" className="py-28 relative z-10 border-t border-amber-100/40 bg-[#FAF7F2]/60 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24 font-sans">
            <h3 className="text-4xl lg:text-5xl font-black text-green-950 mb-6 tracking-tight uppercase font-sans">L'excellence au service du culte</h3>
            <p className="text-slate-600 max-w-2xl mx-auto font-bold text-lg leading-relaxed font-sans">Un processus rigoureux pour garantir le respect du rite et le soutien à votre mosquée.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 font-sans">
            <FeatureCard icon={<Shield className="h-8 w-8 text-green-800 font-sans" />} title="Sacrifice Manuel" description="Agneau français garanti conforme au rite musulman et sacrifié en France." />
            <FeatureCard icon={<Store className="h-8 w-8 text-amber-600 font-sans" />} title="Retrait Direct" description="Sur réservation : récupérez votre commande sur place dans votre mosquée." />
            <FeatureCard icon={<CheckCircle2 className="h-8 w-8 text-green-800 font-sans" />} title="Traçabilité" description="Suivi en temps réel par QR Code pour une identification parfaite de votre sacrifice." />
            <FeatureCard icon={<MapPin className="h-8 w-8 text-amber-600 font-sans" />} title="Proximité" description="Point de retrait : Grande Mosquée Ibn Rochd de Montpellier et partenaires." />
          </div>
        </div>
      </section>

      {/* STEPS SECTION */}
      <section className="py-28 relative z-10 bg-green-950 text-[#FAF7F2] overflow-hidden mt-12 rounded-t-[5rem] shadow-[0_-30px_70px_rgba(6,78,59,0.2)] font-sans">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 font-sans"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] font-sans"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 font-sans">
          <div className="text-center mb-24 font-sans">
            <h3 className="text-4xl lg:text-6xl font-black mb-6 tracking-tight uppercase font-sans">Organisation du Jour J</h3>
            <p className="text-green-100/60 max-w-2xl mx-auto font-black uppercase text-sm tracking-[0.3em] font-sans">Simplicité • Sécurité • Sérénité</p>
          </div>
          <div className="grid md:grid-cols-3 gap-16 font-sans">
            <Step number="1" title="Réservez en ligne" description="Choisissez votre mosquée de retrait et effectuez votre paiement de 350€." />
            <Step number="2" title="Suivi en direct" description="Recevez des notifications pour chaque étape de la préparation de votre agneau." />
            <Step number="3" title="Retrait sur place" description="Présentez votre QR Code à la mosquée le jour de l'Aïd pour récupérer votre commande." />
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-28 relative z-10 bg-gradient-to-br from-green-900 to-green-800 text-white border-t border-amber-500/20 font-sans">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center font-sans">
          <h3 className="text-5xl font-black mb-8 italic tracking-tight font-sans">Prêt à fêter l'Aïd ?</h3>
          <p className="text-2xl mb-14 text-green-50/90 font-bold max-w-2xl mx-auto leading-relaxed font-sans">
            Participez au soutien de votre mosquée et simplifiez l'organisation de votre sacrifice cette année.
          </p>
          <div className="flex flex-col items-center font-sans">
            <button
              onClick={() => navigate('/reservation')}
              className="bg-amber-500 text-green-950 px-12 py-5 rounded-[2rem] text-2xl font-black hover:bg-amber-400 transition-all transform hover:scale-105 shadow-[0_20px_50px_rgba(245,158,11,0.4)] uppercase tracking-tight font-sans"
            >
              Je réserve maintenant
            </button>
            <p className="mt-8 text-green-100/80 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 font-sans">
              <MoonStar className="w-5 h-5 text-amber-400 font-sans" /> Eid Mubarak
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-green-950 text-[#FAF7F2]/40 py-20 relative z-10 border-t border-white/5 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center space-x-4 group cursor-default">
              <div className="bg-green-900 p-3 rounded-2xl border border-white/10 group-hover:border-amber-500/30 transition-all font-sans">
                <MosqueIcon className="h-8 w-8 text-amber-500 font-sans" />
              </div>
              <span className="font-black text-white text-3xl tracking-tighter uppercase font-sans">Mon Bélier</span>
            </div>
            <div className="text-center md:text-right space-y-5 font-sans">
              <p className="text-base font-black text-green-100/70 tracking-tight font-sans uppercase">
                Service de réservation pour l'Aïd Al-Adha • Retrait en Mosquée
              </p>
              <div className="flex justify-center md:justify-end gap-8 text-xs font-black uppercase tracking-widest text-amber-500/70 font-sans">
                <a href="#" className="hover:text-white transition-colors underline decoration-amber-500/20 underline-offset-4 font-sans">Mentions Légales</a>
                <a href="#" className="hover:text-white transition-colors underline decoration-amber-500/20 underline-offset-4 font-sans">CGV</a>
                <a href="http://www.monbelier.fr" className="hover:text-white transition-colors font-sans">monbelier.fr</a>
              </div>
              <p className="text-[11px] mt-6 font-bold opacity-40 font-sans uppercase">
                © 2026 Mon Bélier. Tous droits réservés. En partenariat avec la Grande Mosquée Ibn Rochd.
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white border border-amber-100/50 p-10 rounded-[3rem] shadow-2xl shadow-amber-900/5 hover:-translate-y-2 transition-all duration-500 group flex flex-col items-center text-center font-sans">
      <div className="bg-gradient-to-br from-[#FAF7F2] to-amber-50 w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm border border-amber-100 group-hover:scale-110 group-hover:bg-amber-100 transition-all duration-500 font-sans">
        {icon}
      </div>
      <h4 className="text-2xl font-black text-green-950 mb-4 tracking-tight uppercase font-sans">{title}</h4>
      <p className="text-slate-500 leading-relaxed font-bold text-sm opacity-80 font-sans">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3.5rem] hover:bg-white/10 transition-all duration-500 group font-sans">
      <div className="text-[12rem] font-black text-amber-500/5 absolute -top-16 -right-6 group-hover:scale-110 group-hover:-translate-y-6 transition-transform duration-700 pointer-events-none select-none font-sans">
        {number}
      </div>
      <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 text-green-950 rounded-2xl text-3xl font-black mb-10 shadow-[0_15px_35px_rgba(245,158,11,0.4)] font-sans">
        {number}
      </div>
      <h4 className="text-3xl font-black text-white mb-5 tracking-tight relative z-10 font-sans uppercase">{title}</h4>
      <p className="text-green-100/50 leading-relaxed font-bold text-base relative z-10 font-sans">{description}</p>
    </div>
  );
}