import { sequelize } from '../config/mariadb.js';
import { DataTypes } from 'sequelize';

// Model definitions
const User = sequelize.define('User', {
	nombre: { type: DataTypes.STRING, allowNull: false },
	email: { type: DataTypes.STRING, allowNull: false, unique: true },
	password: { type: DataTypes.STRING, allowNull: false },
	rol: { type: DataTypes.ENUM('alumno', 'profesor', 'admin'), allowNull: false },
	dni: { type: DataTypes.STRING, allowNull: true, unique: true },
	codigoAlumno: { type: DataTypes.STRING, allowNull: true, unique: true },
	anio: { type: DataTypes.INTEGER, allowNull: true },
	division: { type: DataTypes.STRING, allowNull: true },
	mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: true },
	isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
	acceso_habilitado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: true });

const Materia = sequelize.define('Materia', {
	nombre: { type: DataTypes.STRING, allowNull: false },
	descripcion: { type: DataTypes.TEXT, allowNull: true },
	anio: { type: DataTypes.INTEGER, allowNull: true }
}, { timestamps: true });

const Clase = sequelize.define('Clase', {
	anio: { type: DataTypes.INTEGER, allowNull: false },
	division: { type: DataTypes.STRING, allowNull: false },
	diaSemana: { type: DataTypes.STRING, allowNull: false },
	horaInicio: { type: DataTypes.STRING, allowNull: false },
	horaFin: { type: DataTypes.STRING, allowNull: false },
	duracion: { type: DataTypes.INTEGER, allowNull: true }
}, { timestamps: true });

const Tarea = sequelize.define('Tarea', {
	titulo: { type: DataTypes.STRING, allowNull: false },
	descripcion: { type: DataTypes.TEXT, allowNull: true },
	fechaEntrega: { type: DataTypes.DATE, allowNull: false },
	archivo: { type: DataTypes.STRING, allowNull: true }
}, { timestamps: true });

const Entrega = sequelize.define('Entrega', {
	archivo: { type: DataTypes.STRING, allowNull: true },
	fechaEntrega: { type: DataTypes.DATE, allowNull: true },
	comentario: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true });

const Cuota = sequelize.define('Cuota', {
	monto: { type: DataTypes.DECIMAL(10,2), allowNull: false },
	fechaVencimiento: { type: DataTypes.DATE, allowNull: true },
	pagado: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });

const Asistencia = sequelize.define('Asistencia', {
	fecha: { type: DataTypes.DATE, allowNull: false },
	presente: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });

const Anuncio = sequelize.define('Anuncio', {
	titulo: { type: DataTypes.STRING, allowNull: false },
	contenido: { type: DataTypes.TEXT, allowNull: false }
}, { timestamps: true });

const Calificacion = sequelize.define('Calificacion', {
	nota: { type: DataTypes.DECIMAL(5,2), allowNull: false },
	tipo: { type: DataTypes.STRING, allowNull: true },
	comentario: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true });

// Associations
Materia.hasMany(Clase, { foreignKey: 'materiaId' });
Clase.belongsTo(Materia, { foreignKey: 'materiaId' });

Materia.hasMany(Tarea, { foreignKey: 'materiaId' });
Tarea.belongsTo(Materia, { foreignKey: 'materiaId' });

User.hasMany(Tarea, { foreignKey: 'profesorId' });
Tarea.belongsTo(User, { as: 'profesor', foreignKey: 'profesorId' });

Tarea.hasMany(Entrega, { foreignKey: 'tareaId' });
Entrega.belongsTo(Tarea, { foreignKey: 'tareaId' });

User.hasMany(Entrega, { foreignKey: 'alumnoId' });
Entrega.belongsTo(User, { as: 'alumno', foreignKey: 'alumnoId' });

User.hasMany(Cuota, { foreignKey: 'usuarioId' });
Cuota.belongsTo(User, { foreignKey: 'usuarioId' });

Clase.belongsToMany(User, { as: 'Profesores', through: 'ClaseProfesores', foreignKey: 'claseId', otherKey: 'profesorId' });
Clase.belongsToMany(User, { as: 'Alumnos', through: 'ClaseAlumnos', foreignKey: 'claseId', otherKey: 'alumnoId' });
User.belongsToMany(Clase, { as: 'ClasesComoProfesor', through: 'ClaseProfesores', foreignKey: 'profesorId', otherKey: 'claseId' });
User.belongsToMany(Clase, { as: 'ClasesComoAlumno', through: 'ClaseAlumnos', foreignKey: 'alumnoId', otherKey: 'claseId' });

Clase.hasMany(Asistencia, { foreignKey: 'claseId' });
Asistencia.belongsTo(Clase, { foreignKey: 'claseId' });
User.hasMany(Asistencia, { foreignKey: 'alumnoId' });
Asistencia.belongsTo(User, { as: 'alumno', foreignKey: 'alumnoId' });

User.hasMany(Anuncio, { foreignKey: 'autorId' });
Anuncio.belongsTo(User, { as: 'autor', foreignKey: 'autorId' });

User.hasMany(Calificacion, { foreignKey: 'alumnoId' });
Calificacion.belongsTo(User, { as: 'alumno', foreignKey: 'alumnoId' });
Materia.hasMany(Calificacion, { foreignKey: 'materiaId' });
Calificacion.belongsTo(Materia, { foreignKey: 'materiaId' });

// Export models and sequelize
const db = {
	sequelize,
	DataTypes,
	User,
	Materia,
	Clase,
	Tarea,
	Entrega,
	Cuota,
	Asistencia,
	Anuncio,
	Calificacion
};

export default db;
