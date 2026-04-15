-- ============================================================
-- SCRIPT COMPLETO DE SUPABASE - SISTEMA TAROT / ESOTÉRICO
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 2. TABLA: usuarios
-- Equivalente al modelo User.js
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         TEXT NOT NULL UNIQUE,
  socket_id       TEXT,
  nombre          TEXT NOT NULL DEFAULT 'Invitado',
  telefono        TEXT DEFAULT '',
  razon           TEXT DEFAULT '',
  estado          TEXT NOT NULL DEFAULT 'offline'
                  CHECK (estado IN ('online', 'offline')),
  estado_crm      TEXT NOT NULL DEFAULT 'nuevo'
                  CHECK (estado_crm IN ('nuevo', 'conversacion', 'caliente', 'cerrado', 'perdido')),
  etiquetas       TEXT[] DEFAULT '{}',
  notas           JSONB DEFAULT '[]',
  quiz_data       JSONB DEFAULT '{}',
  archivado       BOOLEAN DEFAULT FALSE,
  ultima_vez      TIMESTAMPTZ DEFAULT NOW(),
  creado_en       TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_user_id    ON public.usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado_crm ON public.usuarios(estado_crm);
CREATE INDEX IF NOT EXISTS idx_usuarios_archivado  ON public.usuarios(archivado);


-- ============================================================
-- 3. TABLA: mensajes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mensajes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emisor_id    TEXT NOT NULL,
  receptor_id  TEXT NOT NULL,
  texto        TEXT DEFAULT '',
  media_url    TEXT DEFAULT NULL,
  media_tipo   TEXT DEFAULT NULL
               CHECK (media_tipo IN ('texto', 'imagen', 'audio', 'video', NULL)),
  creado_en    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_emisor   ON public.mensajes(emisor_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_receptor ON public.mensajes(receptor_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_fecha    ON public.mensajes(creado_en DESC);


-- ============================================================
-- 4. TABLA: respuestas_rapidas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.respuestas_rapidas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etiqueta   TEXT NOT NULL,
  texto      TEXT NOT NULL,
  creado_en  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 5. TABLA: configuracion_admin
-- ============================================================
CREATE TABLE IF NOT EXISTS public.configuracion_admin (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre         TEXT DEFAULT 'El Maestro',
  avatar         TEXT DEFAULT '',
  email          TEXT DEFAULT 'admin@tarot.com',
  password_hash  TEXT DEFAULT 'admin123',
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracion_admin_unico
  ON public.configuracion_admin ((TRUE));


-- ============================================================
-- 6. TABLA: planes_suscripcion
-- ============================================================
CREATE TABLE IF NOT EXISTS public.planes_suscripcion (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           TEXT NOT NULL,
  descripcion      TEXT,
  precio_mensual   NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_anual     NUMERIC(10,2),
  moneda           TEXT NOT NULL DEFAULT 'USD',
  caracteristicas  JSONB DEFAULT '[]',
  max_consultas    INTEGER DEFAULT NULL,
  activo           BOOLEAN DEFAULT TRUE,
  orden            INTEGER DEFAULT 0,
  creado_en        TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 7. TABLA: herramientas_ia
-- ============================================================
CREATE TABLE IF NOT EXISTS public.herramientas_ia (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre            TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  descripcion       TEXT,
  descripcion_larga TEXT,
  categoria         TEXT NOT NULL DEFAULT 'general'
                    CHECK (categoria IN ('chat', 'imagen', 'audio', 'video', 'analisis', 'codigo', 'escritura', 'general')),
  proveedor         TEXT,
  icono_url         TEXT,
  url_externa       TEXT,
  planes_incluidos  UUID[] DEFAULT '{}',
  disponible        BOOLEAN DEFAULT TRUE,
  destacada         BOOLEAN DEFAULT FALSE,
  orden             INTEGER DEFAULT 0,
  creado_en         TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_herramientas_categoria  ON public.herramientas_ia(categoria);
CREATE INDEX IF NOT EXISTS idx_herramientas_disponible ON public.herramientas_ia(disponible);
CREATE INDEX IF NOT EXISTS idx_herramientas_destacada  ON public.herramientas_ia(destacada);


-- ============================================================
-- 8. TABLA: suscripciones_usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suscripciones_usuarios (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id       UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  plan_id          UUID REFERENCES public.planes_suscripcion(id),
  estado           TEXT NOT NULL DEFAULT 'activa'
                   CHECK (estado IN ('activa', 'pausada', 'cancelada', 'expirada')),
  tipo_facturacion TEXT NOT NULL DEFAULT 'mensual'
                   CHECK (tipo_facturacion IN ('mensual', 'anual')),
  fecha_inicio     TIMESTAMPTZ DEFAULT NOW(),
  fecha_fin        TIMESTAMPTZ,
  consultas_usadas INTEGER DEFAULT 0,
  renovacion_auto  BOOLEAN DEFAULT TRUE,
  metodo_pago      TEXT DEFAULT 'tarjeta',
  notas_internas   TEXT,
  creado_en        TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suscripciones_usuario ON public.suscripciones_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_plan    ON public.suscripciones_usuarios(plan_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado  ON public.suscripciones_usuarios(estado);


-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.usuarios               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_rapidas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_admin    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_suscripcion     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.herramientas_ia        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones_usuarios ENABLE ROW LEVEL SECURITY;

-- Lectura pública para planes activos y herramientas disponibles
DROP POLICY IF EXISTS "Planes visibles publicamente" ON public.planes_suscripcion;
CREATE POLICY "Planes visibles publicamente"
  ON public.planes_suscripcion FOR SELECT
  USING (activo = TRUE);

DROP POLICY IF EXISTS "Herramientas visibles publicamente" ON public.herramientas_ia;
CREATE POLICY "Herramientas visibles publicamente"
  ON public.herramientas_ia FOR SELECT
  USING (disponible = TRUE);


-- ============================================================
-- 10. FUNCIÓN Y TRIGGERS: timestamp automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_actualizar      ON public.usuarios;
CREATE TRIGGER trg_usuarios_actualizar
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();

DROP TRIGGER IF EXISTS trg_planes_actualizar         ON public.planes_suscripcion;
CREATE TRIGGER trg_planes_actualizar
  BEFORE UPDATE ON public.planes_suscripcion
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();

DROP TRIGGER IF EXISTS trg_herramientas_actualizar   ON public.herramientas_ia;
CREATE TRIGGER trg_herramientas_actualizar
  BEFORE UPDATE ON public.herramientas_ia
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();

DROP TRIGGER IF EXISTS trg_suscripciones_actualizar  ON public.suscripciones_usuarios;
CREATE TRIGGER trg_suscripciones_actualizar
  BEFORE UPDATE ON public.suscripciones_usuarios
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();


-- ============================================================
-- 11. DATOS: CONFIGURACIÓN ADMIN
-- ============================================================
INSERT INTO public.configuracion_admin (nombre, email, password_hash, avatar)
VALUES (
  'El Maestro Arcano',
  'admin@tarot.com',
  'admin123',
  'https://api.dicebear.com/7.x/personas/svg?seed=maestro'
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 12. DATOS: RESPUESTAS RÁPIDAS
-- ============================================================
INSERT INTO public.respuestas_rapidas (etiqueta, texto)
SELECT 'Bienvenida', 'Bienvenido/a al Oráculo. Estoy aquí para guiarte en tu camino espiritual. ¿En qué puedo ayudarte hoy?'
WHERE NOT EXISTS (SELECT 1 FROM public.respuestas_rapidas WHERE etiqueta = 'Bienvenida');

INSERT INTO public.respuestas_rapidas (etiqueta, texto)
SELECT 'Consulta tarot', 'Para realizar tu lectura de tarot, necesito saber: ¿cuál es la situación o pregunta principal que deseas explorar?'
WHERE NOT EXISTS (SELECT 1 FROM public.respuestas_rapidas WHERE etiqueta = 'Consulta tarot');

INSERT INTO public.respuestas_rapidas (etiqueta, texto)
SELECT 'Precio plan', 'Tenemos planes desde $29/mes. Cada plan incluye lecturas, herramientas de IA esotérica y soporte personalizado. ¿Te cuento más sobre alguno?'
WHERE NOT EXISTS (SELECT 1 FROM public.respuestas_rapidas WHERE etiqueta = 'Precio plan');

INSERT INTO public.respuestas_rapidas (etiqueta, texto)
SELECT 'Agendar sesión', 'Puedo agendar tu sesión privada ahora mismo. ¿Qué horario te viene mejor: mañana, tarde o noche?'
WHERE NOT EXISTS (SELECT 1 FROM public.respuestas_rapidas WHERE etiqueta = 'Agendar sesión');

INSERT INTO public.respuestas_rapidas (etiqueta, texto)
SELECT 'Cierre de venta', 'Estás a un paso de transformar tu vida. Con tu guía personalizada descubrirás respuestas que siempre buscaste. ¿Empezamos?'
WHERE NOT EXISTS (SELECT 1 FROM public.respuestas_rapidas WHERE etiqueta = 'Cierre de venta');

INSERT INTO public.respuestas_rapidas (etiqueta, texto)
SELECT 'Seguimiento', '¿Cómo te fue con la lectura anterior? Me interesa saber si los mensajes del tarot resonaron contigo.'
WHERE NOT EXISTS (SELECT 1 FROM public.respuestas_rapidas WHERE etiqueta = 'Seguimiento');

INSERT INTO public.respuestas_rapidas (etiqueta, texto)
SELECT 'Oferta especial', 'Solo por hoy tienes 50% de descuento en tu primera lectura completa. ¡Esta oportunidad no se repite!'
WHERE NOT EXISTS (SELECT 1 FROM public.respuestas_rapidas WHERE etiqueta = 'Oferta especial');

INSERT INTO public.respuestas_rapidas (etiqueta, texto)
SELECT 'Limpieza energética', 'Para una limpieza energética efectiva necesitas: sal gruesa, incienso de salvia y una vela blanca. ¿Quieres que te guíe paso a paso?'
WHERE NOT EXISTS (SELECT 1 FROM public.respuestas_rapidas WHERE etiqueta = 'Limpieza energética');



-- ============================================================
-- 13. DATOS: PLANES DE SUSCRIPCIÓN
-- ============================================================
-- Plan: Iniciado
INSERT INTO public.planes_suscripcion
  (nombre, descripcion, precio_mensual, precio_anual, moneda, max_consultas, orden, caracteristicas)
SELECT 'Iniciado', 'Perfecto para comenzar tu viaje espiritual y explorar el mundo esotérico.',
  29.00, 290.00, 'USD', 10, 1,
  '["10 consultas de tarot al mes","Acceso a 3 herramientas de IA básicas","Historial de lecturas por 30 días","Soporte por chat en horario comercial","Horóscopos diarios automáticos"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.planes_suscripcion WHERE nombre = 'Iniciado');

-- Plan: Vidente
INSERT INTO public.planes_suscripcion
  (nombre, descripcion, precio_mensual, precio_anual, moneda, max_consultas, orden, caracteristicas)
SELECT 'Vidente', 'Para quienes buscan una guía espiritual más profunda y constante.',
  79.00, 790.00, 'USD', 50, 2,
  '["50 consultas de tarot al mes","Acceso a todas las herramientas de IA","Historial ilimitado de lecturas","Sesiones en vivo 2 veces al mes","Carta natal personalizada","Análisis de sueños con IA","Soporte prioritario 24/7"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.planes_suscripcion WHERE nombre = 'Vidente');

-- Plan: Maestro Arcano
INSERT INTO public.planes_suscripcion
  (nombre, descripcion, precio_mensual, precio_anual, moneda, max_consultas, orden, caracteristicas)
SELECT 'Maestro Arcano', 'La experiencia esotérica más completa. Sin límites, sin restricciones.',
  149.00, 1490.00, 'USD', NULL, 3,
  '["Consultas ilimitadas de tarot","Acceso VIP a todas las herramientas","Sesiones privadas semanales","Numerología y astrología avanzada","Acceso anticipado a nuevas funciones","Chat directo con el maestro","Rituales personalizados mensuales","Curso de desarrollo intuitivo incluido"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.planes_suscripcion WHERE nombre = 'Maestro Arcano');


-- ============================================================
-- 14. DATOS: HERRAMIENTAS DE IA
-- ============================================================
INSERT INTO public.herramientas_ia
  (nombre, slug, descripcion, descripcion_larga, categoria, proveedor, disponible, destacada, orden)
VALUES
(
  'Oráculo Conversacional',
  'oraculo-conversacional',
  'Chatea con una IA especializada en tarot, astrología y esoterismo.',
  'Nuestra IA más avanzada combina conocimientos de tarot, astrología, numerología y esoterismo para ofrecerte respuestas profundas y personalizadas. Entrenada con miles de lecturas reales.',
  'chat', 'Anthropic Claude', TRUE, TRUE, 1
),
(
  'Asistente de Meditación',
  'asistente-meditacion',
  'Guías de meditación personalizadas según tu estado energético del día.',
  'Genera meditaciones guiadas adaptadas a tu perfil astrológico, estado emocional y objetivos espirituales. Sesiones de 5 a 60 minutos con música de frecuencias incluida.',
  'chat', 'OpenAI GPT-4', TRUE, FALSE, 2
),
(
  'Intérprete de Sueños',
  'interprete-suenos',
  'Descifra el significado oculto de tus sueños con inteligencia artificial.',
  'Describe tu sueño y nuestra IA lo analiza desde perspectivas junguiana, simbólica y esotérica. Identifica arquetipos, mensajes del subconsciente y guías espirituales presentes.',
  'analisis', 'OpenAI GPT-4', TRUE, TRUE, 3
),
(
  'Analizador de Carta Natal',
  'analizador-carta-natal',
  'Genera e interpreta tu carta astral completa con IA.',
  'Introduce tu fecha, hora y lugar de nacimiento. Recibirás un análisis detallado de tus planetas, casas astrológicas, aspectos y tránsitos actuales con predicciones para los próximos 12 meses.',
  'analisis', 'Motor propio', TRUE, TRUE, 4
),
(
  'Numerología Predictiva',
  'numerologia-predictiva',
  'Descubre los números que rigen tu destino y tu año personal.',
  'Calcula tu número de camino de vida, número del destino, número del alma y año personal. Recibe predicciones mensuales basadas en los ciclos numerológicos que atraviesas actualmente.',
  'analisis', 'Motor propio', TRUE, FALSE, 5
),
(
  'Lector de Runas',
  'lector-runas',
  'Tiradas de runas vikingas con interpretaciones detalladas por IA.',
  'Realiza tiradas de 1, 3 o 5 runas. La IA interpreta cada runa en contexto con tu pregunta, el momento actual y las runas que la rodean, ofreciendo mensajes profundos del mundo nórdico.',
  'analisis', 'Motor propio', TRUE, FALSE, 6
),
(
  'Generador de Afirmaciones',
  'generador-afirmaciones',
  'Crea afirmaciones personalizadas según tu signo y estado energético.',
  'Genera afirmaciones poderosas alineadas con tus planetas personales, objetivos de vida y desafíos actuales. Incluye rituales de repetición y momentos óptimos para usarlas.',
  'escritura', 'OpenAI GPT-4', TRUE, FALSE, 7
),
(
  'Escritor de Rituales',
  'escritor-rituales',
  'Diseña rituales personalizados para manifestación, limpieza y protección.',
  'Describe tu intención y la IA creará un ritual completo: materiales necesarios, pasos detallados, oraciones, visualizaciones y la fase lunar más propicia para realizarlo.',
  'escritura', 'Anthropic Claude', TRUE, TRUE, 8
),
(
  'Generador de Mandalas Sagrados',
  'generador-mandalas',
  'Crea mandalas únicos basados en tu energía y numerología personal.',
  'Genera mandalas personalizados para meditación y decoración basados en tu número de nacimiento, signo solar y luna natal. Disponibles en alta resolución para imprimir.',
  'imagen', 'Stable Diffusion', TRUE, FALSE, 9
),
(
  'Música de Frecuencias Sagradas',
  'musica-frecuencias',
  'Genera sesiones de audio con frecuencias de sanación Solfeggio y binaurales.',
  'Crea sesiones de audio personalizadas con frecuencias Solfeggio (396Hz, 528Hz, 963Hz), ondas binaurales y sonidos de la naturaleza. Ideales para meditación, sueño y rituales.',
  'audio', 'Motor propio', TRUE, FALSE, 10
)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 15. DATOS: USUARIOS DE PRUEBA
-- ============================================================
INSERT INTO public.usuarios
  (user_id, nombre, telefono, razon, estado_crm, etiquetas, notas, quiz_data)
VALUES
(
  'usr_001_test',
  'María Fernández',
  '+34 612 345 678',
  'Quiero saber sobre mi relación sentimental y si debo dar el siguiente paso.',
  'caliente',
  ARRAY['tarot', 'amor', 'interesada'],
  '[{"text": "Muy receptiva al tarot, preguntó por el plan Vidente", "createdAt": "2025-04-10T10:30:00Z"}]'::jsonb,
  '{"signo": "Escorpio", "edad": "34", "consulta": "amor", "urgencia": "alta"}'::jsonb
),
(
  'usr_002_test',
  'Carlos Mendoza',
  '+52 55 1234 5678',
  'Necesito orientación sobre un cambio de trabajo importante.',
  'conversacion',
  ARRAY['trabajo', 'decision', 'nuevo'],
  '[{"text": "Dudoso al principio pero se interesó con la lectura gratuita", "createdAt": "2025-04-11T14:00:00Z"}]'::jsonb,
  '{"signo": "Capricornio", "edad": "41", "consulta": "trabajo", "urgencia": "media"}'::jsonb
),
(
  'usr_003_test',
  'Ana Lucía Torres',
  '+57 300 987 6543',
  'Siento que hay energías negativas en mi hogar y quiero una limpieza.',
  'nuevo',
  ARRAY['limpieza', 'energia', 'hogar'],
  '[]'::jsonb,
  '{"signo": "Cancer", "edad": "28", "consulta": "limpieza_energetica", "urgencia": "alta"}'::jsonb
),
(
  'usr_004_test',
  'Roberto Silva',
  '+56 9 8765 4321',
  'Quiero entender mi propósito de vida y hacia dónde debo dirigirme.',
  'cerrado',
  ARRAY['proposito', 'vip', 'suscriptor'],
  '[{"text": "Compró plan Maestro Arcano. Cliente muy satisfecho.", "createdAt": "2025-04-05T09:15:00Z"}]'::jsonb,
  '{"signo": "Sagitario", "edad": "37", "consulta": "proposito_vida", "urgencia": "baja"}'::jsonb
),
(
  'usr_005_test',
  'Valentina Rojas',
  '+54 9 11 2345 6789',
  'Tengo sueños recurrentes que no entiendo y me generan angustia.',
  'nuevo',
  ARRAY['suenos', 'angustia', 'nuevo'],
  '[]'::jsonb,
  '{"signo": "Piscis", "edad": "25", "consulta": "suenos", "urgencia": "alta"}'::jsonb
)
ON CONFLICT (user_id) DO NOTHING;


-- ============================================================
-- 16. DATOS: SUSCRIPCIONES DE USUARIOS
-- ============================================================
DO $$
DECLARE
  plan_iniciado UUID;
  plan_vidente  UUID;
  plan_maestro  UUID;
  usr_roberto   UUID;
  usr_maria     UUID;
  usr_carlos    UUID;
BEGIN
  SELECT id INTO plan_iniciado FROM public.planes_suscripcion WHERE nombre = 'Iniciado'      LIMIT 1;
  SELECT id INTO plan_vidente  FROM public.planes_suscripcion WHERE nombre = 'Vidente'       LIMIT 1;
  SELECT id INTO plan_maestro  FROM public.planes_suscripcion WHERE nombre = 'Maestro Arcano' LIMIT 1;

  SELECT id INTO usr_roberto FROM public.usuarios WHERE user_id = 'usr_004_test' LIMIT 1;
  SELECT id INTO usr_maria   FROM public.usuarios WHERE user_id = 'usr_001_test' LIMIT 1;
  SELECT id INTO usr_carlos  FROM public.usuarios WHERE user_id = 'usr_002_test' LIMIT 1;

  INSERT INTO public.suscripciones_usuarios
    (usuario_id, plan_id, estado, tipo_facturacion, fecha_inicio, fecha_fin, consultas_usadas, metodo_pago)
  VALUES
    (usr_roberto, plan_maestro, 'activa',  'anual',   NOW() - INTERVAL '45 days', NOW() + INTERVAL '320 days', 0,  'tarjeta'),
    (usr_maria,   plan_vidente,  'activa',  'mensual', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days',  8,  'paypal'),
    (usr_carlos,  plan_iniciado, 'activa',  'mensual', NOW() - INTERVAL '5 days',  NOW() + INTERVAL '25 days',  3,  'tarjeta');
END $$;


-- ============================================================
-- 17. DATOS: MENSAJES DE CHAT DE EJEMPLO
-- ============================================================
INSERT INTO public.mensajes (emisor_id, receptor_id, texto) VALUES
  ('usr_001_test', 'admin',        'Hola, me han recomendado sus servicios. Tengo una pregunta sobre mi relación de pareja.'),
  ('admin',        'usr_001_test', 'Bienvenida María. Estoy aquí para guiarte. Cuéntame, ¿qué situación deseas explorar con las cartas?'),
  ('usr_001_test', 'admin',        'Llevo 2 años con mi pareja y no sé si es el indicado para mí. Siento que algo me frena.'),
  ('admin',        'usr_001_test', 'Entiendo tu inquietud. Las cartas me muestran que estás en un momento de discernimiento importante. El Arcano del Ermitaño aparece con fuerza... ¿quieres que profundicemos en su mensaje?'),
  ('usr_001_test', 'admin',        'Sí, por favor. ¿Qué me dice el tarot sobre esta situación?'),
  ('usr_002_test', 'admin',        'Buenos días. Estoy considerando cambiar de trabajo pero tengo mucho miedo al cambio.'),
  ('admin',        'usr_002_test', 'El miedo es parte natural del crecimiento, Carlos. Las cartas pueden darte claridad. ¿Tu mayor duda es sobre el nuevo trabajo, o sobre dejar el actual?'),
  ('usr_002_test', 'admin',        'Las dos cosas, la verdad. Tengo una oferta muy buena pero implica cambiar de ciudad y dejar a mi familia cerca.'),
  ('admin',        'usr_002_test', 'Eso es un peso muy grande. Hagamos una tirada de tres cartas: pasado, presente y futuro de esta decisión. ¿Te parece?'),
  ('usr_003_test', 'admin',        'Hola, ¿cómo se realiza una limpieza energética del hogar? Siento una energía muy pesada últimamente.'),
  ('admin',        'usr_003_test', 'Con gusto te ayudo, Ana. Primero necesito entender qué tipo de energía percibes. ¿Es más una sensación de pesadez, de conflictos frecuentes entre la familia, o de presencias extrañas?');


-- ============================================================
-- FIN DEL SCRIPT
-- Tablas creadas:    7 tablas
-- Índices:          10 índices
-- Triggers:          4 triggers
-- Registros totales: ~50 filas de datos de ejemplo
-- ============================================================
