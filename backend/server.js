import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize, DataTypes, Op } from 'sequelize';
import { createRemoteJWKSet, jwtVerify } from 'jose';

dotenv.config();

const PORT = process.env.PORT || 5001;
const DB_SCHEMA = process.env.DB_SCHEMA || 'public';
const useSsl = process.env.PGSSLMODE === 'require';

const ASGARDEO_ORG = process.env.ASGARDEO_ORG || 'katherinegallardo';

const JWKS = createRemoteJWKSet(
  new URL(`https://api.asgardeo.io/t/${ASGARDEO_ORG}/oauth2/jwks`)
);

const app = express();

app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : undefined,
    define: {
      schema: DB_SCHEMA,
    },
    logging: false,
  }
);

// MODELS

const Users = sequelize.define(
  'users',
  {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    asgardeo_id: { type: DataTypes.TEXT, allowNull: false, unique: true },
    first_name: { type: DataTypes.TEXT, allowNull: false },
    last_name: { type: DataTypes.TEXT, allowNull: false },
    role: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { isIn: [['patron', 'librarian']] },
    },
    phone_number: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, unique: true, allowNull: true },
    date_of_birth: { type: DataTypes.DATEONLY, allowNull: false },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  { tableName: 'users', timestamps: false }
);

const Books = sequelize.define(
  'books',
  {
    book_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.TEXT, allowNull: false },
    author_first_name: { type: DataTypes.TEXT, allowNull: false },
    author_last_name: { type: DataTypes.TEXT, allowNull: false },
    year_published: { type: DataTypes.INTEGER, allowNull: false },
    genre: { type: DataTypes.TEXT, allowNull: false },
    description: { type: DataTypes.TEXT },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  { tableName: 'books', timestamps: false }
);

const Reservations = sequelize.define(
  'reservations',
  {
    reservation_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    book_id: { type: DataTypes.INTEGER, allowNull: false },
    check_out: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    due_date: { type: DataTypes.DATE, allowNull: false },
    check_in: { type: DataTypes.DATE },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  { tableName: 'reservations', timestamps: false }
);

// RELATIONSHIPS

Users.hasMany(Reservations, { foreignKey: 'user_id' });
Reservations.belongsTo(Users, { foreignKey: 'user_id' });

Books.hasMany(Reservations, { foreignKey: 'book_id' });
Reservations.belongsTo(Books, { foreignKey: 'book_id' });

// HELPERS

function getReservationStatus(reservation) {
  const now = new Date();
  if (reservation.check_in) return 'returned';
  if (new Date(reservation.due_date) < now) return 'overdue';
  return 'checked_out';
}

async function getBookAvailability(bookId) {
  const activeReservation = await Reservations.findOne({
    where: { book_id: bookId, check_in: null },
  });
  return activeReservation ? 'Checked Out' : 'Available';
}

// AUTH

const verifyToken = async (req, res, next) => {
  const authHeader = (req.headers.authorization || '').trim();

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  const token = authHeader.slice(7).trim();

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.asgardeoId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireLibrarian = async (req, res, next) => {
  const user = await Users.findOne({
    where: { asgardeo_id: req.asgardeoId },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role !== 'librarian')
    return res.status(403).json({ error: 'Librarian access required' });

  req.currentUser = user;
  next();
};

// ROUTES

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/api/me', verifyToken, async (req, res) => {
  let user = await Users.findOne({
    where: { asgardeo_id: req.asgardeoId },
  });

  if (!user) {
    user = await Users.create({
      asgardeo_id: req.asgardeoId,
      first_name: 'Pending',
      last_name: 'User',
      role: 'patron',
      phone_number: 'Pending',
      email: null,
      date_of_birth: '1900-01-01',
      updated_at: new Date(),
    });
  }

  res.json(user);
});

app.put('/api/me', verifyToken, async (req, res) => {
  const user = await Users.findOne({
    where: { asgardeo_id: req.asgardeoId },
  });

  await user.update({ ...req.body, updated_at: new Date() });
  res.json(user);
});

// BOOKS

app.get('/api/books', async (req, res) => {
  const books = await Books.findAll();

  const result = await Promise.all(
    books.map(async (book) => ({
      ...book.toJSON(),
      author: `${book.author_first_name} ${book.author_last_name}`,
      availability: await getBookAvailability(book.book_id),
    }))
  );

  res.json(result);
});

// USERS

app.delete('/api/users/:id', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const user = await Users.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const reservationCount = await Reservations.count({
      where: { user_id: user.user_id },
    });

    if (reservationCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete user with existing reservations.',
      });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// START

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(err);
  }
};

startServer();