DROP TABLE IF EXISTS students;

CREATE TABLE students (
    id VARCHAR(10) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    password_hash TEXT, -- Renombrado de password a password_hash
    is_active BOOLEAN DEFAULT true NOT NULL,
    photo_url VARCHAR(255), -- Nuevo campo para la foto de perfil
    -- Nuevos campos Fase 7 (y ahora perfil)
    age INTEGER,
    birth_date DATE,
    phone VARCHAR(20), -- Este será el "celular" del estudiante
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

-- Insertar estudiantes con contraseñas HASHEADAS de ejemplo.
-- Las contraseñas originales (ej: 'ET001pass') deben ser reemplazadas por sus hashes.
-- Ejemplo de hashes (reemplazar con hashes reales):
-- 'ET001pass' -> '$2a$10$studentPassHashPlaceholder1'
-- 'ET002pass' -> '$2a$10$studentPassHashPlaceholder2'
-- etc.
INSERT INTO students (id, full_name, nickname, password_hash, is_active, age, birth_date, phone, email, photo_url) VALUES
('ET001', 'Adriano Rivera , Ana Liz', 'Ana', '$2a$10$studentPassHashPlaceholder1', true, NULL, NULL, NULL, 'et001@example.com', NULL),
('ET002', 'Alarcón Lizarbe, Samantha Valentina', 'Samy', '$2a$10$studentPassHashPlaceholder2', true, NULL, NULL, NULL, 'et002@example.com', NULL),
('ET003', 'Baltazar Bazan , María Fernanda', 'Fer', '$2a$10$studentPassHashPlaceholder3', true, NULL, NULL, NULL, 'et003@example.com', NULL),
-- ... (se omiten los demás para brevedad, pero se añadirían con hashes y photo_url=NULL)
('ET057', 'Moreno Arévalo, Génesis', 'Génesis', '$2a$10$studentPassHashPlaceholder57', true, 17, '2007-05-10', '987654321', 'et057@example.com', NULL);


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

-- Tabla para Docentes
DROP TABLE IF EXISTS teachers CASCADE;
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    cellphone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    photo_url VARCHAR(255) -- Para la URL de la foto de perfil
);

-- Crear un índice en el email del docente para búsquedas rápidas
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);

-- Insertar datos iniciales del docente
-- La contraseña '3ddv6e5N' debe ser hasheada antes de insertarla.
-- Ejemplo de hash (reemplazar con el hash real): '$2a$10$exampleHashValueForTheTeacher123'
INSERT INTO teachers (full_name, nickname, email, cellphone_number, password_hash, photo_url) VALUES
('Luis Acuña', 'Lucho', 'luisacunach@gmail.com', '949179423', '$2a$10$exampleHashValueForTheTeacher123', NULL)
ON CONFLICT (email) DO NOTHING;

-- Tabla para Frases Inspiradoras
DROP TABLE IF EXISTS quotes CASCADE;
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    template TEXT NOT NULL -- Ejemplo: '¡Sigue adelante, {name}! El éxito es la suma de pequeños esfuerzos.'
);

-- Poblar con algunas frases de ejemplo
INSERT INTO quotes (template) VALUES
('¡Eres increíble, {name}! No dejes que nadie apague tu brillo.'),
('Cada día es una nueva oportunidad para brillar, {name}. ¡Aprovéchala!'),
('La perseverancia es la clave del éxito, {name}. ¡No te rindas!'),
('Confía en ti, {name}, tienes el poder de alcanzar tus sueños.'),
('El aprendizaje es un tesoro que seguirá contigo siempre, {name}.');

-- Tabla para registrar la frase diaria asignada a cada estudiante
DROP TABLE IF EXISTS daily_student_quotes CASCADE;
CREATE TABLE daily_student_quotes (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT unique_student_quote_per_day UNIQUE (student_id, assigned_date)
);

-- Índices para daily_student_quotes
CREATE INDEX IF NOT EXISTS idx_daily_student_quotes_student_date ON daily_student_quotes(student_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_daily_student_quotes_quote_id ON daily_student_quotes(quote_id);
