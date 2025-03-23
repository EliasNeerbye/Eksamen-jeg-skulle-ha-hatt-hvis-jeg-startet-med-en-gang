// Todo management functionality
document.addEventListener("DOMContentLoaded", function () {
    // Get DOM elements
    const todoList = document.getElementById("todo-list");
    const newTodoBtn = document.getElementById("new-todo-btn");
    const todoForm = document.getElementById("todo-form");
    const modalOverlay = document.querySelector(".modal-overlay");
    const deleteModalOverlay = document.querySelector(".delete-modal-overlay");
    const cancelDeleteBtn = document.querySelector(".btn-cancel-delete");
    const confirmDeleteBtn = document.querySelector(".btn-confirm-delete");
    const dateDisplay = document.getElementById("current-date");
    const includeSharedToggle = document.getElementById("include-shared");
    includeSharedToggle.checked = true;

    // Current selected date (defaults to today)
    let currentDate = new Date();
    let formattedDate = currentDate.toISOString().split("T")[0];
    let currentTodoId = null;
    let isEditMode = false;
    let todoToDelete = null;

    // Format date for display
    function formatDateForDisplay(date) {
        return new Date(date).toLocaleDateString("nb-NO", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    // Update date display
    function updateDateDisplay() {
        if (dateDisplay) {
            dateDisplay.textContent = formatDateForDisplay(currentDate);
        }
    }

    // Initial date display update
    updateDateDisplay();

    // Modal functions
    function openModal() {
        modalOverlay.classList.add("active");
    }

    function closeModal() {
        modalOverlay.classList.remove("active");
        // Reset form
        if (todoForm) {
            todoForm.reset();
            currentTodoId = null;
            isEditMode = false;
            document.getElementById("todo-form-title").textContent = "New Todo";
            document.getElementById("todo-form-submit").textContent =
                "Add Todo";
        }
    }

    // Delete modal functions
    function openDeleteModal(todoId) {
        todoToDelete = todoId;
        if (deleteModalOverlay) {
            deleteModalOverlay.classList.add("active");
        }
    }

    function closeDeleteModal() {
        if (deleteModalOverlay) {
            deleteModalOverlay.classList.remove("active");
            todoToDelete = null;
        }
    }

    // Attach modal event listeners
    if (newTodoBtn) {
        newTodoBtn.addEventListener("click", function () {
            // Set default date to current selected date
            document.getElementById("todo-date").value = formattedDate;
            openModal();
        });
    }

    // Add event listeners to all modal close buttons
    const closeModalButtons = document.querySelectorAll(".modal-close");
    if (closeModalButtons.length > 0) {
        closeModalButtons.forEach((btn) => {
            btn.addEventListener("click", closeModal);
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener("click", function (e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // Delete modal event listeners
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    }

    if (deleteModalOverlay) {
        deleteModalOverlay.addEventListener("click", function (e) {
            if (e.target === deleteModalOverlay) {
                closeDeleteModal();
            }
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", function () {
            if (todoToDelete) {
                deleteTodo(todoToDelete);
            }
        });
    }

    // Load todos for the current date
    async function loadTodos() {
        if (!todoList) return;

        try {
            const includeShared =
                includeSharedToggle && includeSharedToggle.checked;
            const response = await fetch(
                `/api/todos/date/${formattedDate}?includeShared=${includeShared}`,
            );

            if (!response.ok) {
                throw new Error("Failed to fetch todos");
            }

            const data = await response.json();
            const todos = data.combined || [];

            // Clear existing todos
            todoList.innerHTML = "";

            if (todos.length === 0) {
                todoList.innerHTML =
                    '<li class="no-todos">No todos for this date</li>';
                return;
            }

            // Add todos to the list
            todos.forEach((todo) => {
                const isShared = todo.owner && todo.owner._id !== undefined;
                const todoItem = document.createElement("li");
                todoItem.className = `todo-item ${
                    todo.completed ? "todo-completed" : ""
                } ${isShared ? "todo-shared" : ""}`;
                todoItem.dataset.id = todo._id;

                const todoContent = `
                    <div class="todo-text">
                        <div class="todo-title">${todo.title}</div>
                        <div class="todo-description">${
                            todo.description || ""
                        }</div>
                        ${
                            isShared
                                ? `<div class="todo-owner">Shared by: ${todo.owner.username}</div>`
                                : ""
                        }
                    </div>
                    <div class="todo-actions">
                        ${
                            todo.completed
                                ? `<button class="incomplete-btn" title="Mark as incomplete"><i class="fas fa-undo"></i></button>`
                                : `<button class="complete-btn" title="Mark as complete"><i class="fas fa-check"></i></button>`
                        }
                        <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                todoItem.innerHTML = todoContent;
                todoList.appendChild(todoItem);

                // Add event listeners for todo actions
                const completeBtn = todoItem.querySelector(".complete-btn");
                const incompleteBtn = todoItem.querySelector(".incomplete-btn");
                const editBtn = todoItem.querySelector(".edit-btn");
                const deleteBtn = todoItem.querySelector(".delete-btn");

                if (completeBtn) {
                    completeBtn.addEventListener("click", () =>
                        toggleTodoComplete(todo._id, true),
                    );
                }

                if (incompleteBtn) {
                    incompleteBtn.addEventListener("click", () =>
                        toggleTodoComplete(todo._id, false),
                    );
                }

                if (editBtn) {
                    editBtn.addEventListener("click", () => editTodo(todo));
                }

                if (deleteBtn) {
                    deleteBtn.addEventListener("click", () =>
                        openDeleteModal(todo._id),
                    );
                }
            });
        } catch (error) {
            console.error("Error loading todos:", error);
            todoList.innerHTML =
                '<li class="error-message">Failed to load todos</li>';
        }
    }

    // Toggle todo complete status
    async function toggleTodoComplete(todoId, completed) {
        try {
            const response = await fetch(`/api/todos/${todoId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ completed }),
            });

            if (!response.ok) {
                throw new Error("Failed to update todo");
            }

            // Show feedback
            showFeedback(
                completed
                    ? "Todo marked as complete!"
                    : "Todo marked as incomplete!",
                "success",
            );

            // Reload todos to reflect the change
            loadTodos();

            // Refresh calendar data if available
            if (typeof updateCalendarTodos === "function") {
                updateCalendarTodos();
            }
        } catch (error) {
            console.error("Error toggling todo completion:", error);
            showFeedback("Failed to update todo: " + error.message, "error");
        }
    }

    // Edit todo
    function editTodo(todo) {
        // Set form fields with todo data
        document.getElementById("todo-title").value = todo.title;
        document.getElementById("todo-description").value =
            todo.description || "";
        document.getElementById("todo-date").value = new Date(todo.dueDate)
            .toISOString()
            .split("T")[0];

        // Set edit mode
        currentTodoId = todo._id;
        isEditMode = true;
        document.getElementById("todo-form-title").textContent = "Edit Todo";
        document.getElementById("todo-form-submit").textContent = "Update Todo";

        // Open modal
        openModal();
    }

    // Delete todo
    async function deleteTodo(todoId) {
        try {
            const response = await fetch(`/api/todos/${todoId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete todo");
            }

            // Close the delete modal
            closeDeleteModal();

            // Show success feedback
            showFeedback("Todo deleted successfully", "success");

            // Reload todos to reflect the change
            loadTodos();

            // Refresh calendar data if available
            if (typeof updateCalendarTodos === "function") {
                updateCalendarTodos();
            }
        } catch (error) {
            console.error("Error deleting todo:", error);
            closeDeleteModal();
            showFeedback("Failed to delete todo: " + error.message, "error");
        }
    }

    // Show feedback message
    function showFeedback(message, type) {
        const feedbackElement = document.createElement("div");
        feedbackElement.className = `feedback ${type}`;
        feedbackElement.textContent = message;
        feedbackElement.style.position = "fixed";
        feedbackElement.style.top = "20px";
        feedbackElement.style.left = "50%";
        feedbackElement.style.transform = "translateX(-50%)";
        feedbackElement.style.zIndex = "9999";

        document.body.appendChild(feedbackElement);

        // Remove the feedback element after 3 seconds
        setTimeout(() => {
            feedbackElement.remove();
        }, 3000);
    }

    // Handle todo form submit
    if (todoForm) {
        todoForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const title = document.getElementById("todo-title").value;
            const description =
                document.getElementById("todo-description").value;
            const dueDate = document.getElementById("todo-date").value;

            const todoData = {
                title,
                description,
                dueDate,
            };

            try {
                let response;

                if (isEditMode && currentTodoId) {
                    // Update existing todo
                    response = await fetch(`/api/todos/${currentTodoId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(todoData),
                    });
                } else {
                    // Create new todo
                    response = await fetch("/api/todos", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(todoData),
                    });
                }

                if (!response.ok) {
                    throw new Error("Failed to save todo");
                }

                // Close modal
                closeModal();

                // Show success feedback
                showFeedback(
                    isEditMode
                        ? "Todo updated successfully"
                        : "Todo added successfully",
                    "success",
                );

                // If the todo date matches current date, reload the list
                if (dueDate === formattedDate) {
                    loadTodos();
                } else {
                    // If date is different, optionally switch to that date
                    if (
                        confirm(
                            "Todo added for a different date. View that date instead?",
                        )
                    ) {
                        currentDate = new Date(dueDate);
                        formattedDate = dueDate;
                        updateDateDisplay();
                        loadTodos();

                        // Update calendar if it exists
                        if (typeof selectCalendarDate === "function") {
                            selectCalendarDate(new Date(dueDate));
                        }
                    }
                }

                // Refresh calendar data if available
                if (typeof updateCalendarTodos === "function") {
                    updateCalendarTodos();
                }
            } catch (error) {
                console.error("Error saving todo:", error);
                showFeedback("Error saving todo: " + error.message, "error");
            }
        });
    }

    // Include shared todos toggle
    if (includeSharedToggle) {
        includeSharedToggle.addEventListener("change", loadTodos);
    }

    // Navigation buttons
    const prevDayBtn = document.getElementById("prev-day");
    const nextDayBtn = document.getElementById("next-day");
    const todayBtn = document.getElementById("today-btn");

    if (prevDayBtn) {
        prevDayBtn.addEventListener("click", function () {
            currentDate.setDate(currentDate.getDate() - 1);
            formattedDate = currentDate.toISOString().split("T")[0];
            updateDateDisplay();
            loadTodos();

            // Update calendar if it exists
            if (typeof selectCalendarDate === "function") {
                selectCalendarDate(currentDate);
            }
        });
    }

    if (nextDayBtn) {
        nextDayBtn.addEventListener("click", function () {
            currentDate.setDate(currentDate.getDate() + 1);
            formattedDate = currentDate.toISOString().split("T")[0];
            updateDateDisplay();
            loadTodos();

            // Update calendar if it exists
            if (typeof selectCalendarDate === "function") {
                selectCalendarDate(currentDate);
            }
        });
    }

    if (todayBtn) {
        todayBtn.addEventListener("click", function () {
            currentDate = new Date();
            formattedDate = currentDate.toISOString().split("T")[0];
            updateDateDisplay();
            loadTodos();

            // Update calendar if it exists
            if (typeof selectCalendarDate === "function") {
                selectCalendarDate(currentDate);
            }
        });
    }

    // Make functions available globally
    window.loadTodos = loadTodos;
    window.currentDate = currentDate;
    window.formattedDate = formattedDate;
    window.updateDateDisplay = updateDateDisplay;

    // Initial load of todos
    if (todoList) {
        loadTodos();
    }
});
