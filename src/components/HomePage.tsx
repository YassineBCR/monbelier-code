import { ShoppingBag, Truck, Shield, Clock } from 'lucide-react';

interface HomePageProps {
  onOrderClick: () => void;
}

export function HomePage({ onOrderClick }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="h-8 w-8 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">Monbelier</h1>
            </div>
            <button
              onClick={onOrderClick}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Commander
            </button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Votre sacrifice de l'Aïd,
              <span className="text-emerald-600 block mt-2">livré à domicile</span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Depuis plus de 10 ans, notre abattoir certifié allie rite musulman et normes françaises.
              Aujourd'hui, nous livrons votre carcasse d'agneau directement chez vous à Montpellier.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onOrderClick}
                className="bg-emerald-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition-all transform hover:scale-105 shadow-xl"
              >
                Réserver mon agneau - 350€
              </button>
              <a
                href="#details"
                className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors px-10 py-4"
              >
                En savoir plus →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="details" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Pourquoi choisir Monbelier ?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-emerald-600" />}
              title="Qualité garantie"
              description="Abattoir certifié depuis plus de 10 ans, respectant le rite musulman et les normes françaises."
            />
            <FeatureCard
              icon={<Truck className="h-10 w-10 text-emerald-600" />}
              title="Livraison rapide"
              description="Livraison à domicile sur Montpellier et ses alentours les jours suivant l'Aïd."
            />
            <FeatureCard
              icon={<ShoppingBag className="h-10 w-10 text-emerald-600" />}
              title="Traçabilité totale"
              description="Suivi complet de votre commande depuis la réservation jusqu'à la livraison."
            />
            <FeatureCard
              icon={<Clock className="h-10 w-10 text-emerald-600" />}
              title="Service réactif"
              description="Équipe disponible et professionnelle pour répondre à toutes vos questions."
            />
          </div>
        </div>
      </section>

      <section className="py-20 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-10 lg:p-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Comment ça marche ?
            </h3>
            <div className="grid md:grid-cols-3 gap-10 mt-12">
              <Step
                number="1"
                title="Réservez en ligne"
                description="Remplissez le formulaire avec vos informations et le nom du sacrifice. Paiement sécurisé de 350€."
              />
              <Step
                number="2"
                title="Nous préparons"
                description="Votre agneau est préparé selon le rite musulman dans notre abattoir certifié."
              />
              <Step
                number="3"
                title="Livraison à domicile"
                description="Recevez votre carcasse d'agneau directement chez vous aux jours convenus."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-6">Prêt à commander ?</h3>
          <p className="text-xl mb-8 text-emerald-50">
            Réservez dès maintenant votre agneau pour l'Aïd et profitez de notre service de livraison à domicile.
          </p>
          <button
            onClick={onOrderClick}
            className="bg-white text-emerald-600 px-10 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-50 transition-all transform hover:scale-105 shadow-xl"
          >
            Commander maintenant
          </button>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <ShoppingBag className="h-6 w-6" />
              <span className="font-semibold">Monbelier</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 Monbelier. Service de livraison d'agneau pour l'Aïd - Montpellier
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center p-6 rounded-xl hover:bg-emerald-50 transition-colors">
      <div className="flex justify-center mb-4">{icon}</div>
      <h4 className="text-xl font-semibold text-gray-900 mb-3">{title}</h4>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 text-white rounded-full text-2xl font-bold mb-4">
        {number}
      </div>
      <h4 className="text-xl font-semibold text-gray-900 mb-3">{title}</h4>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
