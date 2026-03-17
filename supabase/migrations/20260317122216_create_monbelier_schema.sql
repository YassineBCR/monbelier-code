/*
  # Monbelier - Schéma de base de données

  1. Nouvelles Tables
    - `profiles`
      - `id` (uuid, primary key, référence auth.users)
      - `email` (text)
      - `role` (text) - 'admin' ou 'livreur'
      - `nom` (text)
      - `telephone` (text)
      - `created_at` (timestamp)
    
    - `orders` (commandes)
      - `id` (uuid, primary key)
      - `numero_commande` (text, unique) - Numéro de commande auto-généré
      - `client_nom` (text) - Nom du client
      - `client_prenom` (text) - Prénom du client
      - `client_email` (text) - Email du client
      - `client_telephone` (text) - Téléphone du client
      - `adresse_livraison` (text) - Adresse complète de livraison
      - `ville` (text) - Ville
      - `code_postal` (text) - Code postal
      - `nom_sacrifice` (text) - Nom pour le sacrifice
      - `prix` (numeric) - Prix (350€)
      - `statut` (text) - 'en_attente', 'confirmee', 'en_livraison', 'livree', 'annulee'
      - `payment_status` (text) - 'pending', 'paid', 'failed'
      - `stripe_payment_id` (text) - ID de paiement Stripe
      - `livreur_id` (uuid) - ID du livreur assigné
      - `notes` (text) - Notes supplémentaires
      - `date_livraison_souhaitee` (date) - Date de livraison souhaitée
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour profiles : les utilisateurs peuvent lire leur propre profil, seuls les admins peuvent tout voir
    - Policies pour orders : public peut créer, admin peut tout voir/modifier, livreurs peuvent voir leurs livraisons
*/

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'livreur' CHECK (role IN ('admin', 'livreur')),
  nom text,
  telephone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_commande text UNIQUE NOT NULL,
  client_nom text NOT NULL,
  client_prenom text NOT NULL,
  client_email text NOT NULL,
  client_telephone text NOT NULL,
  adresse_livraison text NOT NULL,
  ville text NOT NULL,
  code_postal text NOT NULL,
  nom_sacrifice text NOT NULL,
  prix numeric NOT NULL DEFAULT 350,
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmee', 'en_livraison', 'livree', 'annulee')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  stripe_payment_id text,
  livreur_id uuid REFERENCES profiles(id),
  notes text,
  date_livraison_souhaitee date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Livreurs can view assigned orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    livreur_id = auth.uid()
  );

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Livreurs can update assigned orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (livreur_id = auth.uid())
  WITH CHECK (livreur_id = auth.uid());

-- Fonction pour générer un numéro de commande unique
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  new_number text;
  done bool;
BEGIN
  done := false;
  WHILE NOT done LOOP
    new_number := 'MB' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
    done := NOT EXISTS(SELECT 1 FROM orders WHERE numero_commande = new_number);
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-générer le numéro de commande
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_commande IS NULL OR NEW.numero_commande = '' THEN
    NEW.numero_commande := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_orders_statut ON orders(statut);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_livreur_id ON orders(livreur_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);