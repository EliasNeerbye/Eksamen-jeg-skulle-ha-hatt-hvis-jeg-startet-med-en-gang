// Calendar functionality
document.addEventListener("DOMContentLoaded", function () {
    const calendarDays = document.getElementById("calendar-days");
    const calendarMonth = document.getElementById("calendar-month");
    const prevMonthBtn = document.getElementById("prev-month");
    const nextMonthBtn = document.getElementById("next-month");

    // Calendar state
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDate = new Date();
    let daysWithTodos = []; // Will store dates that have todos

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
                updateCalendar();
            });
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener("click", () => {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                updateCalendar();
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
            const startDateStr = startOfMonth.toISOString().split("T")[0];
            const endDateStr = endOfMonth.toISOString().split("T")[0];

            // Get all todos for the month
            const response = await fetch(
                `/api/todos?startDate=${startDateStr}&endDate=${endDateStr}&includeShared=true`,
            );

            if (!response.ok) {
                throw new Error("Failed to fetch todos for month");
            }

            const data = await response.json();
            const allTodos = data.combined || [];

            // Extract unique dates that have todos
            daysWithTodos = [];
            allTodos.forEach((todo) => {
                const todoDate = new Date(todo.dueDate);
                // Only include if it's in the current month view
                if (
                    todoDate.getMonth() === currentMonth &&
                    todoDate.getFullYear() === currentYear
                ) {
                    const day = todoDate.getDate();
                    if (!daysWithTodos.includes(day)) {
                        daysWithTodos.push(day);
                    }
                }
            });

            // If calendar is already displayed, update it
            if (calendarDays.childNodes.length > 0) {
                updateCalendarTodoHighlights();
            }

            return daysWithTodos;
        } catch (error) {
            console.error("Error fetching todos for month:", error);
            return [];
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

            // Mark days with todos
            const hasTodos = daysWithTodos.includes(day);

            // Apply classes
            if (isSelected) dayElement.classList.add("active");
            if (isToday) dayElement.classList.add("today");
            if (hasTodos) dayElement.classList.add("has-todos");

            // Add click event to select date
            dayElement.addEventListener("click", () => selectDate(day));

            calendarDays.appendChild(dayElement);
        }
    }

    // Update just the todo highlights without redrawing the calendar
    function updateCalendarTodoHighlights() {
        const dayElements = calendarDays.querySelectorAll(
            ".calendar-day:not(.empty)",
        );

        dayElements.forEach((dayEl) => {
            const day = parseInt(dayEl.textContent, 10);
            const hasTodos = daysWithTodos.includes(day);

            if (hasTodos) {
                dayEl.classList.add("has-todos");
            } else {
                dayEl.classList.remove("has-todos");
            }
        });
    }

    // Select a date on the calendar
    function selectDate(day) {
        selectedDate = new Date(currentYear, currentMonth, day);
        const formattedDate = selectedDate.toISOString().split("T")[0];

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

        // Update the main date display
        if (window.currentDate) {
            window.currentDate = selectedDate;
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

        // Reload todos for the selected date
        if (window.loadTodos && typeof window.loadTodos === "function") {
            window.loadTodos();
        }
    }

    // Make functions available globally
    window.updateCalendarTodos = updateCalendarTodos;
    window.selectCalendarDate = function (date) {
        // Only update if date is in current month view
        if (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
        ) {
            selectDate(date.getDate());
        } else {
            // Change month view and then select date
            currentMonth = date.getMonth();
            currentYear = date.getFullYear();
            selectedDate = date;

            updateCalendarTodos().then(() => {
                updateCalendar();
            });
        }
    };

    // Initialize calendar if elements exist
    if (calendarDays && calendarMonth) {
        initCalendar();
    }
});
