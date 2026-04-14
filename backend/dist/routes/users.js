import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
dotenv.config();
const router = Router();
const secret = process.env.JWT_SECRET ?? 'default_secret';
router.post('/', async (req, res) => {
    const { firstName, lastName, email, username, password, dateOfBirth, phoneNumber } = req.body;
    if (!firstName || !lastName || !email || !username || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
        dateOfBirth,
        phoneNumber,
        role: 'patron',
    });
    res.status(201).json({ id: user.id, username: user.username, role: user.role, email: user.email });
});
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    const user = await User.findOne({ where: { username } });
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, secret, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});
router.get('/:id', authenticateToken, async (req, res) => {
    const user = await User.findByPk(Number(req.params.id), { attributes: { exclude: ['password'] } });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (req.user?.role !== 'librarian' && req.user?.id !== Number(req.params.id)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(user);
});
router.put('/:id', authenticateToken, async (req, res) => {
    const user = await User.findByPk(Number(req.params.id));
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (req.user?.role !== 'librarian' && req.user?.id !== Number(req.params.id)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    await user.update({
        firstName: req.body.firstName ?? user.firstName,
        lastName: req.body.lastName ?? user.lastName,
        email: req.body.email ?? user.email,
        phoneNumber: req.body.phoneNumber ?? user.phoneNumber,
        dateOfBirth: req.body.dateOfBirth ?? user.dateOfBirth,
    });
    res.json({ id: user.id, username: user.username, role: user.role, email: user.email, firstName: user.firstName, lastName: user.lastName, phoneNumber: user.phoneNumber, dateOfBirth: user.dateOfBirth });
});
router.delete('/:id', authenticateToken, async (req, res) => {
    const user = await User.findByPk(Number(req.params.id));
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (req.user?.role !== 'librarian' && req.user?.id !== Number(req.params.id)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    await user.destroy();
    res.sendStatus(204);
});
export default router;
