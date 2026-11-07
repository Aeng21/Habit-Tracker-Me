import { Router } from 'express';
import HabitController from '../controllers/habitController.js';

const router = Router();

router.get('/', HabitController.list);
router.post('/', HabitController.create);
router.put('/:id', HabitController.update);
router.delete('/:id', HabitController.remove);
router.post('/:id/toggle', HabitController.toggle);

export default router;
