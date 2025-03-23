// Format date for API (preserving local date)
function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
} // Calendar functionality
document.addEventListener("DOMContentLoaded", function () {
    const calendarDays = document.getElementById("calendar-days");
    const calendarMonth = document.getElementById("calendar-month");
    const prevMonthBtn = document.getElementById("prev-month");
    const nextMonthBtn = document.getElementById("next-month");

    // Calendar state
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDate = new Date();
    let daysWithTodos = {}; // Will store dates that have todos with count

    // Month names
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    // Day names
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Initialize calendar
    function initCalendar() {
        if (!calendarDays || !calendarMonth) return;

        // Set up day names header if it doesn't exist yet
        if (!document.querySelector(".calendar-days-names")) {
            const dayNamesWrapper = document.createElement("div");
            dayNamesWrapper.className = "calendar-days-wrapper";

            const dayNamesRow = document.createElement("div");
            dayNamesRow.className = "calendar-days calendar-days-names";

            days.forEach((day) => {
                const dayNameElement = document.createElement("div");
                dayNameElement.className = "calendar-day-name";
                dayNameElement.textContent = day;
                dayNamesRow.appendChild(dayNameElement);
            });

            dayNamesWrapper.appendChild(dayNamesRow);

            // Insert day names before the calendar days
            calendarDays.parentNode.insertBefore(dayNamesWrapper, calendarDays);
        }

        // Add event listeners for navigation
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener("click", () => {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                updateCalendarTodos().then(() => {
                    updateCalendar();
                });
            });
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener("click", () => {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                updateCalendarTodos().then(() => {
                    updateCalendar();
                });
            });
        }

        // Initial calendar update
        updateCalendarTodos().then(() => {
            updateCalendar();
        });
    }

    // Fetch todos for the current month
    async function updateCalendarTodos() {
        try {
            // Get month range
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

            // Format dates for API
            const startDateStr = formatDateForAPI(startOfMonth);
            const endDateStr = formatDateForAPI(endOfMonth);

            // Get all todos for the month
            const response = await fetch(
                `/api/todos?startDate=${startDateStr}&endDate=${endDateStr}&includeShared=true`,
            );

            if (!response.ok) {
                throw new Error("Failed to fetch todos for month");
            }

            const data = await response.json();
            const allTodos = data.combined || [];

            // Extract dates that have todos with count
            daysWithTodos = {};
            allTodos.forEach((todo) => {
                const todoDate = new Date(todo.dueDate);
                // Only include if it's in the current month view
                if (
                    todoDate.getMonth() === currentMonth &&
                    todoDate.getFullYear() === currentYear
                ) {
                    const day = todoDate.getDate();
                    if (!daysWithTodos[day]) {
                        daysWithTodos[day] = 1;
                    } else {
                        daysWithTodos[day]++;
                    }
                }
            });

            // If calendar is already displayed, update it
            updateCalendarTodoHighlights();

            return daysWithTodos;
        } catch (error) {
            console.error("Error fetching todos for month:", error);
            return {};
        }
    }

    // Update calendar display
    function updateCalendar() {
        if (!calendarDays || !calendarMonth) return;

        // Update month and year display
        calendarMonth.textContent = `${months[currentMonth]} ${currentYear}`;

        // Clear calendar days
        calendarDays.innerHTML = "";

        // Get first day of month and total days
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(
            currentYear,
            currentMonth + 1,
            0,
        ).getDate();

        // Get today's date for highlighting
        const today = new Date();
        const isCurrentMonth =
            today.getMonth() === currentMonth &&
            today.getFullYear() === currentYear;
        const todayDate = today.getDate();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement("div");
            emptyDay.className = "calendar-day empty";
            calendarDays.appendChild(emptyDay);
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement("div");
            dayElement.className = "calendar-day";
            dayElement.textContent = day;

            // Check if this is the selected date
            const currentDate = new Date(currentYear, currentMonth, day);
            const selectedDateObj = new Date(selectedDate);

            const isSelected =
                currentDate.getDate() === selectedDateObj.getDate() &&
                currentDate.getMonth() === selectedDateObj.getMonth() &&
                currentDate.getFullYear() === selectedDateObj.getFullYear();

            // Mark today's date
            const isToday = isCurrentMonth && day === todayDate;

            // Mark days with todos and add count badge
            const todoCount = daysWithTodos[day] || 0;
            const hasTodos = todoCount > 0;

            // Apply classes
            if (isSelected) dayElement.classList.add("active");
            if (isToday) dayElement.classList.add("today");

            if (hasTodos) {
                dayElement.classList.add("has-todos");

                // Add todo count as a badge
                const todoCountBadge = document.createElement("span");
                todoCountBadge.className = "todo-count-badge";
                todoCountBadge.textContent = todoCount;
                dayElement.appendChild(todoCountBadge);

                // Add intensity class based on number of todos
                if (todoCount >= 5) {
                    dayElement.classList.add("has-many-todos");
                } else if (todoCount >= 3) {
                    dayElement.classList.add("has-several-todos");
                }
            }

            // Add click event to select date
            dayElement.addEventListener("click", () => selectDate(day));

            calendarDays.appendChild(dayElement);
        }
    }

    // Update just the todo highlights without redrawing the calendar
    function updateCalendarTodoHighlights() {
        if (!calendarDays) return;

        const dayElements = calendarDays.querySelectorAll(
            ".calendar-day:not(.empty)",
        );

        dayElements.forEach((dayEl) => {
            const day = parseInt(dayEl.textContent, 10);
            const todoCount = daysWithTodos[day] || 0;
            const hasTodos = todoCount > 0;

            // Remove existing badges
            const existingBadge = dayEl.querySelector(".todo-count-badge");
            if (existingBadge) {
                dayEl.removeChild(existingBadge);
            }

            // Remove all todo-related classes
            dayEl.classList.remove(
                "has-todos",
                "has-several-todos",
                "has-many-todos",
            );

            if (hasTodos) {
                dayEl.classList.add("has-todos");

                // Add todo count as a badge
                const todoCountBadge = document.createElement("span");
                todoCountBadge.className = "todo-count-badge";
                todoCountBadge.textContent = todoCount;
                dayEl.appendChild(todoCountBadge);

                // Add intensity class based on number of todos
                if (todoCount >= 5) {
                    dayEl.classList.add("has-many-todos");
                } else if (todoCount >= 3) {
                    dayEl.classList.add("has-several-todos");
                }
            }
        });
    }

    // Select a date on the calendar
    function selectDate(day) {
        selectedDate = new Date(currentYear, currentMonth, day);
        const formattedDate = formatDateForAPI(selectedDate);

        // Update active class on calendar
        const calendarDayElements =
            calendarDays.querySelectorAll(".calendar-day");
        calendarDayElements.forEach((dayEl) => {
            dayEl.classList.remove("active");
            if (
                parseInt(dayEl.textContent) === day &&
                !dayEl.classList.contains("empty")
            ) {
                dayEl.classList.add("active");
            }
        });

        // Update the main date in todos.js
        if (
            window.setCurrentDate &&
            typeof window.setCurrentDate === "function"
        ) {
            window.setCurrentDate(selectedDate);
        } else {
            // Fallback direct assignment (less ideal)
            if (window.currentDate) {
                window.currentDate = new Date(selectedDate);
            }
            if (window.formattedDate) {
                window.formattedDate = formattedDate;
            }
            // Update date display
            if (
                window.updateDateDisplay &&
                typeof window.updateDateDisplay === "function"
            ) {
                window.updateDateDisplay();
            }
        }

        // Trigger animation effect on selection
        const selectedDayEl = Array.from(calendarDayElements).find(
            (el) =>
                parseInt(el.textContent) === day &&
                !el.classList.contains("empty"),
        );
        if (selectedDayEl) {
            selectedDayEl.classList.add("pulse-animation");
            setTimeout(() => {
                selectedDayEl.classList.remove("pulse-animation");
            }, 500);
        }

        // Reload todos for the selected date
        if (window.loadTodos && typeof window.loadTodos === "function") {
            window.loadTodos();
        }
    }

    // Make functions available globally
    window.updateCalendarTodos = updateCalendarTodos;
    window.selectCalendarDate = function (date) {
        // Create a new date object to avoid reference issues
        const newDate = new Date(date);

        // Only update if date is in current month view
        if (
            newDate.getMonth() === currentMonth &&
            newDate.getFullYear() === currentYear
        ) {
            selectDate(newDate.getDate());
        } else {
            // Change month view and then select date
            currentMonth = newDate.getMonth();
            currentYear = newDate.getFullYear();
            selectedDate = new Date(newDate);

            updateCalendarTodos().then(() => {
                updateCalendar();

                // Make sure to select the date after the calendar is updated
                const dayElements = calendarDays.querySelectorAll(
                    ".calendar-day:not(.empty)",
                );
                dayElements.forEach((dayEl) => {
                    if (parseInt(dayEl.textContent) === newDate.getDate()) {
                        dayEl.classList.add("active");
                    }
                });

                // Also make sure to update the current date in todos.js
                if (
                    window.setCurrentDate &&
                    typeof window.setCurrentDate === "function"
                ) {
                    window.setCurrentDate(newDate);
                }
            });
        }
    };

    // Initialize calendar if elements exist
    if (calendarDays && calendarMonth) {
        initCalendar();
    }
});
