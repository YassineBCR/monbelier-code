import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export function ReservationForm() {
  const { user } = useAuth();
  const [mosquees, setMosquees] = useState([]);
  const [selectedMosquee, setSelectedMosquee] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [nomsSacrifice, setNomsSacrifice] = useState(['']);

  useEffect(() => {
    // Charger la liste des mosquées
    supabase.from('mosquees').select('*').then(({ data }) => setMosquees(data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Créer la réservation dans Supabase
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert([{
        user_id: user.id,
        mosquee_id: selectedMosquee,
        quantite: quantite,
        noms_sacrifice: nomsSacrifice,
        // prix_total est calculé automatiquement via le Trigger SQL
      }])
      .select()
      .single();

    if (error) return alert("Erreur lors de la réservation");

    // 2. Appeler le backend pour créer la session Stripe
    const response = await fetch('http://localhost:3000/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: reservation.id, quantite }),
    });
    
    const session = await response.json();
    
    // 3. Rediriger vers Stripe
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId: session.id });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-bold mb-6 text-emerald-800">Réserver un agneau (360€ / unité)</h2>
      
      <div className="mb-4">
        <label className="block mb-2">Choisir une mosquée partenaire</label>
        <select required value={selectedMosquee} onChange={(e) => setSelectedMosquee(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Sélectionnez...</option>
          {mosquees.map((m: any) => (
            <option key={m.id} value={m.id}>{m.nom} - {m.ville}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2">Quantité</label>
        <input type="number" min="1" max="5" value={quantite} onChange={(e) => {
          const val = parseInt(e.target.value);
          setQuantite(val);
          // Ajuster le tableau des noms selon la quantité
          setNomsSacrifice(Array(val).fill(''));
        }} className="w-full p-2 border rounded" />
      </div>

      {nomsSacrifice.map((nom, index) => (
        <div key={index} className="mb-4">
          <label className="block mb-2">Nom pour le sacrifice #{index + 1}</label>
          <input required type="text" value={nom} onChange={(e) => {
            const newNoms = [...nomsSacrifice];
            newNoms[index] = e.target.value;
            setNomsSacrifice(newNoms);
          }} className="w-full p-2 border rounded" placeholder="Ex: Pour la famille Dupont" />
        </div>
      ))}

      <div className="mt-6 text-xl font-bold text-gray-800">
        Total à payer : {quantite * 360} €
      </div>

      <button type="submit" className="w-full mt-6 bg-emerald-600 text-white py-3 rounded hover:bg-emerald-700">
        Procéder au paiement
      </button>
    </form>
  );
}