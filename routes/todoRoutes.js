const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const { requireAuth } = require('../middleware/requireAuth');

router.use(requireAuth);
router.get('/', todoController.getTodos);
router.post('/', todoController.createTodo);
router.delete('/completed', todoController.clearCompleted);
router.patch('/:id', todoController.updateTodo);
router.put('/:id', todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);

module.exports = router;
