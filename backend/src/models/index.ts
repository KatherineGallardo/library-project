import dotenv from 'dotenv'
import { Sequelize, DataTypes } from 'sequelize'

dotenv.config()

export const sequelize = new Sequelize(process.env.DATABASE_URL ?? 'postgres://postgres:password@localhost:5432/library_checkout', {
  dialect: 'postgres',
  logging: false,
})

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'patron',
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
})

export const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  authorFirstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  authorLastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  yearPublished: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  genre: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  totalCopies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  availableCopies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
})

export const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  checkOut: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  checkIn: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
  },
})

User.hasMany(Reservation, { foreignKey: 'userId', onDelete: 'CASCADE' })
Reservation.belongsTo(User, { foreignKey: 'userId' })
Book.hasMany(Reservation, { foreignKey: 'bookId', onDelete: 'CASCADE' })
Reservation.belongsTo(Book, { foreignKey: 'bookId' })

export async function initDatabase() {
  await sequelize.sync({ alter: true })
}
