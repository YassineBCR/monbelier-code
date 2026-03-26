import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Download } from 'lucide-react';

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // On récupère l'ID de la réservation passé dans l'URL par Stripe
  const reservationId = searchParams.get('id') || 'COMMANDE_VALIDEE';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-xl p-8 text-center border border-slate-100 animate-[fadeIn_0.5s_ease-out]">
        
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-2">Paiement Réussi !</h1>
        <p className="text-slate-600 mb-8 font-medium">
          Al Hamdulillah, votre réservation a bien été confirmée. Un e-mail récapitulatif vous a été envoyé.
        </p>

        {/* CARTE QR CODE */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 mb-8 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-4">Pass de Retrait</h3>
          
          <div className="bg-white p-3 rounded-xl inline-block mb-4 shadow-inner">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${reservationId}`} 
              alt="QR Code de retrait"
              className="w-32 h-32"
            />
          </div>
          
          <p className="text-slate-400 text-xs mb-1">Numéro de réservation</p>
          <p className="text-white font-mono text-sm break-all bg-white/10 py-2 px-3 rounded-lg">
            {reservationId}
          </p>
        </div>

        <p className="text-sm text-slate-500 mb-8">
          Veuillez présenter ce QR Code (ou une capture d'écran) lors de la récupération de votre commande.
        </p>

        <button 
          onClick={() => navigate('/')} 
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-500 transition-all flex justify-center items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Retour à l'accueil
        </button>
      </div>
    </div>
  );
}