
-- Table for global menu templates (admin-managed, readable by all authenticated users)
CREATE TABLE public.menu_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'menu',
  description text,
  thumbnail_url text,
  html_template text NOT NULL,
  css text NOT NULL DEFAULT '',
  fields_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view templates
CREATE POLICY "Authenticated users can view menu templates"
  ON public.menu_templates FOR SELECT
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_menu_templates_updated_at
  BEFORE UPDATE ON public.menu_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed 4 example templates
INSERT INTO public.menu_templates (name, category, description, html_template, css, fields_schema) VALUES

-- 1. Menú Restaurante
('Menú Restaurante', 'menu', 'Carta clásica con entradas, platos fuertes y postres',
'<div class="menu-container">
  <div class="menu-header">
    <h1>{{restaurant_name}}</h1>
    <p class="tagline">{{tagline}}</p>
  </div>
  <div class="menu-section">
    <h2>Entradas</h2>
    <div class="menu-item"><span class="item-name">{{entrada_1}}</span><span class="item-price">{{precio_entrada_1}}</span></div>
    <div class="menu-item"><span class="item-name">{{entrada_2}}</span><span class="item-price">{{precio_entrada_2}}</span></div>
    <div class="menu-item"><span class="item-name">{{entrada_3}}</span><span class="item-price">{{precio_entrada_3}}</span></div>
  </div>
  <div class="menu-section">
    <h2>Platos Fuertes</h2>
    <div class="menu-item"><span class="item-name">{{plato_1}}</span><span class="item-price">{{precio_plato_1}}</span></div>
    <div class="menu-item"><span class="item-name">{{plato_2}}</span><span class="item-price">{{precio_plato_2}}</span></div>
    <div class="menu-item"><span class="item-name">{{plato_3}}</span><span class="item-price">{{precio_plato_3}}</span></div>
  </div>
  <div class="menu-section">
    <h2>Postres</h2>
    <div class="menu-item"><span class="item-name">{{postre_1}}</span><span class="item-price">{{precio_postre_1}}</span></div>
    <div class="menu-item"><span class="item-name">{{postre_2}}</span><span class="item-price">{{precio_postre_2}}</span></div>
  </div>
</div>',
'* { margin: 0; padding: 0; box-sizing: border-box; }
.menu-container { width: 1920px; height: 1080px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; font-family: "Georgia", serif; display: flex; flex-direction: column; padding: 60px 80px; }
.menu-header { text-align: center; margin-bottom: 40px; }
.menu-header h1 { font-size: 56px; letter-spacing: 4px; text-transform: uppercase; color: #e2b55a; }
.tagline { font-size: 20px; color: #ccc; margin-top: 8px; font-style: italic; }
.menu-section { flex: 1; margin-bottom: 20px; }
.menu-section h2 { font-size: 28px; color: #e2b55a; border-bottom: 1px solid #e2b55a44; padding-bottom: 8px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 2px; }
.menu-item { display: flex; justify-content: space-between; padding: 10px 0; font-size: 22px; }
.item-name { color: #eee; }
.item-price { color: #e2b55a; font-weight: bold; }',
'[
  {"key":"restaurant_name","label":"Nombre del restaurante","type":"text","placeholder":"Mi Restaurante"},
  {"key":"tagline","label":"Eslogan","type":"text","placeholder":"Sabor que enamora"},
  {"key":"entrada_1","label":"Entrada 1","type":"text","placeholder":"Ensalada César"},
  {"key":"precio_entrada_1","label":"Precio Entrada 1","type":"text","placeholder":"$12.000"},
  {"key":"entrada_2","label":"Entrada 2","type":"text","placeholder":"Sopa del día"},
  {"key":"precio_entrada_2","label":"Precio Entrada 2","type":"text","placeholder":"$10.000"},
  {"key":"entrada_3","label":"Entrada 3","type":"text","placeholder":"Carpaccio"},
  {"key":"precio_entrada_3","label":"Precio Entrada 3","type":"text","placeholder":"$15.000"},
  {"key":"plato_1","label":"Plato Fuerte 1","type":"text","placeholder":"Filete de res"},
  {"key":"precio_plato_1","label":"Precio Plato 1","type":"text","placeholder":"$35.000"},
  {"key":"plato_2","label":"Plato Fuerte 2","type":"text","placeholder":"Salmón a la parrilla"},
  {"key":"precio_plato_2","label":"Precio Plato 2","type":"text","placeholder":"$32.000"},
  {"key":"plato_3","label":"Plato Fuerte 3","type":"text","placeholder":"Pollo al horno"},
  {"key":"precio_plato_3","label":"Precio Plato 3","type":"text","placeholder":"$25.000"},
  {"key":"postre_1","label":"Postre 1","type":"text","placeholder":"Tiramisú"},
  {"key":"precio_postre_1","label":"Precio Postre 1","type":"text","placeholder":"$12.000"},
  {"key":"postre_2","label":"Postre 2","type":"text","placeholder":"Cheesecake"},
  {"key":"precio_postre_2","label":"Precio Postre 2","type":"text","placeholder":"$11.000"}
]'::jsonb),

-- 2. Carta de Bebidas
('Carta de Bebidas', 'bebidas', 'Lista de bebidas con categorías y precios',
'<div class="drinks-container">
  <div class="drinks-header">
    <h1>{{bar_name}}</h1>
    <p class="subtitle">{{subtitle}}</p>
  </div>
  <div class="drinks-grid">
    <div class="drinks-col">
      <h2>🍹 Cócteles</h2>
      <div class="drink-item"><span>{{coctel_1}}</span><span class="price">{{precio_coctel_1}}</span></div>
      <div class="drink-item"><span>{{coctel_2}}</span><span class="price">{{precio_coctel_2}}</span></div>
      <div class="drink-item"><span>{{coctel_3}}</span><span class="price">{{precio_coctel_3}}</span></div>
    </div>
    <div class="drinks-col">
      <h2>🍺 Cervezas</h2>
      <div class="drink-item"><span>{{cerveza_1}}</span><span class="price">{{precio_cerveza_1}}</span></div>
      <div class="drink-item"><span>{{cerveza_2}}</span><span class="price">{{precio_cerveza_2}}</span></div>
      <div class="drink-item"><span>{{cerveza_3}}</span><span class="price">{{precio_cerveza_3}}</span></div>
    </div>
    <div class="drinks-col">
      <h2>🥤 Sin Alcohol</h2>
      <div class="drink-item"><span>{{bebida_1}}</span><span class="price">{{precio_bebida_1}}</span></div>
      <div class="drink-item"><span>{{bebida_2}}</span><span class="price">{{precio_bebida_2}}</span></div>
    </div>
  </div>
</div>',
'* { margin: 0; padding: 0; box-sizing: border-box; }
.drinks-container { width: 1920px; height: 1080px; background: linear-gradient(180deg, #0d0d0d 0%, #1a0a2e 100%); color: #fff; font-family: "Helvetica Neue", sans-serif; padding: 60px 80px; display: flex; flex-direction: column; }
.drinks-header { text-align: center; margin-bottom: 50px; }
.drinks-header h1 { font-size: 52px; font-weight: 300; letter-spacing: 8px; text-transform: uppercase; color: #a78bfa; }
.subtitle { color: #888; font-size: 18px; margin-top: 8px; }
.drinks-grid { display: flex; gap: 60px; flex: 1; }
.drinks-col { flex: 1; }
.drinks-col h2 { font-size: 26px; margin-bottom: 20px; color: #a78bfa; font-weight: 400; }
.drink-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #ffffff11; font-size: 20px; }
.price { color: #a78bfa; font-weight: 600; }',
'[
  {"key":"bar_name","label":"Nombre del bar","type":"text","placeholder":"Mi Bar"},
  {"key":"subtitle","label":"Subtítulo","type":"text","placeholder":"Carta de bebidas"},
  {"key":"coctel_1","label":"Cóctel 1","type":"text","placeholder":"Mojito"},
  {"key":"precio_coctel_1","label":"Precio","type":"text","placeholder":"$18.000"},
  {"key":"coctel_2","label":"Cóctel 2","type":"text","placeholder":"Margarita"},
  {"key":"precio_coctel_2","label":"Precio","type":"text","placeholder":"$20.000"},
  {"key":"coctel_3","label":"Cóctel 3","type":"text","placeholder":"Piña Colada"},
  {"key":"precio_coctel_3","label":"Precio","type":"text","placeholder":"$19.000"},
  {"key":"cerveza_1","label":"Cerveza 1","type":"text","placeholder":"Club Colombia"},
  {"key":"precio_cerveza_1","label":"Precio","type":"text","placeholder":"$8.000"},
  {"key":"cerveza_2","label":"Cerveza 2","type":"text","placeholder":"Poker"},
  {"key":"precio_cerveza_2","label":"Precio","type":"text","placeholder":"$6.000"},
  {"key":"cerveza_3","label":"Cerveza 3","type":"text","placeholder":"Artesanal IPA"},
  {"key":"precio_cerveza_3","label":"Precio","type":"text","placeholder":"$12.000"},
  {"key":"bebida_1","label":"Bebida sin alcohol 1","type":"text","placeholder":"Limonada natural"},
  {"key":"precio_bebida_1","label":"Precio","type":"text","placeholder":"$7.000"},
  {"key":"bebida_2","label":"Bebida sin alcohol 2","type":"text","placeholder":"Jugo de mango"},
  {"key":"precio_bebida_2","label":"Precio","type":"text","placeholder":"$8.000"}
]'::jsonb),

-- 3. Menú del Día
('Menú del Día', 'menu', 'Menú ejecutivo o del día con precio fijo',
'<div class="daily-container">
  <div class="daily-badge">{{dia}}</div>
  <h1>Menú del Día</h1>
  <h2>{{restaurant_name}}</h2>
  <div class="daily-courses">
    <div class="course">
      <span class="course-label">Entrada</span>
      <span class="course-name">{{entrada}}</span>
    </div>
    <div class="divider"></div>
    <div class="course">
      <span class="course-label">Plato Principal</span>
      <span class="course-name">{{principal}}</span>
    </div>
    <div class="divider"></div>
    <div class="course">
      <span class="course-label">Bebida</span>
      <span class="course-name">{{bebida}}</span>
    </div>
    <div class="divider"></div>
    <div class="course">
      <span class="course-label">Postre</span>
      <span class="course-name">{{postre}}</span>
    </div>
  </div>
  <div class="daily-price">{{precio}}</div>
</div>',
'* { margin: 0; padding: 0; box-sizing: border-box; }
.daily-container { width: 1920px; height: 1080px; background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); color: #fff; font-family: "Georgia", serif; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px; }
.daily-badge { background: #f59e0b; color: #000; padding: 8px 32px; border-radius: 40px; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px; font-family: sans-serif; }
h1 { font-size: 64px; margin-bottom: 8px; }
h2 { font-size: 24px; color: #f59e0b; font-weight: normal; margin-bottom: 50px; }
.daily-courses { display: flex; flex-direction: column; gap: 10px; margin-bottom: 50px; }
.course { display: flex; flex-direction: column; gap: 4px; }
.course-label { font-size: 16px; text-transform: uppercase; letter-spacing: 3px; color: #f59e0b; font-family: sans-serif; }
.course-name { font-size: 32px; }
.divider { width: 60px; height: 1px; background: #f59e0b44; margin: 10px auto; }
.daily-price { font-size: 56px; color: #f59e0b; font-weight: bold; }',
'[
  {"key":"restaurant_name","label":"Nombre del restaurante","type":"text","placeholder":"Mi Restaurante"},
  {"key":"dia","label":"Día","type":"text","placeholder":"Lunes"},
  {"key":"entrada","label":"Entrada","type":"text","placeholder":"Crema de tomate"},
  {"key":"principal","label":"Plato Principal","type":"text","placeholder":"Pollo a la plancha con arroz"},
  {"key":"bebida","label":"Bebida","type":"text","placeholder":"Jugo natural"},
  {"key":"postre","label":"Postre","type":"text","placeholder":"Fruta del día"},
  {"key":"precio","label":"Precio","type":"text","placeholder":"$15.000"}
]'::jsonb),

-- 4. Carta de Postres
('Carta de Postres', 'postres', 'Vitrina de postres con descripciones',
'<div class="dessert-container">
  <h1>{{titulo}}</h1>
  <p class="sub">{{subtitulo}}</p>
  <div class="dessert-grid">
    <div class="dessert-card">
      <div class="dessert-emoji">🍰</div>
      <h3>{{postre_1}}</h3>
      <p>{{desc_1}}</p>
      <span class="dessert-price">{{precio_1}}</span>
    </div>
    <div class="dessert-card">
      <div class="dessert-emoji">🍫</div>
      <h3>{{postre_2}}</h3>
      <p>{{desc_2}}</p>
      <span class="dessert-price">{{precio_2}}</span>
    </div>
    <div class="dessert-card">
      <div class="dessert-emoji">🍮</div>
      <h3>{{postre_3}}</h3>
      <p>{{desc_3}}</p>
      <span class="dessert-price">{{precio_3}}</span>
    </div>
    <div class="dessert-card">
      <div class="dessert-emoji">🧁</div>
      <h3>{{postre_4}}</h3>
      <p>{{desc_4}}</p>
      <span class="dessert-price">{{precio_4}}</span>
    </div>
  </div>
</div>',
'* { margin: 0; padding: 0; box-sizing: border-box; }
.dessert-container { width: 1920px; height: 1080px; background: linear-gradient(135deg, #2d1b3d 0%, #1a0a2e 50%, #0d0520 100%); color: #fff; font-family: "Georgia", serif; padding: 60px 80px; display: flex; flex-direction: column; align-items: center; }
h1 { font-size: 52px; color: #f0abfc; margin-bottom: 8px; }
.sub { font-size: 18px; color: #999; margin-bottom: 50px; }
.dessert-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; width: 100%; flex: 1; }
.dessert-card { background: #ffffff0a; border: 1px solid #f0abfc22; border-radius: 20px; padding: 40px 30px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; }
.dessert-emoji { font-size: 48px; }
.dessert-card h3 { font-size: 24px; color: #f0abfc; }
.dessert-card p { font-size: 16px; color: #aaa; line-height: 1.4; flex: 1; }
.dessert-price { font-size: 28px; color: #f0abfc; font-weight: bold; margin-top: 8px; }',
'[
  {"key":"titulo","label":"Título","type":"text","placeholder":"Nuestros Postres"},
  {"key":"subtitulo","label":"Subtítulo","type":"text","placeholder":"Endulza tu día"},
  {"key":"postre_1","label":"Postre 1","type":"text","placeholder":"Cheesecake"},
  {"key":"desc_1","label":"Descripción 1","type":"text","placeholder":"Base de galleta con crema suave"},
  {"key":"precio_1","label":"Precio 1","type":"text","placeholder":"$12.000"},
  {"key":"postre_2","label":"Postre 2","type":"text","placeholder":"Brownie"},
  {"key":"desc_2","label":"Descripción 2","type":"text","placeholder":"Chocolate intenso con nueces"},
  {"key":"precio_2","label":"Precio 2","type":"text","placeholder":"$10.000"},
  {"key":"postre_3","label":"Postre 3","type":"text","placeholder":"Flan de caramelo"},
  {"key":"desc_3","label":"Descripción 3","type":"text","placeholder":"Receta tradicional casera"},
  {"key":"precio_3","label":"Precio 3","type":"text","placeholder":"$9.000"},
  {"key":"postre_4","label":"Postre 4","type":"text","placeholder":"Cupcake red velvet"},
  {"key":"desc_4","label":"Descripción 4","type":"text","placeholder":"Con frosting de queso crema"},
  {"key":"precio_4","label":"Precio 4","type":"text","placeholder":"$8.000"}
]'::jsonb);
