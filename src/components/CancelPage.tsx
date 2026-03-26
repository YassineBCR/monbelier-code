import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';

export function CancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-xl p-8 text-center border border-slate-100 animate-[fadeIn_0.5s_ease-out]">
        
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-2">Paiement Échoué</h1>
        <p className="text-slate-600 mb-8 font-medium">
          Désolé, le paiement n'a pas pu aboutir ou a été annulé. Vous n'avez pas été débité.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 text-sm text-slate-600 text-left">
          <p className="font-bold text-slate-800 mb-2">Causes possibles :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Vous avez fermé la page de paiement.</li>
            <li>Fonds insuffisants ou carte expirée.</li>
            <li>Votre banque a bloqué la transaction.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => navigate('/reservation')} 
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex justify-center items-center gap-2"
          >
            <RefreshCcw className="w-5 h-5" /> Réessayer de payer
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            className="w-full text-slate-500 py-3 font-bold hover:text-slate-800 transition-colors flex justify-center items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}