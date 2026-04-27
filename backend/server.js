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

// --------------------
// MODELS
// --------------------

const Users = sequelize.define(
  'users',
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    asgardeo_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    first_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    role: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        isIn: [['patron', 'librarian']],
      },
    },
    phone_number: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    email: {
      type: DataTypes.TEXT,
      unique: true,
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    tableName: 'users',
    timestamps: false,
  }
);

const Books = sequelize.define(
  'books',
  {
    book_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author_first_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author_last_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    year_published: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    genre: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    tableName: 'books',
    timestamps: false,
  }
);

const Reservations = sequelize.define(
  'reservations',
  {
    reservation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    check_out: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    check_in: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    tableName: 'reservations',
    timestamps: false,
  }
);

// Relationships
Users.hasMany(Reservations, { foreignKey: 'user_id' });
Reservations.belongsTo(Users, { foreignKey: 'user_id' });

Books.hasMany(Reservations, { foreignKey: 'book_id' });
Reservations.belongsTo(Books, { foreignKey: 'book_id' });

// --------------------
// HELPERS
// --------------------

function getReservationStatus(reservation) {
  const now = new Date();

  if (reservation.check_in) return 'returned';
  if (new Date(reservation.due_date) < now) return 'overdue';
  return 'checked_out';
}

async function getBookAvailability(bookId) {
  const activeReservation = await Reservations.findOne({
    where: {
      book_id: bookId,
      check_in: null,
    },
  });

  return activeReservation ? 'Checked Out' : 'Available';
}

// --------------------
// AUTH MIDDLEWARE
// --------------------

const verifyToken = async (req, res, next) => {
  const authHeader = (req.headers.authorization || '').trim();

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing authorization',
      detail: 'Send Authorization: Bearer <access_token>',
    });
  }

  const token = authHeader.slice(7).trim();

  if (token.split('.').length !== 3) {
    return res.status(401).json({
      error: 'Access token is not a JWT',
    });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);

    req.asgardeoId = payload.sub;

    console.log('Verified Asgardeo user:', req.asgardeoId);

    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);

    return res.status(401).json({
      error: 'Invalid or expired token',
      detail: err.message,
    });
  }
};

const requireLibrarian = async (req, res, next) => {
  try {
    const user = await Users.findOne({
      where: {
        asgardeo_id: req.asgardeoId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role !== 'librarian') {
      return res.status(403).json({ error: 'Librarian access required.' });
    }

    req.currentUser = user;

    next();
  } catch (err) {
    console.error('Error checking librarian role:', err);

    return res.status(500).json({
      error: 'Unable to verify user role.',
      detail: err.message,
    });
  }
};

// --------------------
// ROUTES
// --------------------

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/auth-test', verifyToken, (req, res) => {
  res.json({
    message: 'Token verified successfully.',
    asgardeoId: req.asgardeoId,
  });
});

// --------------------
// CURRENT USER ROUTES
// --------------------

app.get('/api/me', verifyToken, async (req, res) => {
  try {
    let user = await Users.findOne({
      where: {
        asgardeo_id: req.asgardeoId,
      },
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
  } catch (err) {
    console.error('Error loading current user:', err);

    res.status(500).json({
      error: 'Unable to load current user.',
      detail: err.message,
    });
  }
});

app.put('/api/me', verifyToken, async (req, res) => {
  try {
    const user = await Users.findOne({
      where: {
        asgardeo_id: req.asgardeoId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { first_name, last_name, phone_number, email, date_of_birth } = req.body;

    await user.update({
      first_name,
      last_name,
      phone_number,
      email,
      date_of_birth,
      updated_at: new Date(),
    });

    res.json(user);
  } catch (err) {
    console.error('Error updating current user:', err);

    res.status(400).json({
      error: 'Unable to update current user.',
      detail: err.message,
    });
  }
});

// --------------------
// BOOK ROUTES
// --------------------

app.get('/api/books', async (req, res) => {
  try {
    const books = await Books.findAll({ order: [['book_id', 'ASC']] });

    const booksWithAvailability = await Promise.all(
      books.map(async (book) => {
        const availability = await getBookAvailability(book.book_id);

        return {
          ...book.toJSON(),
          author: `${book.author_first_name} ${book.author_last_name}`,
          availability,
        };
      })
    );

    res.json(booksWithAvailability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await Books.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    const availability = await getBookAvailability(book.book_id);

    res.json({
      ...book.toJSON(),
      author: `${book.author_first_name} ${book.author_last_name}`,
      availability,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const newBook = await Books.create({
      ...req.body,
      updated_at: new Date(),
    });

    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/books/:id', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const book = await Books.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    await book.update({
      ...req.body,
      updated_at: new Date(),
    });

    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// NOTE: Backend validation added to enforce safe deletion rules beyond frontend UI restrictions
app.delete('/api/books/:id', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const book = await Books.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    // Prevent deletion if book is currently checked out (preserves active reservation data)
    const activeReservations = await Reservations.count({
      where: {
        book_id: book.book_id,
        check_in: null,
      },
    });

    if (activeReservations > 0) {
      return res.status(400).json({
        error: 'Cannot delete book because it is currently checked out.',
      });
    }

    await book.destroy();

    res.json({ message: 'Book deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// --------------------
// USER ROUTES
// --------------------

app.post('/api/users', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const newUser = await Users.create({
      ...req.body,
      updated_at: new Date(),
    });

    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/users', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const users = await Users.findAll({ order: [['user_id', 'ASC']] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const user = await Users.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const overdueCount = await Reservations.count({
      where: {
        user_id: user.user_id,
        [Op.or]: [
          {
            check_in: null,
            due_date: { [Op.lt]: new Date() },
          },
          {
            check_in: { [Op.ne]: null },
            check_in: { [Op.gt]: sequelize.col('due_date') },
          },
        ],
      },
    });

    res.json({
      ...user.toJSON(),
      overdue_count: overdueCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const user = await Users.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await user.update({
      ...req.body,
      updated_at: new Date(),
    });

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// NOTE: Backend validation added to enforce safe deletion rules beyond frontend UI restrictions
app.delete('/api/users/:id', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const user = await Users.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Prevent deletion if user has active reservations (preserves data integrity)
    const activeReservations = await Reservations.count({
      where: {
        user_id: user.user_id,
        check_in: null,
      },
    });

    if (activeReservations > 0) {
      return res.status(400).json({
        error: 'Cannot delete user because they have active reservations.',
      });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// RESERVATION ROUTES
// --------------------
app.get('/api/my-reservations', verifyToken, async (req, res) => {
  try {
    const currentUser = await Users.findOne({
      where: { asgardeo_id: req.asgardeoId },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const reservations = await Reservations.findAll({
      where: { user_id: currentUser.user_id },
      order: [['reservation_id', 'ASC']],
    });

    const formatted = await Promise.all(
      reservations.map(async (reservation) => {
        const reservationData = reservation.toJSON();

        const book = await Books.findByPk(reservationData.book_id, {
          attributes: ['book_id', 'title', 'author_first_name', 'author_last_name'],
        });

        return {
          ...reservationData,
          book: book ? book.toJSON() : null,
          status: getReservationStatus(reservation),
        };
      })
    );

    res.json(formatted);
  } catch (err) {
    console.error('MY RESERVATIONS ERROR:', err);

    res.status(500).json({
      error: 'Unable to load your reservations.',
      detail: err.message,
    });
  }
});

app.put('/api/my-reservations/:id/return', verifyToken, async (req, res) => {
  try {
    const currentUser = await Users.findOne({
      where: { asgardeo_id: req.asgardeoId },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const reservation = await Reservations.findOne({
      where: {
        reservation_id: req.params.id,
        user_id: currentUser.user_id,
      },
    });

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found for this user.',
      });
    }

    await reservation.update({
      check_in: new Date(),
      updated_at: new Date(),
    });

    res.json({
      ...reservation.toJSON(),
      status: getReservationStatus(reservation),
    });
  } catch (err) {
    console.error('MY RESERVATION RETURN ERROR:', err);

    res.status(400).json({
      error: 'Unable to return reservation.',
      detail: err.message,
    });
  }
});

app.get('/api/reservations', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const reservations = await Reservations.findAll({
      order: [['reservation_id', 'ASC']],
    });

    const formatted = await Promise.all(
      reservations.map(async (reservation) => {
        const reservationData = reservation.toJSON();

        const user = await Users.findByPk(reservationData.user_id, {
          attributes: ['user_id', 'first_name', 'last_name', 'role', 'email'],
        });

        const book = await Books.findByPk(reservationData.book_id, {
          attributes: [
            'book_id',
            'title',
            'author_first_name',
            'author_last_name',
          ],
        });

        return {
          ...reservationData,
          user: user ? user.toJSON() : null,
          book: book ? book.toJSON() : null,
          status: getReservationStatus(reservation),
        };
      })
    );

    res.json(formatted);
  } catch (err) {
    console.error('RESERVATIONS ERROR:', err);

    res.status(500).json({
      error: 'Reservations failed.',
      detail: err.message,
    });
  }
});

app.get('/api/reservations/:id', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const reservation = await Reservations.findByPk(req.params.id, {
      include: [
        {
          model: Users,
          attributes: ['user_id', 'first_name', 'last_name', 'role', 'email'],
          required: false,
        },
        {
          model: Books,
          attributes: ['book_id', 'title', 'author_first_name', 'author_last_name'],
          required: false,
        },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    res.json({
      ...reservation.toJSON(),
      status: getReservationStatus(reservation),
    });
  } catch (err) {
    console.error('RESERVATION DETAIL ERROR:', err);

    res.status(500).json({
      error: 'Reservation failed.',
      detail: err.message,
    });
  }
});

app.post('/api/reservations', verifyToken, async (req, res) => {
  try {
    const currentUser = await Users.findOne({
      where: {
        asgardeo_id: req.asgardeoId,
      },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (currentUser.role !== 'patron') {
  return res.status(403).json({
    error: 'Only patrons can make reservations.',
  });
} 
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({ error: 'book_id is required.' });
    }

    const existingActiveReservation = await Reservations.findOne({
      where: {
        book_id,
        check_in: null,
      },
    });

    if (existingActiveReservation) {
      return res.status(400).json({ error: 'This book is already checked out.' });
    }

    const checkOutDate = new Date();
    const dueDate = new Date(checkOutDate);
    dueDate.setDate(dueDate.getDate() + 7);

    const newReservation = await Reservations.create({
      user_id: currentUser.user_id,
      book_id,
      check_out: checkOutDate,
      due_date: dueDate,
      check_in: null,
      updated_at: new Date(),
    });

    res.status(201).json({
      ...newReservation.toJSON(),
      status: getReservationStatus(newReservation),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/reservations/:id', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const reservation = await Reservations.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    const updatedData = {
      ...req.body,
      updated_at: new Date(),
    };

    await reservation.update(updatedData);

    res.json({
      ...reservation.toJSON(),
      status: getReservationStatus(reservation),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/reservations/:id', verifyToken, requireLibrarian, async (req, res) => {
  try {
    const reservation = await Reservations.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    await reservation.destroy();
    res.json({ message: 'Reservation deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// START SERVER
// --------------------

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error: ', err);
    process.exit(1);
  }
};

startServer();