import { useNavigate } from 'react-router-dom';
import { 
 LogIn, LayoutDashboard, ChevronRight, 
  Shield, Truck, CheckCircle2, Clock, Lock, ShoppingBag 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* 1. NAVIGATION BAR */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-emerald-600 p-2 rounded-xl">
                <Sheep className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
                Mon Bélier
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <button
                  onClick={() => navigate('/admin/global')}
                  className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-6 py-2.5 rounded-full font-medium hover:bg-emerald-100 transition-all border border-emerald-200"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Tableau de bord</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 px-4 py-2 rounded-full font-medium transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Se connecter</span>
                </button>
              )}
              
              <button
                onClick={() => navigate('/reservation')}
                className="bg-emerald-600 text-white px-8 py-2.5 rounded-full font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
              >
                Commander
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-emerald-200 text-emerald-800 font-bold text-sm mb-8 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            Réservations ouvertes pour l'Aïd 2024
          </div>

          <h2 className="text-5xl lg:text-7xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight">
            Votre sacrifice de l'Aïd, <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 relative">
              livré à domicile
              <svg className="absolute w-full h-4 -bottom-2 left-0 text-emerald-300/50" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 Q 50 20 100 10" fill="transparent" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
          </h2>

          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            L'alliance parfaite entre le respect du rite musulman et les normes françaises. 
            Profitez de l'Aïd en toute sérénité, nous nous occupons de tout jusqu'à votre porte à Montpellier.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="flex flex-col items-center">
              <button
                onClick={() => navigate('/reservation')}
                className="group relative px-8 py-4 bg-emerald-600 text-white rounded-2xl text-lg font-bold hover:bg-emerald-500 transition-all transform hover:-translate-y-1 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <span className="relative flex items-center gap-2">
                  Réserver mon agneau <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              {!user && (
                <span className="mt-3 text-sm text-slate-500 font-medium flex items-center gap-1.5 bg-white/50 px-4 py-1.5 rounded-full backdrop-blur-sm border border-slate-200/50 shadow-sm">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> Connexion requise pour commander
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-slate-600 font-medium px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm h-full">
              <span className="text-3xl font-black text-slate-800">360€</span>
              <div className="text-sm leading-tight text-left border-l-2 border-emerald-200 pl-3">
                Prix unique<br/><span className="text-emerald-600 font-bold">Tout inclus</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="details" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">L'excellence à chaque étape</h3>
            <p className="text-slate-600 max-w-2xl mx-auto font-medium">Notre engagement pour vous offrir la meilleure expérience possible pour ce jour sacré.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon={<Shield className="h-8 w-8 text-emerald-500" />} title="Qualité garantie" description="Abattoir certifié depuis plus de 10 ans, respect strict du rite musulman." />
            <FeatureCard icon={<Truck className="h-8 w-8 text-teal-500" />} title="Livraison frigorifique" description="Camions certifiés pour une livraison optimale sur Montpellier et alentours." />
            <FeatureCard icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />} title="Traçabilité totale" description="Suivi en temps réel de votre commande depuis la réservation jusqu'à la livraison." />
            <FeatureCard icon={<Clock className="h-8 w-8 text-teal-500" />} title="Service réactif" description="Une équipe dédiée à votre écoute pour vous accompagner à chaque étape." />
          </div>
        </div>
      </section>

      {/* 4. STEPS SECTION */}
      <section className="py-24 relative z-10 bg-slate-900 text-white overflow-hidden mt-12 rounded-t-[3rem]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-extrabold mb-4">Comment ça marche ?</h3>
            <p className="text-slate-400 max-w-2xl mx-auto font-medium">Un processus simple, transparent et sécurisé pour votre tranquillité d'esprit.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Step number="1" title="Créez votre compte" description="Inscrivez-vous en quelques secondes pour accéder à votre espace client." />
            <Step number="2" title="Réservez en ligne" description="Remplissez le formulaire et effectuez votre paiement sécurisé de 360€." />
            <Step number="3" title="Livraison à domicile" description="Votre agneau est préparé selon le rite puis livré chez vous en toute fraîcheur." />
          </div>
        </div>
      </section>

      {/* 5. CTA FINAL SECTION */}
      <section className="py-24 relative z-10 bg-gradient-to-br from-emerald-600 to-teal-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-black mb-6">Prêt à commander ?</h3>
          <p className="text-xl mb-10 text-emerald-50/90 font-medium max-w-2xl mx-auto">
            Rejoignez nos clients satisfaits et réservez votre agneau pour l'Aïd dès aujourd'hui.
          </p>
          <div className="flex flex-col items-center">
            <button
              onClick={() => navigate('/reservation')}
              className="bg-white text-emerald-700 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              Je commande mon agneau
            </button>
            
            {!user && (
              <p className="mt-4 text-emerald-100/80 text-sm font-medium flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> Un compte est nécessaire pour sécuriser votre réservation
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="h-6 w-6 text-emerald-500" />
              <span className="font-bold text-white text-xl">Mon Bélier</span>
            </div>
            <p className="text-sm font-medium">
              © 2024 Mon Bélier. Service de livraison d'agneau pour l'Aïd - Montpellier et environs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Composants internes pour la structure
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-8 rounded-3xl shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-all duration-300 group">
      <div className="bg-gradient-to-br from-white to-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="text-xl font-bold text-slate-900 mb-3">{title}</h4>
      <p className="text-slate-600 leading-relaxed font-medium">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative p-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl hover:bg-white/10 transition-colors group">
      <div className="text-7xl font-black text-white/5 absolute top-4 right-6 group-hover:scale-110 transition-transform">
        {number}
      </div>
      <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 text-white rounded-2xl text-2xl font-bold mb-6 shadow-lg shadow-emerald-500/30">
        {number}
      </div>
      <h4 className="text-xl font-bold text-white mb-3">{title}</h4>
      <p className="text-slate-300 leading-relaxed font-medium">{description}</p>
    </div>
  );
}