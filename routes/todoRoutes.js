const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");
const { isAuthenticated } = require("../middleware/auth");

router.use(isAuthenticated);

router.post("/", todoController.createTodo);
router.get("/", todoController.getTodos);
router.get("/date/:date", todoController.getTodosByDate);
router.get("/:id", todoController.getTodoById);
router.put("/:id", todoController.updateTodo);
router.delete("/:id", todoController.deleteTodo);

module.exports = router;
