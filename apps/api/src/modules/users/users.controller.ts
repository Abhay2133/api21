import { Router, Request, Response, NextFunction } from 'express';
import { usersService } from './users.service.js';
import { validateCreateUser, validateUserIdParam } from './users.middleware.js';

const router: Router = Router();

// GET /api/v1/users - Retrieve all users
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await usersService.getAllUsers();
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users/:id - Retrieve user by ID
router.get('/:id', validateUserIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = await usersService.getUserById(id);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/users - Create new user
router.post('/', validateCreateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await usersService.createUser(req.body);
    return res.status(201).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/users/:id - Delete user
router.delete('/:id', validateUserIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = await usersService.deleteUser(id);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

export const usersRouter: Router = router;
