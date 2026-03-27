import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  Store, Package, CheckCircle2, QrCode, Camera,
  Search, List, Clock, CheckCheck, Truck, X
} from 'lucide-react';

export function MosqueeAdminDashboard() {
  const { profile } = useAuth();
  
  const [mosqueeInfo, setMosqueeInfo] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Onglets
  const [activeTab, setActiveTab] = useState('a_remettre');
  
  // Scan USB & Manuel
  const [scanInput, setScanInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Scan Caméra
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (profile?.mosquee_id) {
      fetchMyMosqueeData();

      // 🔴 TEMPS RÉEL (REALTIME) POUR LA MOSQUÉE
      // Dès que l'abattoir "Expédie" (en_livraison), l'écran de la mosquée se met à jour tout seul !
      const channel = supabase
        .channel('mosquee-reservations-updates')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'reservations',
            filter: `mosquee_id=eq.${profile.mosquee_id}` // On n'écoute QUE les agneaux de CETTE mosquée
          },
          (payload) => {
            console.log('🔄 Mise à jour en temps réel (Mosquée) !', payload);
            fetchMyMosqueeData(); // Recharge la liste silencieusement
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };

    } else {
      setLoading(false);
    }
  }, [profile]);

  // Maintenir le focus sur le champ de scan
  useEffect(() => {
    const focusTimer = setInterval(() => {
      if (!showCameraScanner && window.innerWidth > 1024 && scanInputRef.current && document.activeElement !== scanInputRef.current) {
        scanInputRef.current.focus();
      }
    }, 5000);
    return () => clearInterval(focusTimer);
  }, [showCameraScanner]);

  const fetchMyMosqueeData = async () => {
    try {
      const { data: mosquee } = await supabase
        .from('mosquees')
        .select('*')
        .eq('id', profile.mosquee_id)
        .single();
        
      setMosqueeInfo(mosquee);

      const { data: resData } = await supabase
        .from('reservations')
        .select('*')
        .eq('mosquee_id', profile.mosquee_id)
        .order('created_at', { ascending: false });

      setReservations(resData || []);
    } catch (error) {
      console.error("Erreur de chargement", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, nouveauStatut: string) => {
    try {
      // Optimisation UI immédiate
      setReservations(prev => prev.map(res => 
        res.id === id ? { ...res, statut: nouveauStatut } : res
      ));
      
      const { error } = await supabase
        .from('reservations')
        .update({ statut: nouveauStatut })
        .eq('id', id);
        
      if (error) throw error;
      return true;
    } catch (error: any) {
      alert("Erreur : " + error.message);
      fetchMyMosqueeData(); // Recharge en cas d'erreur
      return false;
    }
  };

  // --- LOGIQUE COMMUNE DE VALIDATION ---
  const processValidation = async (inputType: 'token' | 'numero', value: string) => {
    let commande;

    if (inputType === 'token') {
      commande = reservations.find(r => r.qr_token === value);
    } else {
      commande = reservations.find(r => r.numero_commande === value || r.id.startsWith(value));
    }

    if (!commande) {
      setScanMessage({ type: 'error', text: `Commande introuvable pour cette mosquée.` });
    } else if (commande.statut === 'termine') {
      setScanMessage({ type: 'error', text: `La commande de ${commande.prenom} a DÉJÀ été remise.` });
    } else if (commande.statut === 'en_livraison') {
      setScanMessage({ type: 'error', text: `La commande de ${commande.prenom} n'a pas encore été réceptionnée du livreur.` });
    } else {
      const success = await updateStatus(commande.id, 'termine');
      if (success) {
        setScanMessage({ type: 'success', text: `Succès ! Agneau remis à ${commande.prenom} ${commande.nom}.` });
      }
    }
    
    setTimeout(() => setScanMessage(null), 5000);
  };

  // --- LOGISTIQUE DU SCANNER USB & MANUEL ---
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    let type: 'token' | 'numero' = 'numero';
    let finalValue = scanInput.trim();

    const matchNumero = scanInput.match(/MB-\d{8}-\d{4}/);
    if (matchNumero) {
      finalValue = matchNumero[0];
      type = 'numero';
    } else {
      const matchToken = scanInput.match(/\/retrait\/([a-zA-Z0-9_-]+)/);
      if (matchToken) {
        finalValue = matchToken[1];
        type = 'token';
      }
    }

    await processValidation(type, finalValue);
    setScanInput('');
  };

  // --- LOGISTIQUE DE L'APPAREIL PHOTO ---
  const startCameraScanner = () => {
    setScanMessage(null);
    setShowCameraScanner(true);
    
    setTimeout(() => {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scannerRef.current.render(
        async (decodedText) => {
          const matchToken = decodedText.match(/\/retrait\/([a-zA-Z0-9_-]+)/);
          
          if (matchToken) {
            stopCameraScanner();
            await processValidation('token', matchToken[1]);
          } else {
            const matchNumero = decodedText.match(/MB-\d{8}-\d{4}/);
            if (matchNumero) {
              stopCameraScanner();
              await processValidation('numero', matchNumero[0]);
            } else {
              setScanMessage({ type: 'error', text: "Format de QR code inconnu." });
            }
          }
        },
        (error) => {}
      );
    }, 100);
  };

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(error => console.error("Erreur d'arrêt du scanner", error));
      scannerRef.current = null;
    }
    setShowCameraScanner(false);
  };

  const filteredReservations = reservations.filter(res => {
    if (activeTab === 'toutes') return true;
    if (activeTab === 'attendues') return res.statut === 'en_livraison';
    if (activeTab === 'a_remettre') return res.statut === 'a_recuperer';
    if (activeTab === 'traitees') return res.statut === 'termine';
    return true;
  });

  if (!loading && !profile?.mosquee_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Aucune mosquée assignée</h2>
          <p className="text-slate-500 mt-2 text-sm">Veuillez contacter l'administrateur principal pour lier votre compte à une mosquée.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {loading && reservations.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-medium">Chargement de votre espace...</div>
        ) : (
          <>
            <header className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <span className="bg-emerald-100 p-3 md:p-4 rounded-2xl text-emerald-600 shrink-0">
                  <Store className="w-7 h-7 md:w-8 md:h-8" />
                </span>
                <div>
                  <h1 className="text-xl md:text-3xl font-black text-slate-900 leading-tight">
                    {mosqueeInfo?.nom}
                  </h1>
                  <p className="text-slate-500 mt-1 font-medium flex items-center gap-1.5 text-xs md:text-sm">
                    <Clock className="w-3.5 h-3.5"/> Horaires : {mosqueeInfo?.horaires || "Non définis"}
                  </p>
                </div>
              </div>
            </header>

            <section className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 md:w-6 md:h-6 text-emerald-400"/>
                    Prise en charge
                  </h2>
                  
                  <button 
                    onClick={startCameraScanner}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 text-sm md:text-base"
                  >
                    <Camera className="w-5 h-5"/>
                    Scanner par caméra
                  </button>
                </div>

                <p className="text-slate-400 text-xs md:text-sm max-w-2xl">
                  Utilisez votre scanner USB, votre appareil photo ou tapez manuellement le numéro de commande ou le jeton pour remettre un agneau instantanément.
                </p>

                <form onSubmit={handleScanSubmit} className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      ref={scanInputRef}
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      placeholder="Entrez numéro ou coller URL (ex: MB-20240615-1234)"
                      className="block w-full pl-11 pr-4 py-3 md:py-4 bg-slate-800 border border-slate-700 rounded-xl md:rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none text-sm md:text-lg transition-all"
                    />
                  </div>
                  <button type="submit" className="w-full lg:w-auto bg-slate-800 text-white border border-slate-700 px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold hover:bg-slate-700 transition-colors text-sm md:text-base whitespace-nowrap">
                    Valider manuellement
                  </button>
                </form>

                {scanMessage && (
                  <div className={`p-4 rounded-xl font-bold text-sm animate-[fadeIn_0.3s_ease-out] ${scanMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    {scanMessage.text}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3">
                <TabButton active={activeTab === 'toutes'} onClick={() => setActiveTab('toutes')} icon={List} label="Toutes" count={reservations.length} />
                <TabButton active={activeTab === 'attendues'} onClick={() => setActiveTab('attendues')} icon={Truck} label="Attendues" count={reservations.filter(r => r.statut === 'en_livraison').length} color="text-amber-600" bg="bg-amber-100" />
                <TabButton active={activeTab === 'a_remettre'} onClick={() => setActiveTab('a_remettre')} icon={Package} label="À remettre" count={reservations.filter(r => r.statut === 'a_recuperer').length} color="text-blue-600" bg="bg-blue-100" />
                <TabButton active={activeTab === 'traitees'} onClick={() => setActiveTab('traitees')} icon={CheckCheck} label="Traitées" count={reservations.filter(r => r.statut === 'termine').length} color="text-emerald-600" bg="bg-emerald-100" />
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 md:p-6">
                  {filteredReservations.length === 0 ? (
                    <div className="text-center py-12 md:py-16">
                      <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium text-sm md:text-base">Aucune commande dans cet onglet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredReservations.map(res => (
                        <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 border border-slate-100 rounded-xl md:rounded-2xl hover:bg-slate-50 transition-colors gap-3 md:gap-4">
                          
                          <div className="flex flex-col shrink-0">
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 mb-0.5 md:mb-1">{res.numero_commande}</span>
                            <span className="font-black text-base md:text-lg text-slate-900 leading-tight">{res.prenom} {res.nom}</span>
                            {res.telephone && <span className="text-xs md:text-sm text-slate-500 mt-0.5">{res.telephone}</span>}
                          </div>
                          
                          <div className="flex flex-col xs:flex-row xs:items-center gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:justify-end">
                            <span className="flex items-center justify-center gap-1.5 text-xs md:text-sm font-bold bg-slate-100 text-slate-700 px-3 md:px-4 py-2 rounded-lg md:rounded-xl border border-slate-200 whitespace-nowrap">
                              <Package className="w-3.5 h-3.5 md:w-4 md:h-4"/> {res.quantite}
                            </span>

                            {res.statut === 'en_livraison' && (
                              <button onClick={() => updateStatus(res.id, 'a_recuperer')} className="w-full sm:w-auto bg-amber-500 text-white px-4 md:px-5 py-2.5 rounded-lg md:rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors shadow-sm shadow-amber-500/20 whitespace-nowrap">
                                Réceptionner livreur
                              </button>
                            )}
                            
                            {res.statut === 'a_recuperer' && (
                              <button onClick={() => updateStatus(res.id, 'termine')} className="w-full sm:w-auto bg-emerald-600 text-white px-4 md:px-5 py-2.5 rounded-lg md:rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors shadow-sm shadow-emerald-600/20 whitespace-nowrap">
                                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5"/> Remettre client
                              </button>
                            )}

                            {res.statut === 'termine' && (
                              <span className="w-full sm:w-auto bg-slate-100 text-slate-500 px-4 md:px-5 py-2.5 rounded-lg md:rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 border border-slate-200 whitespace-nowrap">
                                <CheckCheck className="w-4 h-4 md:w-5 md:h-5"/> Retirée
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
            
          </>
        )}
      </div>

      {showCameraScanner && (
        <div className="fixed inset-0 z-50 p-2 md:p-6 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl p-5 md:p-6 w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col h-auto max-h-[95vh]">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-emerald-600"/>
                Scannez le QR Code client
              </h3>
              <button 
                onClick={stopCameraScanner}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 aspect-square mb-5 flex-1 flex items-center justify-center">
              <div id="reader" className="w-full h-full"></div>
            </div>
            
            <p className="text-center text-sm text-slate-500 px-4 shrink-0">
              Placez le QR code du client au centre du cadre pour une détection automatique.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count, color = "text-slate-600", bg = "bg-slate-100" }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold whitespace-nowrap transition-all text-xs md:text-base shrink-0 ${
        active 
          ? 'bg-slate-900 text-white shadow-md' 
          : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
      }`}
    >
      <Icon className={`w-4 h-4 md:w-5 md:h-5 ${active ? 'text-white' : ''}`} />
      {label}
      <span className={`px-2 md:px-2.5 py-0.5 rounded-full text-[10px] md:text-xs ${active ? 'bg-slate-700 text-white' : `${bg} ${color}`}`}>
        {count}
      </span>
    </button>
  );
}