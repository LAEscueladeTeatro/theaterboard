DROP TABLE IF EXISTS students;

CREATE TABLE students (
    id VARCHAR(10) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100)
);

INSERT INTO students (id, full_name, nickname) VALUES
('ET001', 'Adriano Rivera , Ana Liz', 'Ana'),
('ET002', 'Alarcón Lizarbe, Samantha Valentina', 'Samy'),
('ET003', 'Baltazar Bazan , María Fernanda', 'Fer'),
('ET004', 'Buiza, Alex', 'Alex'),
('ET005', 'Canto Romero, Dubal Sebastián', 'Dubal'),
('ET006', 'Contreras Montesinos , Luis Nicolas', 'Ricolas'),
('ET007', 'Contreras Vega , Valentina Lucila', 'Valentina'),
('ET008', 'Cristóbal soriano, Larry Kenn', 'Cristóbal'),
('ET009', 'Diaz de la cruz, Molly', 'Molly'),
('ET010', 'Flores Castilla , Lucas Shmelling', 'Lucas'),
('ET011', 'Gallegos Cuadros , Yamile Alexandra', 'Yamile'),
('ET012', 'Gaspar Toribio, Leonel Ronaldho', 'Leo'),
('ET013', 'Gavino paucar , Indhira Candy', 'Indhi/ candy'),
('ET014', 'Goñi Malqui, Elva Luz', 'Luz'),
('ET015', 'Huaira Inga , Daritza Melanny', 'Melanny'),
('ET016', 'Huarcaya badajos, Joseph anderson', 'Joseph'),
('ET017', 'Jimenez arroyo, Ruth mireya', 'Ruth'),
('ET018', 'Lengua Quispe , Tatiana Aracely', 'Taty'),
('ET019', 'Martinez Milla , Anahi', 'Ana'),
('ET020', 'Mayhua liberato , Larisza tayte', 'Lari'),
('ET021', 'Merino quispe , Mayllory', 'Maryo'),
('ET022', 'Modesto Oscanoa , Guillermo Mateo', 'Guille'),
('ET023', 'Oyola Jacobe, Alonso Jesus', 'Lalo o Alonso'),
('ET024', 'Pacara Mendoza , Lady Vanessa', 'Lady'),
('ET025', 'Pulido Diaz, Rianny Haome', 'Hao'),
('ET026', 'Ramos Castañeda , Dayana Mayori', 'Mayori'),
('ET027', 'Ramos Huamani , Ximena', 'Xime o Ximena'),
('ET028', 'Ramos Pinedo, Sofia del pilar', 'Sofi'),
('ET029', 'Rivadeneyra Brenis , Luciana Emyly', 'Luci'),
('ET030', 'Rivas De la Cruz , Yunsu Nayara', 'Yunsu'),
('ET031', 'Riveros Campos, Milagros Dayeli', 'Mili o Daye'),
('ET032', 'Roque Pacheco, Andry Imanol', 'And'),
('ET033', 'Salas Collado , Mario Carlos Valentino', 'Vale'),
('ET034', 'Saldaña vargas, Kiara Astrid Luz', 'Kiasra'),
('ET035', 'Sanchez, Danna', 'Dani'),
('ET036', 'Santos llantoy , Fabrizio Marlo', 'Fabri'),
('ET037', 'Sevillano Rosas, Hazel', 'Hazel o Haz'),
('ET038', 'Simangas Bendezú , Fabricio', 'Ciber'),
('ET039', 'Suarez Torres, Kenneth Yashiro', 'Kenneth'),
('ET040', 'Suárez Torres, Camila rubi', 'Cami'),
('ET041', 'Terrones Oré, Jack Yeison', 'Oré'),
('ET042', 'Vásquez Sánchez , Axel Jair', 'Axel'),
('ET043', 'Victorio vizcarra, Sebastian', 'Sebas'),
('ET044', 'Vidal Goñi , César Fabian', 'Fabi'),
('ET045', 'Vilca Aroni, Hanna', 'Juan'),
('ET046', 'Zarate Hinojosa, Edhiel satoshi', 'Satoshi'),
('ET047', 'Zela Ramirez , Anny hellen', 'Nany'),
('ET048', 'Apellidos, Cinthya', 'Cinthya'),
('ET049', 'Jimenez suarez, Junnior alexander', 'Junnior'),
('ET050', 'Jimenez Lopez , Jazziely Alessandra', 'Jazzi o alessandra'),
('ET051', 'Gonzales, Adelaida', 'Adelaida'),
('ET052', 'Raymundo, Gino', 'Gino'),
('ET053', 'Raymundo, Moisés', 'Moisés'),
('ET054', 'Ttito Vargas, Luz María', 'Luz'),
('ET055', 'Dávila Espinoza, Rouss', 'Rouss'),
('ET056', 'Chuñoca, Jesusa', 'Jesusa'),
('ET057', 'Moreno Arévalo, Génesis', 'Génesis');

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
