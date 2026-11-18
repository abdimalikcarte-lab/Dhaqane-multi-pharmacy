CREATE TABLE pharmacies (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  address    TEXT,
  phone      TEXT,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);
CREATE TABLE permissions (
  id   SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL
);
CREATE TABLE role_permissions (
  role_id       INT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  pharmacy_id   INT REFERENCES pharmacies(id),
  role_id       INT NOT NULL REFERENCES roles(id),
  full_name     TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  pharmacy_id INT NOT NULL REFERENCES pharmacies(id),
  name        TEXT NOT NULL,
  UNIQUE (pharmacy_id, name)
);

CREATE TABLE medicines (
  id            SERIAL PRIMARY KEY,
  pharmacy_id   INT NOT NULL REFERENCES pharmacies(id),
  category_id   INT REFERENCES categories(id),
  name          TEXT NOT NULL,
  price         NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  stock_qty     INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  reorder_level INT NOT NULL DEFAULT 10,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (pharmacy_id, name)
);

CREATE TABLE price_history (
  id          SERIAL PRIMARY KEY,
  pharmacy_id INT NOT NULL REFERENCES pharmacies(id),
  medicine_id INT NOT NULL REFERENCES medicines(id),
  old_price   NUMERIC(12,2),
  new_price   NUMERIC(12,2) NOT NULL,
  changed_by  INT NOT NULL REFERENCES users(id),
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  id          SERIAL PRIMARY KEY,
  pharmacy_id INT NOT NULL REFERENCES pharmacies(id),
  name        TEXT NOT NULL,
  phone       TEXT
);

CREATE TABLE sales (
  id             SERIAL PRIMARY KEY,
  pharmacy_id    INT NOT NULL REFERENCES pharmacies(id),
  customer_id    INT REFERENCES customers(id),
  cashier_id     INT NOT NULL REFERENCES users(id),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','card','mobile_money')),
  total          NUMERIC(12,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE sale_items (
  id          SERIAL PRIMARY KEY,
  sale_id     INT NOT NULL REFERENCES sales(id),
  medicine_id INT NOT NULL REFERENCES medicines(id),
  qty         INT NOT NULL CHECK (qty > 0),
  unit_price  NUMERIC(12,2) NOT NULL
);

CREATE TABLE refunds (
  id          SERIAL PRIMARY KEY,
  pharmacy_id INT NOT NULL REFERENCES pharmacies(id),
  sale_id     INT NOT NULL REFERENCES sales(id),
  amount      NUMERIC(12,2) NOT NULL,
  reason      TEXT,
  created_by  INT NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id          SERIAL PRIMARY KEY,
  pharmacy_id INT REFERENCES pharmacies(id),
  user_id     INT REFERENCES users(id),
  action      TEXT NOT NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales waa append-only: lama beddeli karo, lama tirtiri karo
CREATE FUNCTION prevent_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% on % is not allowed (append-only table)', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_immutable BEFORE UPDATE OR DELETE ON sales
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER sale_items_immutable BEFORE UPDATE OR DELETE ON sale_items
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER sales_no_truncate BEFORE TRUNCATE ON sales
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER sale_items_no_truncate BEFORE TRUNCATE ON sale_items
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_mutation();

CREATE INDEX ON medicines (pharmacy_id);
CREATE INDEX ON sales (pharmacy_id, created_at);
CREATE INDEX ON users (pharmacy_id);

INSERT INTO roles (name) VALUES ('super_admin'), ('admin'), ('user');

INSERT INTO permissions (code) VALUES
  ('pharmacies.manage'),
  ('users.manage'),
  ('medicines.view'), ('medicines.create'), ('medicines.update'), ('price.update'),
  ('sales.create'), ('sales.view'),
  ('customers.manage'),
  ('reports.view'),
  ('refunds.create');

-- super_admin: wax kasta
INSERT INTO role_permissions
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'super_admin';

-- admin: wax kasta marka laga reebo pharmacies.manage
INSERT INTO role_permissions
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin' AND p.code <> 'pharmacies.manage';

-- user (cashier)
INSERT INTO role_permissions
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'user'
  AND p.code IN ('medicines.view','sales.create','sales.view','customers.manage');
