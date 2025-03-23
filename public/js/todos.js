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
    const prevDayBtn = document.getElementById("prev-day");
    const nextDayBtn = document.getElementById("next-day");
    const todayBtn = document.getElementById("today-btn");

    if (includeSharedToggle) {
        includeSharedToggle.checked = true;
    }

    // Current selected date (defaults to today)
    let currentDate = new Date();
    let formattedDate = formatDateForAPI(currentDate);
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

    // Format date for API (preserving local date)
    function formatDateForAPI(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
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
            todoList.innerHTML = '<li class="loading">Loading todos...</li>';

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

                // Add fade-in animation
                setTimeout(() => {
                    todoItem.classList.add("todo-item-visible");
                }, 50 * todos.indexOf(todo));

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

        // Add entrance animation
        setTimeout(() => {
            feedbackElement.classList.add("feedback-visible");
        }, 10);

        // Remove the feedback element after 3 seconds
        setTimeout(() => {
            feedbackElement.classList.remove("feedback-visible");
            setTimeout(() => {
                feedbackElement.remove();
            }, 300);
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
                        currentDate = new Date(dueDate + "T12:00:00"); // Add time to avoid timezone issues
                        formattedDate = formatDateForAPI(currentDate);
                        updateDateDisplay();
                        loadTodos();

                        // Update calendar if it exists
                        if (typeof selectCalendarDate === "function") {
                            selectCalendarDate(currentDate);
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
    if (prevDayBtn) {
        prevDayBtn.addEventListener("click", function () {
            currentDate.setDate(currentDate.getDate() - 1);
            formattedDate = formatDateForAPI(currentDate);
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
            formattedDate = formatDateForAPI(currentDate);
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
            formattedDate = formatDateForAPI(currentDate);
            updateDateDisplay();
            loadTodos();

            // Update calendar if it exists
            if (typeof selectCalendarDate === "function") {
                selectCalendarDate(currentDate);
            }
        });
    }

    // Add keyboard navigation
    document.addEventListener("keydown", function (e) {
        // Only respond to keyboard shortcuts if we're on the todo page
        if (!todoList) return;

        // Left arrow: previous day
        if (e.key === "ArrowLeft" && !e.ctrlKey && !e.metaKey) {
            if (prevDayBtn) prevDayBtn.click();
        }

        // Right arrow: next day
        else if (e.key === "ArrowRight" && !e.ctrlKey && !e.metaKey) {
            if (nextDayBtn) nextDayBtn.click();
        }

        // "n" key: new todo
        else if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
            if (newTodoBtn) newTodoBtn.click();
        }

        // "t" key: today
        else if (e.key === "t" && !e.ctrlKey && !e.metaKey) {
            if (todayBtn) todayBtn.click();
        }

        // "Escape" key: close active modals
        else if (e.key === "Escape") {
            // Check for open modals and close them
            if (modalOverlay && modalOverlay.classList.contains("active")) {
                closeModal();
            } else if (
                deleteModalOverlay &&
                deleteModalOverlay.classList.contains("active")
            ) {
                closeDeleteModal();
            } else if (document.querySelector(".share-modal-overlay.active")) {
                // Call close share modal function if defined
                if (typeof closeShareModal === "function") {
                    closeShareModal();
                } else {
                    // Fallback: directly remove the active class
                    document
                        .querySelector(".share-modal-overlay.active")
                        .classList.remove("active");
                }
            }
        }
    });

    // Set current date function (for synchronization with calendar)
    function setCurrentDate(date) {
        // Create a new date object to avoid reference issues
        currentDate = new Date(date);
        formattedDate = formatDateForAPI(currentDate);
        updateDateDisplay();
    }

    // Make functions available globally
    window.loadTodos = loadTodos;
    window.currentDate = currentDate;
    window.formattedDate = formattedDate;
    window.updateDateDisplay = updateDateDisplay;
    window.setCurrentDate = setCurrentDate;

    // Initial load of todos
    if (todoList) {
        loadTodos();
    }
});
