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
    emergency_contact_phone VARCHAR(20),
    face_descriptor JSONB
);

-- Insertar estudiantes con contraseñas HASHEADAS de ejemplo.
-- Las contraseñas originales (ej: 'ET001pass') deben ser reemplazadas por sus hashes.
-- Ejemplo de hashes (reemplazar con hashes reales):
-- 'ET001pass' -> '$2a$10$studentPassHashPlaceholder1'
-- 'ET002pass' -> '$2a$10$studentPassHashPlaceholder2'
-- etc.
INSERT INTO students (id, full_name, nickname, password_hash, is_active, age, birth_date, phone, email, photo_url) VALUES
('ET001', 'Adriano Rivera , Ana Liz', 'Ana', '$2b$10$sekj507kxoM/s3TIjNP.uO37H8TqWd5T//07Wyl92P6bwJr47m1Eu', true, NULL, NULL, NULL, 'et001@example.com', NULL),
('ET002', 'Alarcón Lizarbe, Samantha Valentina', 'Samy', '$2b$10$LuApIYBV5NPx1EoHLl1rsexnrBRFaXPkE2/ssn6LPM26SilI2XSDi', true, NULL, NULL, NULL, 'et002@example.com', NULL),
('ET003', 'Baltazar Bazan , María Fernanda', 'Fer', '$2b$10$xgtmJj7WsGz/9GNVBy1C2OZgSfdhUWUOoizzwqQvK6Y4PxC/rDkLe', true, NULL, NULL, NULL, 'et003@example.com', NULL),
('ET004', 'Buiza, Alex', 'Alex', '$2b$10$RK0aTqiai1s1BKwFSccFn.OgbeSdX82fLWvjteZXx7T26tiWm5zqe', true, NULL, NULL, NULL, 'et004@example.com', NULL),
('ET005', 'Canto Romero, Dubal Sebastián', 'Dubal', '$2b$10$qMG2J8s6rt97BpLZ5C96Su0QM9MqIQvg1XYajpgdmdmQ.LBhQWgO6', true, NULL, NULL, NULL, 'et005@example.com', NULL),
('ET006', 'Contreras Montesinos , Luis Nicolas', 'Ricolas', '$2b$10$9gga81UOEvr0fFgLeE00feKdk0RBEt4Px7MsFIBmP4gTHqMe5HmQi', true, NULL, NULL, NULL, 'et006@example.com', NULL),
('ET007', 'Contreras Vega , Valentina Lucila', 'Valentina', '$2b$10$uwKbugUXfRnblmbcVOxbguVAOcCMtBJyhSLavSAoZPL8teyEcNrDW', true, NULL, NULL, NULL, 'et007@example.com', NULL),
('ET008', 'Cristóbal soriano, Larry Kenn', 'Cristóbal', '$2b$10$1LFZu9kQIc6.0uSqBVZCzOs/pPAw9UeGZF0Z37cWpfLSCBTVWtjBy', true, NULL, NULL, NULL, 'et008@example.com', NULL),
('ET009', 'Diaz de la cruz, Molly', 'Molly', '$2b$10$oMql8OMvZ33oj9LnwbVG5OF4TWOLngYkhBjQg/TmHtDOgA8COWyhu', true, NULL, NULL, NULL, 'et009@example.com', NULL),
('ET010', 'Flores Castilla , Lucas Shmelling', 'Lucas', '$2b$10$y/V04/o9FnzGKe/W8e/iHe7iQHR34aXwyO7xcDUwz3t8p4FXWuCLa', true, NULL, NULL, NULL, 'et010@example.com', NULL),
('ET011', 'Gallegos Cuadros , Yamile Alexandra', 'Yamile', '$2b$10$ETLoQNv.PZqXLskyJZ40e.RaKpqcZpiqf6LwmMDHVce7jijI5QZDC', true, NULL, NULL, NULL, 'et011@example.com', NULL),
('ET012', 'Gaspar Toribio, Leonel Ronaldho', 'Leo', '$2b$10$wgVbHrXt7M53BbPnHuB2DeOeN5Fkz7uco/5r7ThkKO1RJ0zp8zP.y', true, NULL, NULL, NULL, 'et012@example.com', NULL),
('ET013', 'Gavino paucar , Indhira Candy', 'Indhi/ candy', '$2b$10$dtsqsMWQuOs2lupiGgrksuSN/2vbcYtD2QJxCXvfPFkikl2EfgcU.', true, NULL, NULL, NULL, 'et013@example.com', NULL),
('ET014', 'Goñi Malqui, Elva Luz', 'Luz', '$2b$10$xpWvytn/wg4hpSoAqoV9SuuSDgxGCRtpTGv9s1qGzuI2EsmKLHmWG', true, NULL, NULL, NULL, 'et014@example.com', NULL),
('ET015', 'Huaira Inga , Daritza Melanny', 'Melanny', '$2b$10$CXENv7qoS.8QLtqnqjTfWe27MK6MnYVnyzzUBYEVMyD.zAEcPueVy', true, NULL, NULL, NULL, 'et015@example.com', NULL),
('ET016', 'Huarcaya badajos, Joseph anderson', 'Joseph', '$2b$10$iUDHa554ArkwZOeBlO7nleSjn0yr4kOnpFaKggwGXYJsVBXUl4Z2G', true, NULL, NULL, NULL, 'et016@example.com', NULL),
('ET017', 'Jimenez arroyo, Ruth mireya', 'Ruth', '$2b$10$gr4QvzvCDEbXKiumr7dcz.a0Rw.M8HKkyQB7uXs2czLQ0ApnivUeO', true, NULL, NULL, NULL, 'et017@example.com', NULL),
('ET018', 'Lengua Quispe , Tatiana Aracely', 'Taty', '$2b$10$p/SLOZnWFlrcWTAA0.Q6OetYpj3E4s.1UZuo4SN8Jtr5GSkc4obk6', true, NULL, NULL, NULL, 'et018@example.com', NULL),
('ET019', 'Martinez Milla , Anahi', 'Ana', '$2b$10$cw.W11Bmej6Hkl9uzrHvE.Fg3bKSw27zP0ZyhH.NsFq42chI3a0ey', true, NULL, NULL, NULL, 'et019@example.com', NULL),
('ET020', 'Mayhua liberato , Larisza tayte', 'Lari', '$2b$10$/M5H85d6IkNGpbAgZoBBPuoq4n19kagi5eaC3bJcrt1GC0EDrdAR2', true, NULL, NULL, NULL, 'et020@example.com', NULL),
('ET021', 'Merino quispe , Mayllory', 'Maryo', '$2b$10$IJKLldyAZsGksGNgVyW5Wedl5cYwZ7EnYrH/adsQ3ijyyAA./uL/G', true, NULL, NULL, NULL, 'et021@example.com', NULL),
('ET022', 'Modesto Oscanoa , Guillermo Mateo', 'Guille', '$2b$10$iBywSboh.LOu6QplYec85e6Pq9ZRuEL.tzc2Y5xoOz0REYN2ZmIFq', true, NULL, NULL, NULL, 'et022@example.com', NULL),
('ET023', 'Oyola Jacobe, Alonso Jesus', 'Lalo o Alonso', '$2b$10$sQ9XIDxMkNf7OygJM7fkiufQV7.GGQuNmM.Hjc/RIC5KC17TThvJ.', true, NULL, NULL, NULL, 'et023@example.com', NULL),
('ET024', 'Pacara Mendoza , Lady Vanessa', 'Lady', '$2b$10$k3zT8qhCAVSRTlSzgNVSNOGkAnXv4097kYi8y4UIVzie5soe.Zqge', true, NULL, NULL, NULL, 'et024@example.com', NULL),
('ET025', 'Pulido Diaz, Rianny Haome', 'Hao', '$2b$10$nuOmCbbUGeWHdWMC5mcrle9L1GJamJPHFPZqJC1CBbI14oOj/hSCm', true, NULL, NULL, NULL, 'et025@example.com', NULL),
('ET026', 'Ramos Castañeda , Dayana Mayori', 'Mayori', '$2b$10$52QpMJuHOHMMDss89FzmDOAE8yN04kE3zqHsT0AG5i8BJNA.cvfgO', true, NULL, NULL, NULL, 'et026@example.com', NULL),
('ET027', 'Ramos Huamani , Ximena', 'Xime o Ximena', '$2b$10$yk/KzYwIiYau4dRTmCvXbOCuDA7BsW.AViT4Q.bdHts3/t6FFx9q.', true, NULL, NULL, NULL, 'et027@example.com', NULL),
('ET028', 'Ramos Pinedo, Sofia del pilar', 'Sofi', '$2b$10$M69xKrmZX9yHTWx.y/Zuq.2lV/JdqWg6lavtLuhnQvQsWGxhduQvO', true, NULL, NULL, NULL, 'et028@example.com', NULL),
('ET029', 'Rivadeneyra Brenis , Luciana Emyly', 'Luci', '$2b$10$/0bQh07lwvE5099As4k5aeL3kaNwE09872/LRmL6ByR/uqTKGv/Uq', true, NULL, NULL, NULL, 'et029@example.com', NULL),
('ET030', 'Rivas De la Cruz , Yunsu Nayara', 'Yunsu', '$2b$10$Jc3kNpThlu44Um2V6zweieCeHdAA7Td49TrZstO1LR5fPiYT4R3FC', true, NULL, NULL, NULL, 'et030@example.com', NULL),
('ET031', 'Riveros Campos, Milagros Dayeli', 'Mili o Daye', '$2b$10$Y5R3eaUvkut46Haed9Na0.e1vDkjpvo.LTNyKy5KiqBUp0f/R7r6C', true, NULL, NULL, NULL, 'et031@example.com', NULL),
('ET032', 'Roque Pacheco, Andry Imanol', 'And', '$2b$10$qKkMXe3hOU05UAwVXKOfsuileGNXMWGsZBRXIxckUcwIfbnhnAzdy', true, NULL, NULL, NULL, 'et032@example.com', NULL),
('ET033', 'Salas Collado , Mario Carlos Valentino', 'Vale', '$2b$10$PnsERRwSSIwWpPJMSLHD.OdsFExpolWBhO1baHDz1DvuynuSW1wf.', true, NULL, NULL, NULL, 'et033@example.com', NULL),
('ET034', 'Saldaña vargas, Kiara Astrid Luz', 'Kiara', '$2b$10$PksTSgsaKPSAeQapNLx9EOSqexIjPy.LaiZhzVabZkKNoXHwAOgki', true, NULL, NULL, NULL, 'et034@example.com', NULL),
('ET035', 'Sanchez, Danna', 'Dani', '$2b$10$5Q8oGeCf8DY6jgIEWiSrTuM3HtagPTXYpcTm/rcFFKZid9e3yOyk.', true, NULL, NULL, NULL, 'et035@example.com', NULL),
('ET036', 'Santos llantoy , Fabrizio Marlo', 'Fabri', '$2b$10$LDWwS.SqkkOyUX8/DLQHXeyfIZ3vH/pGX.a1KWbZJtGv5wFalFIHS', true, NULL, NULL, NULL, 'et036@example.com', NULL),
('ET037', 'Sevillano Rosas, Hazel', 'Hazel o Haz', '$2b$10$2NjWO47Eq6llLNrOGa7l6ONqrVH.i7Fj9bI77g6kzzNh3TwSjfwoG', true, NULL, NULL, NULL, 'et037@example.com', NULL),
('ET038', 'Simangas Bendezú , Fabricio', 'Ciber', '$2b$10$FiwwW7ltHQETeh9.V70m4OxyIkJTJTorDf0JP3N7k6hmFcz3OBmS6', true, NULL, NULL, NULL, 'et038@example.com', NULL),
('ET039', 'Suarez Torres, Kenneth Yashiro', 'Kenneth', '$2b$10$G4m5LIgascOLKiCchLSJO.HD0ymNbrj4TJ/0R7m3H4hNAcQ2gzy5C', true, NULL, NULL, NULL, 'et039@example.com', NULL),
('ET040', 'Suárez Torres, Camila rubi', 'Cami', '$2b$10$EbX.L0g3Xe/yo1jPidxVw.tYd8GMpChfo/9v5YnJBWtXyDwypX0Ye', true, NULL, NULL, NULL, 'et040@example.com', NULL),
('ET041', 'Terrones Oré, Jack Yeison', 'Oré', '$2b$10$pPpfL3SGeBUIjY5JxtcNGePJXe/i1vsQFfM.N.iQe3QbfUxdhnDXa', true, NULL, NULL, NULL, 'et041@example.com', NULL),
('ET042', 'Vásquez Sánchez , Axel Jair', 'Axel', '$2b$10$04ukh2TvlE1iuEI6QUqSOOqyyUWISkIxTojmup4QyLuA1dbPVLkBq', true, NULL, NULL, NULL, 'et042@example.com', NULL),
('ET043', 'Victorio vizcarra, Sebastian', 'Sebas', '$2b$10$u26bdQx3Mb1RHPR5t9HiweDs79Y8VA4.D5PkvEGDuPSVxxs3nO1w6', true, NULL, NULL, NULL, 'et043@example.com', NULL),
('ET044', 'Vidal Goñi , César Fabian', 'Fabi', '$2b$10$uK7kxwdiMsxOTYF5w/d5ZOFaef2sJIHXYXcZg1OPbkmQfb.6ghXae', true, NULL, NULL, NULL, 'et044@example.com', NULL),
('ET045', 'Vilca Aroni, Hanna', 'Juan', '$2b$10$2DsFDfkg0Do9GwuBIbp.HubJC1d1/zuQV2MUwfGc6Vq6k7z6VgGk6', true, NULL, NULL, NULL, 'et045@example.com', NULL),
('ET046', 'Zarate Hinojosa, Edhiel satoshi', 'Satoshi', '$2b$10$T6ihXrqOou7KKXdKxQm9qOsxWfhQW1x/9xwR9pMRhzswsW7Q9c9ja', true, NULL, NULL, NULL, 'et046@example.com', NULL),
('ET047', 'Zela Ramirez , Anny hellen', 'Nany', '$2b$10$3KIHcu.WNjgdoTMbu1.sTuGFbxqM4NwPnjaQFop2JwVeMXmJQ3kYS', true, NULL, NULL, NULL, 'et047@example.com', NULL),
('ET048', 'Apellidos, Cinthya', 'Cinthya', '$2b$10$T7.GF.j72M1Ez.5bwEu.O.6zuZBef0DGKMoCOSNYuxzIhL/wdSlI.', true, NULL, NULL, NULL, 'et048@example.com', NULL),
('ET049', 'Jimenez suarez, Junnior alexander', 'Junnior', '$2b$10$Fe56neaDt7qCtde2V0fIoev2ipsgtZkuOYoLeuOyzz3Dv8hO/uULm', true, NULL, NULL, NULL, 'et049@example.com', NULL),
('ET050', 'Jimenez Lopez , Jazziely Alessandra', 'Jazzi o alessandra', '$2b$10$5iUXFM/.rLvTtXSsQSZ0ZuntRcushqauszDd5R4dZvgKQF6XdWPDe', true, NULL, NULL, NULL, 'et050@example.com', NULL),
('ET051', 'Gonzales, Adelaida', 'Adelaida', '$2b$10$hV73brkTOw/FFzl12w67k.cRpq.CwK/OEfA83LrCf60oRkh4Prg.y', true, NULL, NULL, NULL, 'et051@example.com', NULL),
('ET052', 'Raymundo, Gino', 'Gino', '$2b$10$jrc3MMXc.Gi8Y0LnugZaJOCJemzpGwNFxND.D8v4tssFtwUO3eNcS', true, NULL, NULL, NULL, 'et052@example.com', NULL),
('ET053', 'Raymundo, Moisés', 'Moisés', '$2b$10$n9bmpFMbdQOYoby1cIfIdOtlhp9MhwURZzem2Ad3ECmKuk8kJpOGe', true, NULL, NULL, NULL, 'et053@example.com', NULL),
('ET054', 'Ttito Vargas, Luz María', 'Luz', '$2b$10$j/97Xv/QkDPH638VtnQr8Ojd6RtC1UVPkACZ45YgF5jSnk4IbSV5q', true, NULL, NULL, NULL, 'et054@example.com', NULL),
('ET055', 'Dávila Espinoza, Rouss', 'Rouss', '$2b$10$ty9WUCmQ6x1sXmzervajaODB9frf2ziRROEmLpkb11hdt4eqKvLAy', true, NULL, NULL, NULL, 'et055@example.com', NULL),
('ET056', 'Chuñoca, Jesusa', 'Jesusa', '$2b$10$kx2.nzdYiTWMSo6r.HNn4emi1yPA8zga5vmjdPAl99IH3CvFJn28u', true, NULL, NULL, NULL, 'et056@example.com', NULL),
('ET057', 'Moreno Arévalo, Génesis', 'Génesis', '$2b$10$cnGeQ45uc2RRsBBpukYS1O0.4JrZRM5nEZVQwA5hVxwBteVJqxv2u', true, 17, '2007-05-10', '987654321', 'et057@example.com', NULL);


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
('Luis Acuña', 'Lucho', 'luisacunach@gmail.com', '949179423', '$2b$10$.LKhCrAKVo9p1boqlKTaZOVN12nnXaoPZ7sSNo2q9u6Kot9SMhgBG', NULL)
ON CONFLICT (email) DO NOTHING;

-- Tabla para Frases Inspiradoras
DROP TABLE IF EXISTS quotes CASCADE;
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    template TEXT NOT NULL -- Ejemplo: '¡Sigue adelante, {name}! El éxito es la suma de pequeños esfuerzos.'
);

-- Poblar con algunas frases de ejemplo
INSERT INTO quotes (template) VALUES
('{name}, recuerda que el teatro no se hace para contar las cosas, sino para vivirlas.'),
('{name}, tu cuerpo es tu primer instrumento; afínalo cada día.'),
('El escenario es un lienzo en blanco; tus acciones son la pintura, {name}.'),
('No memorices tus líneas, {name}, entiende por qué tu personaje las dice.'),
('El silencio en escena, {name}, puede ser más poderoso que cualquier grito.'),
('El teatro es la poesía que se levanta del libro y se hace humana. – Federico García Lorca'),
('Escucha a tu compañero de escena como si tu vida dependiera de su respuesta. A veces, {name}, depende.'),
('Cada función es única e irrepetible, {name}. Disfruta la magia del aquí y el ahora.'),
('Dato curioso: La frase "romper una pierna" se usa para desear buena suerte y evitar el mal de ojo en el teatro.'),
('La verdad de tu personaje, {name}, se esconde en sus contradicciones.'),
('El mundo entero es un escenario, y todos los hombres y mujeres meros actores. – William Shakespeare'),
('La energía del público es tu combustible como actor, {name}.'),
('Un buen actor no actúa, {name}, reacciona.'),
('{name}, tu voz es la melodía de las emociones de tu personaje.'),
('El subtexto es lo que el personaje piensa, no lo que dice. Ahí reside tu verdadera acción, {name}.'),
('Actuar es la capacidad de vivir verdaderamente en circunstancias imaginarias. – Sanford Meisner'),
('El error en un ensayo no es un fracaso, {name}, es un descubrimiento.'),
('Confía en tu trabajo de mesa, {name}; te dará la libertad para jugar en el escenario.'),
('Dato curioso: En muchos teatros se deja una "luz fantasma" encendida en el escenario durante la noche para ahuyentar a los malos espíritus y por seguridad.'),
('El vestuario no es un disfraz, {name}, es la piel de tu personaje.'),
('El teatro no puede desaparecer porque es el único arte donde la humanidad se enfrenta a sí misma. – Arthur Miller'),
('{name}, recuerda que la cuarta pared no es un muro, es un espejo para el público.'),
('Camina con los zapatos de tu personaje mucho antes de pisar el escenario, {name}.'),
('La vulnerabilidad es tu mayor fortaleza como actor, {name}.'),
('No busques la aprobación del público, {name}, busca la verdad de la escena.'),
('Ama el arte en ti mismo, y no a ti mismo en el arte. – Konstantin Stanislavski'),
('{name}, un gesto preciso vale más que mil palabras.'),
('El ritmo de una escena, {name}, es como el latido de un corazón.'),
('El teatro es el único arte que muere cada noche y renace al día siguiente.'),
('Recuerda, {name}, los utileros no son objetos, son extensiones de la intención de tu personaje.'),
('El propósito del arte es quitar el polvo de la vida diaria de nuestras almas. – Pablo Picasso'),
('La pausa dramática es el lienzo donde el público pinta sus propias emociones.'),
('{name}, conviértete en un detective de tu personaje: investiga sus miedos, deseos y secretos.'),
('La concentración, {name}, es el faro que te guía en la tormenta de la escena.'),
('Un elenco es una familia; el respeto y la confianza son el cimiento.'),
('La vida es una obra de teatro que no permite ensayos… Por eso, {name}, canta, ríe, baila, llora y vive intensamente cada momento de tu vida. – Charles Chaplin'),
('La imaginación es el músculo más importante que debes entrenar, {name}.'),
('Dato curioso: En el teatro griego, los actores usaban máscaras para amplificar sus voces y representar diferentes personajes.'),
('{name}, juega en el escenario con la seriedad con la que un niño juega.'),
('El final de la obra no es el final de la historia, {name}, es el comienzo de la reflexión del público.'),
('Un actor es un escultor que esculpe en la nieve. – Lawrence Barrett'),
('{name}, la empatía es la herramienta que te permite construir cualquier personaje.'),
('La improvisación, {name}, es el arte de construir un puente mientras lo cruzas.'),
('Tu mirada, {name}, puede contar la historia que tus palabras callan.'),
('{name}, el teatro es un deporte de equipo jugado por artistas.'),
('El actor debe trabajar toda su vida, cultivar su mente, desarrollar su talento sistemáticamente, ampliar su personalidad; nunca debe desesperar ni abandonar su propósito. – Konstantin Stanislavski'),
('{name}, cada ensayo es una oportunidad para fallar de una forma nueva y maravillosa.'),
('El conflicto es el motor de toda gran historia. Búscalo en cada escena, {name}.'),
('La luz en el escenario, {name}, no solo ilumina, también esculpe y revela.'),
('El teatro es un acto de fe. Y tu fe, {name}, puede mover montañas.'),
('Sé generoso en escena, {name}; tu compañero brillará más y tú con él.'),
('El monólogo, {name}, es una conversación con el alma del público.'),
('La catarsis es el regalo que el teatro le hace a la audiencia.'),
('Dato curioso: El término "teatro" proviene del griego "theatron", que significa "lugar para ver".'),
('No interpretes una emoción, {name}, crea las circunstancias que la provoquen.'),
('El teatro es el arte de la reunión, el arte de compartir.'),
('La disciplina, {name}, es la base sobre la que se construye tu creatividad.'),
('{name}, cada personaje que interpretas te enseña algo sobre ti mismo.'),
('El aplauso no es el objetivo, {name}, es la consecuencia de un trabajo honesto.'),
('La palabra es el cuerpo del pensamiento, pero tu acción, {name}, es su alma.'),
('Respira, {name}. La respiración conecta tu cuerpo, tu voz y tu emoción.'),
('El espacio escénico es tu cómplice, {name}, úsalo para contar la historia.'),
('Un personaje bien construido es aquel que el público siente que conoce.'),
('El teatro revela lo que la realidad esconde.'),
('{name}, la humildad te permite aprender de cada director, cada actor y cada función.'),
('Dato curioso: William Shakespeare inventó más de 1,700 palabras que hoy usamos en el inglés.'),
('El verdadero talento, {name}, es la capacidad de trabajar duro cuando nadie está mirando.'),
('La tensión y la relajación son el yin y el yang de tu cuerpo como actor.'),
('El teatro es la pintura de los sentimientos humanos. – Voltaire'),
('{name}, nunca dejes de observar a la gente. La calle es tu mejor escuela de actuación.'),
('El objetivo de tu personaje es su brújula, {name}. Nunca la pierdas de vista.'),
('El maquillaje teatral no oculta, {name}, revela el carácter.'),
('La risa del público es música; su silencio, un poema.'),
('La vida es una cita, {name}. El teatro es el ensayo.'),
('Sé valiente en tus decisiones escénicas, {name}. La audacia es magnética.'),
('La dramaturgia, {name}, es la arquitectura de las emociones.'),
('No esperes la inspiración, {name}, ve a buscarla al ensayo.'),
('El teatro es un refugio para las preguntas, no para las respuestas.'),
('Actuar es como una mentira. El arte de mentir es saber decir la verdad. – Marlon Brando'),
('{name}, tu presencia escénica es la energía que llena el teatro antes de que digas una palabra.'),
('Cada función, {name}, es un nuevo comienzo.'),
('El teatro es una gran mentira que siempre dice la verdad. – Jean Cocteau'),
('El ensayo es el lugar donde tu "qué pasaría si..." se convierte en "es".'),
('Un buen director no te da las respuestas, {name}, te hace las preguntas correctas.'),
('La memoria emotiva es una herramienta poderosa, {name}, pero úsala con responsabilidad.'),
('La expresión corporal, {name}, es el lenguaje universal del escenario.'),
('Ser o no ser, esa es la cuestión. – William Shakespeare (Hamlet)'),
('{name}, tu personaje siempre quiere algo. ¿Qué es? ¿Y qué hace para conseguirlo?'),
('El teatro te enseña a ponerte en los zapatos de otros. Te enseña a ser más humano, {name}.'),
('Dato curioso: El teatro más antiguo del mundo que sigue en funcionamiento es el Teatro Olímpico de Vicenza, Italia, inaugurado en 1585.'),
('Recuerda, {name}, la creatividad florece dentro de las limitaciones.'),
('El peor enemigo del actor es el ego. ¡Domínalo, {name}!'),
('El teatro es la vida, pero sin las partes aburridas. – Alfred Hitchcock'),
('Escuchar activamente, {name}, es el 90% de tu actuación.'),
('Ese nudo en el estómago antes de salir a escena, {name}, es la señal de que estás vivo.'),
('Un personaje inolvidable es una mezcla del texto y lo que tú, {name}, le aportas.'),
('El teatro no necesita tecnología para crear magia, solo un actor como tú y un espectador.'),
('Todos los grandes de la escena han tenido miedo. La diferencia, {name}, es que ellos lo hacen de todos modos.'),
('La escenografía es el mundo donde tu personaje respira, {name}.'),
('El actor es un atleta del corazón. – Antonin Artaud'),
('{name}, no muestres al público que estás triste, haz algo que lo haga sentir triste a él.'),
('La autenticidad, {name}, es tu cualidad más atractiva como actor.'),
('El teatro es un diálogo entre generaciones.'),
('Dato curioso: Las mujeres no podían actuar en el teatro isabelino; los papeles femeninos eran interpretados por hombres jóvenes.'),
('{name}, confía en tus impulsos. Son el motor de la acción.'),
('La tarea del actor es encontrar el alma de su personaje.'),
('{name}, recuerda que la comedia es una tragedia vista desde lejos. Juega con la verdad.'),
('El bloqueo creativo se supera con acción, {name}, no con pensamiento.'),
('El arte de la actuación consiste en mantener al público sin toser. – Alfred Hitchcock'),
('Tu foco de atención, {name}, es la luz invisible que guía la mirada del público.'),
('Cada obra es un viaje, {name}. Disfruta del recorrido.'),
('El teatro es un espejo, un reflejo veraz de la vida.'),
('La generosidad en escena, {name}, es el regalo que le haces a tus compañeros.'),
('La coreografía de una lucha escénica es una danza de confianza y precisión.'),
('El teatro es una de las formas más seguras de decir la verdad.'),
('{name}, construye tu personaje desde adentro hacia afuera.'),
('La caracterización, {name}, es más que una voz; es una forma de ver el mundo.'),
('Dato curioso: El "deus ex machina" era un recurso del teatro griego donde una grúa bajaba a un actor que interpretaba a un dios para resolver la trama.'),
('Tu energía nunca miente, {name}. Mantenla alta y enfocada.'),
('Hagas lo que hagas, {name}, hazlo con toda tu alma.'),
('La mejor actuación es aquella en la que tú, {name}, desapareces y solo queda el personaje.'),
('Un texto teatral es una partitura; tú, {name}, eres el músico que la interpreta.'),
('El miedo escénico es solo energía mal canalizada. Conviértela en tu aliada, {name}.'),
('El teatro no es un lugar, {name}, es un estado de ánimo.'),
('La conexión con el aquí y ahora es tu secreto para una actuación viva.'),
('{name}, sé específico en tus acciones. La generalidad es el enemigo del buen teatro.'),
('La vida imita al arte mucho más que el arte a la vida. – Oscar Wilde'),
('{name}, tu calentamiento físico y vocal no es opcional, es profesional.'),
('Tu personaje, {name}, es la suma de sus decisiones.'),
('El teatro es una celebración de la complejidad humana.'),
('Un gran actor, {name}, puede hacer que te olvides de que estás en un teatro.'),
('Dato curioso: Molière, uno de los más grandes dramaturgos franceses, murió en el escenario mientras interpretaba su obra "El enfermo imaginario".'),
('{name}, el riesgo es el ingrediente secreto de una actuación memorable.'),
('Tu dicción clara no es solo técnica, {name}, es un acto de respeto.'),
('El teatro es el lugar donde tus sueños se vuelven visibles, {name}.'),
('Elige un objetivo claro y accionable para cada escena que interpretes.'),
('{name}, tu honestidad emocional es magnética.'),
('La actuación es una pregunta, {name}. La vida es la respuesta.'),
('La relajación es tu clave para acceder a las emociones más profundas.'),
('El teatro de calle lleva el arte a quienes no lo buscan, y esa es su grandeza.'),
('El teatro es una necesidad absoluta.'),
('{name}, la técnica te da la libertad para ser creativo.'),
('Un buen final de acto deja al público con una pregunta, no con una respuesta.'),
('Actuar es la más efímera de las artes.'),
('Tu curiosidad es tu motor como actor, {name}. Nunca dejes de preguntar "por qué".'),
('El trabajo de un actor, {name}, es ser un experto en seres humanos.'),
('El teatro es el grito de la humanidad.'),
('La diferencia entre un ensayo y una función, {name}, es la mirada del público.'),
('{name}, la utilería es parte de tu cuerpo en escena. Intégrala a tus acciones.'),
('El mundo necesita más teatro y menos drama.'),
('Sé puntual, {name}. El respeto por el tiempo de los demás es la base del trabajo en equipo.'),
('Un personaje vive en sus relaciones con los demás. Explóralas, {name}.'),
('La improvisación te enseña a aceptar ofertas y a construir sobre ellas.'),
('El teatro es un arma cargada de futuro.'),
('La dramaturgia del espacio: cada lugar en el escenario tiene un significado para ti, {name}.'),
('Tu voz es un músculo, {name}. ¡Entrénala!'),
('El teatro es la casa de la verdad.'),
('La cuarta pared se rompe para incluir al público, {name}, no para excluirlo.'),
('Tu mejor preparación, {name}, es estar presente.'),
('El escenario es un lugar peligroso, y por eso es tan emocionante.'),
('La motivación de tu personaje, {name}, debe ser tan fuerte como una necesidad física.'),
('Dato curioso: El "corral de comedias" era el tipo de teatro público permanente del Siglo de Oro español.'),
('El ensayo es para experimentar; la función, {name}, es para ejecutar con convicción.'),
('El teatro es una conversación con la sociedad.'),
('Recuerda, {name}, tu vulnerabilidad no es debilidad, es la puerta a la emoción.'),
('El clímax de la obra es el punto de no retorno para tu personaje.'),
('El teatro es una adicción. Una vez que te pica, {name}, no hay cura.'),
('La observación es tu materia prima como actor, {name}.'),
('El arco de tu personaje es el viaje emocional que recorres de principio a fin.'),
('El teatro es el único lugar donde puedes ser quien quieras, {name}.'),
('El ritmo y el tempo, {name}, son la música invisible de la escena.'),
('Toda la vida es un teatro, pero la obra está mal escrita. – Oscar Wilde'),
('El poder de la obra, {name}, reside en lo que no se dice.'),
('El conflicto interno de tu personaje es a menudo más interesante que el externo.'),
('La actuación es una forma de terapia para el actor y para el público.'),
('{name}, tu partitura de movimientos es tan importante como la del texto.'),
('El vestuario te ayuda a encontrar la postura de tu personaje, {name}.'),
('El teatro es un acto de resistencia.'),
('La comedia, {name}, requiere una precisión matemática y un corazón juguetón.'),
('Tu compromiso con la escena, {name}, debe ser del 100%, siempre.'),
('El teatro es una lupa para ver el alma humana.'),
('La transición entre una emoción y otra debe ser orgánica y justificada, {name}.'),
('La energía que envías al público, {name}, es la misma que recibirás de vuelta.'),
('El actor es un médium entre el poeta y la audiencia.'),
('El ensayo general, {name}, es la primera función sin la red de seguridad.'),
('El teatro es una pregunta que le hacemos al tiempo.'),
('La verdad escénica no es la realidad, {name}, pero debe sentirse igual de real.'),
('{name}, cada personaje es un universo por descubrir.'),
('El telón no cae, {name}, se levanta hacia una nueva perspectiva.'),
('Tu escucha, {name}, es un acto creativo.'),
('El teatro de sombras es la prueba de que se puede contar una historia solo con luz y ausencia de luz.'),
('Tu memoria corporal recuerda lo que la mente olvida. Confía en ella, {name}.'),
('Un buen actor puede hacer llorar al público cortando una cebolla, un gran actor como tú, {name}, puede hacerlo sin la cebolla.'),
('El teatro te enseña a caer y a levantarte, {name}, literal y figuradamente.'),
('La imaginación es tu mejor escenografía, {name}.'),
('El teatro no se ve con los ojos, {name}, se siente con el corazón.'),
('El aplauso final es un agradecimiento mutuo entre el escenario y la butaca.'),
('{name}, la vida es teatro, pero tú eres el autor de tu propia obra.'),
('La magia del teatro, {name}, es crear un mundo entero en un espacio vacío.'),
('¡Acción, {name}! Tu escenario te espera.');

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
