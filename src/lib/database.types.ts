export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'livreur'
          nom: string | null
          telephone: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'livreur'
          nom?: string | null
          telephone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'livreur'
          nom?: string | null
          telephone?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          numero_commande: string
          client_nom: string
          client_prenom: string
          client_email: string
          client_telephone: string
          adresse_livraison: string
          ville: string
          code_postal: string
          nom_sacrifice: string
          prix: number
          statut: 'en_attente' | 'confirmee' | 'en_livraison' | 'livree' | 'annulee'
          payment_status: 'pending' | 'paid' | 'failed'
          stripe_payment_id: string | null
          livreur_id: string | null
          notes: string | null
          date_livraison_souhaitee: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero_commande?: string
          client_nom: string
          client_prenom: string
          client_email: string
          client_telephone: string
          adresse_livraison: string
          ville: string
          code_postal: string
          nom_sacrifice: string
          prix?: number
          statut?: 'en_attente' | 'confirmee' | 'en_livraison' | 'livree' | 'annulee'
          payment_status?: 'pending' | 'paid' | 'failed'
          stripe_payment_id?: string | null
          livreur_id?: string | null
          notes?: string | null
          date_livraison_souhaitee?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero_commande?: string
          client_nom?: string
          client_prenom?: string
          client_email?: string
          client_telephone?: string
          adresse_livraison?: string
          ville?: string
          code_postal?: string
          nom_sacrifice?: string
          prix?: number
          statut?: 'en_attente' | 'confirmee' | 'en_livraison' | 'livree' | 'annulee'
          payment_status?: 'pending' | 'paid' | 'failed'
          stripe_payment_id?: string | null
          livreur_id?: string | null
          notes?: string | null
          date_livraison_souhaitee?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
