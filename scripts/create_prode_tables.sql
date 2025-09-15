-- Crear tablas para el sistema de Prode (Pronósticos Deportivos)
-- Ejecutar después de crear la tabla de usuarios

-- Tabla de predicciones de usuarios
CREATE TABLE IF NOT EXISTS prode_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  partido_id UUID REFERENCES partidos(id) ON DELETE CASCADE,
  prediction VARCHAR(10) NOT NULL CHECK (prediction IN ('local', 'empate', 'visitante')),
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un usuario solo puede predecir una vez por partido
  UNIQUE(user_id, partido_id)
);

-- Tabla de puntuaciones acumuladas por usuario
CREATE TABLE IF NOT EXISTS prode_user_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un usuario solo puede tener un registro de puntuación
  UNIQUE(user_id)
);

-- Tabla de configuración del Prode
CREATE TABLE IF NOT EXISTS prode_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  points_per_correct_prediction INTEGER DEFAULT 3,
  points_per_incorrect_prediction INTEGER DEFAULT 0,
  prediction_deadline_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_prode_predictions_user_id ON prode_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_prode_predictions_partido_id ON prode_predictions(partido_id);
CREATE INDEX IF NOT EXISTS idx_prode_predictions_created_at ON prode_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_prode_user_scores_total_points ON prode_user_scores(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_prode_user_scores_user_id ON prode_user_scores(user_id);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_prode_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_prode_predictions_updated_at 
    BEFORE UPDATE ON prode_predictions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_prode_updated_at_column();

CREATE TRIGGER update_prode_user_scores_updated_at 
    BEFORE UPDATE ON prode_user_scores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_prode_updated_at_column();

-- Insertar configuración por defecto
INSERT INTO prode_config (
  points_per_correct_prediction,
  points_per_incorrect_prediction,
  prediction_deadline_minutes,
  is_active
) VALUES (
  3,  -- 3 puntos por predicción correcta
  0,  -- 0 puntos por predicción incorrecta
  15, -- 15 minutos antes del partido
  true
) ON CONFLICT DO NOTHING;

-- Función para calcular si un partido se puede predecir
CREATE OR REPLACE FUNCTION can_predict_match(match_date TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
  -- Un partido se puede predecir si faltan más de 15 minutos
  RETURN match_date > NOW() + INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql;

-- Función para calcular puntos de una predicción
CREATE OR REPLACE FUNCTION calculate_prediction_points(
  user_prediction VARCHAR(10),
  actual_result VARCHAR(10)
)
RETURNS INTEGER AS $$
BEGIN
  IF user_prediction = actual_result THEN
    RETURN 3; -- Predicción correcta
  ELSE
    RETURN 0; -- Predicción incorrecta
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar puntuación de usuario
CREATE OR REPLACE FUNCTION update_user_prode_score(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO prode_user_scores (
    user_id,
    total_points,
    total_predictions,
    correct_predictions,
    accuracy_percentage
  )
  SELECT 
    p.user_id,
    SUM(p.points_earned) as total_points,
    COUNT(*) as total_predictions,
    SUM(CASE WHEN p.points_earned > 0 THEN 1 ELSE 0 END) as correct_predictions,
    ROUND(
      (SUM(CASE WHEN p.points_earned > 0 THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 
      2
    ) as accuracy_percentage
  FROM prode_predictions p
  WHERE p.user_id = user_uuid
  GROUP BY p.user_id
  
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = EXCLUDED.total_points,
    total_predictions = EXCLUDED.total_predictions,
    correct_predictions = EXCLUDED.correct_predictions,
    accuracy_percentage = EXCLUDED.accuracy_percentage,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;
