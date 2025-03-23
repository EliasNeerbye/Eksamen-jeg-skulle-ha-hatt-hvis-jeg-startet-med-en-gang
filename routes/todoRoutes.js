const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");
const { isAuth } = require("../middleware/authMiddleware");

router.use(isAuth);

router.post("/", todoController.createTodo);
router.get("/", todoController.getAllTodos);
router.get("/:id", todoController.getTodoById);
router.put("/:id", todoController.updateTodo);
router.delete("/:id", todoController.deleteTodo);

router.patch("/:id/toggle", todoController.toggleComplete);

module.exports = router;
