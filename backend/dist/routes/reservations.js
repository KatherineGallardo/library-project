import { Router } from 'express';
import { Book, Reservation, User } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
const router = Router();
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
router.get('/', authenticateToken, requireRole(['librarian']), async (_req, res) => {
    const reservations = await Reservation.findAll({ include: [User, Book] });
    res.json(reservations);
});
router.get('/:id', authenticateToken, async (req, res) => {
    const reservation = await Reservation.findByPk(Number(req.params.id), { include: [User, Book] });
    if (!reservation) {
        return res.status(404).json({ message: 'Reservation not found' });
    }
    if (req.user?.role !== 'librarian' && req.user?.id !== reservation.get('userId')) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(reservation);
});
router.post('/', authenticateToken, async (req, res) => {
    const book = await Book.findByPk(Number(req.body.bookId));
    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }
    if (book.availableCopies < 1) {
        return res.status(409).json({ message: 'No copies available' });
    }
    const checkoutDate = new Date();
    const dueDate = addDays(checkoutDate, 7);
    const reservation = await Reservation.create({
        userId: req.user?.id,
        bookId: book.id,
        checkOut: checkoutDate,
        dueDate,
        status: 'active',
    });
    await book.update({ availableCopies: book.availableCopies - 1 });
    res.status(201).json(reservation);
});
router.put('/:id', authenticateToken, requireRole(['librarian']), async (req, res) => {
    const reservation = await Reservation.findByPk(Number(req.params.id), { include: [Book] });
    if (!reservation) {
        return res.status(404).json({ message: 'Reservation not found' });
    }
    const updates = {};
    if (req.body.status) {
        updates.status = req.body.status;
        if (req.body.status === 'returned' && !reservation.checkIn) {
            updates.checkIn = new Date();
            const book = await Book.findByPk(Number(reservation.bookId));
            if (book) {
                await book.update({ availableCopies: book.availableCopies + 1 });
            }
        }
    }
    if (req.body.dueDate) {
        updates.dueDate = new Date(req.body.dueDate);
    }
    await reservation.update(updates);
    res.json(reservation);
});
router.delete('/:id', authenticateToken, async (req, res) => {
    const reservation = await Reservation.findByPk(Number(req.params.id), { include: [Book] });
    if (!reservation) {
        return res.status(404).json({ message: 'Reservation not found' });
    }
    if (req.user?.role !== 'librarian' && req.user?.id !== reservation.get('userId')) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    if (reservation.status === 'active' && reservation.Book) {
        const book = await Book.findByPk(Number(reservation.bookId));
        if (book) {
            await book.update({ availableCopies: book.availableCopies + 1 });
        }
    }
    await reservation.destroy();
    res.sendStatus(204);
});
export default router;
