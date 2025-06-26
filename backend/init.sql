DROP TABLE IF EXISTS students;

CREATE TABLE students (
    id VARCHAR(10) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    password TEXT -- Contraseña del estudiante (para desarrollo, en texto plano)
);

-- Insertar estudiantes con contraseñas de ejemplo (id + "pass")
INSERT INTO students (id, full_name, nickname, password) VALUES
('ET001', 'Adriano Rivera , Ana Liz', 'Ana', 'ET001pass'),
('ET002', 'Alarcón Lizarbe, Samantha Valentina', 'Samy', 'ET002pass'),
('ET003', 'Baltazar Bazan , María Fernanda', 'Fer', 'ET003pass'),
('ET004', 'Buiza, Alex', 'Alex', 'ET004pass'),
('ET005', 'Canto Romero, Dubal Sebastián', 'Dubal', 'ET005pass'),
('ET006', 'Contreras Montesinos , Luis Nicolas', 'Ricolas', 'ET006pass'),
('ET007', 'Contreras Vega , Valentina Lucila', 'Valentina', 'ET007pass'),
('ET008', 'Cristóbal soriano, Larry Kenn', 'Cristóbal', 'ET008pass'),
('ET009', 'Diaz de la cruz, Molly', 'Molly', 'ET009pass'),
('ET010', 'Flores Castilla , Lucas Shmelling', 'Lucas', 'ET010pass'),
('ET011', 'Gallegos Cuadros , Yamile Alexandra', 'Yamile', 'ET011pass'),
('ET012', 'Gaspar Toribio, Leonel Ronaldho', 'Leo', 'ET012pass'),
('ET013', 'Gavino paucar , Indhira Candy', 'Indhi/ candy', 'ET013pass'),
('ET014', 'Goñi Malqui, Elva Luz', 'Luz', 'ET014pass'),
('ET015', 'Huaira Inga , Daritza Melanny', 'Melanny', 'ET015pass'),
('ET016', 'Huarcaya badajos, Joseph anderson', 'Joseph', 'ET016pass'),
('ET017', 'Jimenez arroyo, Ruth mireya', 'Ruth', 'ET017pass'),
('ET018', 'Lengua Quispe , Tatiana Aracely', 'Taty', 'ET018pass'),
('ET019', 'Martinez Milla , Anahi', 'Ana', 'ET019pass'),
('ET020', 'Mayhua liberato , Larisza tayte', 'Lari', 'ET020pass'),
('ET021', 'Merino quispe , Mayllory', 'Maryo', 'ET021pass'),
('ET022', 'Modesto Oscanoa , Guillermo Mateo', 'Guille', 'ET022pass'),
('ET023', 'Oyola Jacobe, Alonso Jesus', 'Lalo o Alonso', 'ET023pass'),
('ET024', 'Pacara Mendoza , Lady Vanessa', 'Lady', 'ET024pass'),
('ET025', 'Pulido Diaz, Rianny Haome', 'Hao', 'ET025pass'),
('ET026', 'Ramos Castañeda , Dayana Mayori', 'Mayori', 'ET026pass'),
('ET027', 'Ramos Huamani , Ximena', 'Xime o Ximena', 'ET027pass'),
('ET028', 'Ramos Pinedo, Sofia del pilar', 'Sofi', 'ET028pass'),
('ET029', 'Rivadeneyra Brenis , Luciana Emyly', 'Luci', 'ET029pass'),
('ET030', 'Rivas De la Cruz , Yunsu Nayara', 'Yunsu', 'ET030pass'),
('ET031', 'Riveros Campos, Milagros Dayeli', 'Mili o Daye', 'ET031pass'),
('ET032', 'Roque Pacheco, Andry Imanol', 'And', 'ET032pass'),
('ET033', 'Salas Collado , Mario Carlos Valentino', 'Vale', 'ET033pass'),
('ET034', 'Saldaña vargas, Kiara Astrid Luz', 'Kiasra', 'ET034pass'),
('ET035', 'Sanchez, Danna', 'Dani', 'ET035pass'),
('ET036', 'Santos llantoy , Fabrizio Marlo', 'Fabri', 'ET036pass'),
('ET037', 'Sevillano Rosas, Hazel', 'Hazel o Haz', 'ET037pass'),
('ET038', 'Simangas Bendezú , Fabricio', 'Ciber', 'ET038pass'),
('ET039', 'Suarez Torres, Kenneth Yashiro', 'Kenneth', 'ET039pass'),
('ET040', 'Suárez Torres, Camila rubi', 'Cami', 'ET040pass'),
('ET041', 'Terrones Oré, Jack Yeison', 'Oré', 'ET041pass'),
('ET042', 'Vásquez Sánchez , Axel Jair', 'Axel', 'ET042pass'),
('ET043', 'Victorio vizcarra, Sebastian', 'Sebas', 'ET043pass'),
('ET044', 'Vidal Goñi , César Fabian', 'Fabi', 'ET044pass'),
('ET045', 'Vilca Aroni, Hanna', 'Juan', 'ET045pass'),
('ET046', 'Zarate Hinojosa, Edhiel satoshi', 'Satoshi', 'ET046pass'),
('ET047', 'Zela Ramirez , Anny hellen', 'Nany', 'ET047pass'),
('ET048', 'Apellidos, Cinthya', 'Cinthya', 'ET048pass'),
('ET049', 'Jimenez suarez, Junnior alexander', 'Junnior', 'ET049pass'),
('ET050', 'Jimenez Lopez , Jazziely Alessandra', 'Jazzi o alessandra', 'ET050pass'),
('ET051', 'Gonzales, Adelaida', 'Adelaida', 'ET051pass'),
('ET052', 'Raymundo, Gino', 'Gino', 'ET052pass'),
('ET053', 'Raymundo, Moisés', 'Moisés', 'ET053pass'),
('ET054', 'Ttito Vargas, Luz María', 'Luz', 'ET054pass'),
('ET055', 'Dávila Espinoza, Rouss', 'Rouss', 'ET055pass'),
('ET056', 'Chuñoca, Jesusa', 'Jesusa', 'ET056pass'),
('ET057', 'Moreno Arévalo, Génesis', 'Génesis', 'ET057pass');

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
