import { Router } from 'express';
import TransactionController from '../controllers/transactionController.js';

const router = Router();

router.get('/', TransactionController.list);
router.get('/summary', TransactionController.summary);
router.get('/categories', TransactionController.categories);
router.post('/', TransactionController.create);
router.put('/:id', TransactionController.update);
router.delete('/:id', TransactionController.remove);

export default router;
