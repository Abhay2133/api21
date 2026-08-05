import { Router } from 'express';
import { getUsers, getUserById, createUser, deleteUser } from '../controllers/userController.js';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.delete('/:id', deleteUser);

export default router;
