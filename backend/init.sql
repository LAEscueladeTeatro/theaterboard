DROP TABLE IF EXISTS students;

CREATE TABLE students (
    id VARCHAR(10) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    password TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    -- Nuevos campos Fase 7
    age INTEGER,
    birth_date DATE,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE, -- Email debe ser único
    guardian_full_name TEXT,
    guardian_relationship VARCHAR(50),
    guardian_phone VARCHAR(20),
    guardian_email VARCHAR(255),
    medical_conditions TEXT,
    comments TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone VARCHAR(20)
);

-- Insertar estudiantes con contraseñas de ejemplo y algunos campos nuevos como NULL o vacíos
-- Para una prueba completa, se deberían llenar algunos de estos campos para algunos estudiantes.
INSERT INTO students (id, full_name, nickname, password, is_active, age, birth_date, phone, email) VALUES
('ET001', 'Adriano Rivera , Ana Liz', 'Ana', 'ET001pass', true, NULL, NULL, NULL, 'et001@example.com'),
('ET002', 'Alarcón Lizarbe, Samantha Valentina', 'Samy', 'ET002pass', true, NULL, NULL, NULL, 'et002@example.com'),
('ET003', 'Baltazar Bazan , María Fernanda', 'Fer', 'ET003pass', true, NULL, NULL, NULL, 'et003@example.com'),
-- ... (se omiten los demás para brevedad, pero se añadirían con NULLs o datos de ejemplo para los nuevos campos)
('ET057', 'Moreno Arévalo, Génesis', 'Génesis', 'ET057pass', true, 17, '2007-05-10', '987654321', 'et057@example.com');


-- Tabla para registrar la asistencia diaria de los estudiantes
DROP TABLE IF EXISTS attendance_records CASCADE;
CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    -- PUNTUAL, A_TIEMPO, TARDANZA_JUSTIFICADA, TARDANZA_INJUSTIFICADA, AUSENCIA_JUSTIFICADA, AUSENCIA_INJUSTIFICADA
    status VARCHAR(50) NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0, -- Puntos específicos del estado (ej: +2 puntualidad, -1 tardanza just.)
    base_attendance_points INTEGER NOT NULL DEFAULT 0, -- Puntos base por asistir (ej: +2 si status no es AUSENCIA*)
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_attendance_per_day UNIQUE (student_id, attendance_date)
    -- Un estudiante solo puede tener un registro de asistencia (o ausencia) por día.
    -- Si se necesita registrar múltiples eventos por día por estudiante, esta constraint debería removerse o ajustarse.
    -- Para el modelo actual de "un estado final de asistencia por día", esta constraint es útil.
);

-- Tabla para registrar el bono madrugador
DROP TABLE IF EXISTS daily_bonus_log CASCADE;
CREATE TABLE daily_bonus_log (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    bonus_date DATE NOT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 3, -- Siempre +3 para el bono madrugador
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_bonus_per_day UNIQUE (bonus_date) -- Solo un bono madrugador por día en toda la escuela
);

-- Índices para mejorar el rendimiento de las consultas comunes
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_daily_bonus_log_student_date ON daily_bonus_log(student_id, bonus_date);
CREATE INDEX IF NOT EXISTS idx_daily_bonus_log_date ON daily_bonus_log(bonus_date);

-- Tabla para registrar puntuaciones adicionales (grupales e individuales)
DROP TABLE IF EXISTS score_records CASCADE;
CREATE TABLE score_records (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    score_date DATE NOT NULL,
    score_type VARCHAR(50) NOT NULL, -- Ej: 'ROPA_TRABAJO', 'MATERIALES', 'LIMPIEZA', 'PARTICIPACION', 'CONDUCTA', 'USO_CELULAR'
    sub_category VARCHAR(100),      -- Ej: 'Uniforme Incompleto', 'Falta Leve', 'Participacion Activa'
    points_assigned INTEGER NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para score_records
CREATE INDEX IF NOT EXISTS idx_score_records_student_date ON score_records(student_id, score_date);
CREATE INDEX IF NOT EXISTS idx_score_records_type ON score_records(score_type);
CREATE INDEX IF NOT EXISTS idx_score_records_date ON score_records(score_date);

-- Tabla para configuraciones del sistema
DROP TABLE IF EXISTS system_settings CASCADE;
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value VARCHAR(255)
);

-- Insertar configuración inicial para inscripciones públicas
-- Asumimos que por defecto están habilitadas. Cambiar a 'false' si se desea que inicien deshabilitadas.
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('public_registration_enabled', 'true')
ON CONFLICT (setting_key) DO NOTHING;
