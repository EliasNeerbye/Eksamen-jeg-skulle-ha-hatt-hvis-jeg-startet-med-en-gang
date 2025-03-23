function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

document.addEventListener("DOMContentLoaded", function () {
    const calendarDays = document.getElementById("calendar-days");
    const calendarMonth = document.getElementById("calendar-month");
    const prevMonthBtn = document.getElementById("prev-month");
    const nextMonthBtn = document.getElementById("next-month");

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDate = new Date();
    let daysWithTodos = {};

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

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    function initCalendar() {
        if (!calendarDays || !calendarMonth) return;

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
            calendarDays.parentNode.insertBefore(dayNamesWrapper, calendarDays);
        }

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

        updateCalendarTodos().then(() => {
            updateCalendar();
        });
    }

    async function updateCalendarTodos() {
        try {
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

            const startDateStr = formatDateForAPI(startOfMonth);
            const endDateStr = formatDateForAPI(endOfMonth);

            const response = await fetch(
                `/api/todos?startDate=${startDateStr}&endDate=${endDateStr}&includeShared=true`,
            );

            if (!response.ok) {
                throw new Error("Failed to fetch todos for month");
            }

            const data = await response.json();
            const allTodos = data.combined || [];

            daysWithTodos = {};
            allTodos.forEach((todo) => {
                const todoDate = new Date(todo.dueDate);
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

            updateCalendarTodoHighlights();

            return daysWithTodos;
        } catch (error) {
            console.error("Error fetching todos for month:", error);
            return {};
        }
    }

    function updateCalendar() {
        if (!calendarDays || !calendarMonth) return;

        calendarMonth.textContent = `${months[currentMonth]} ${currentYear}`;

        calendarDays.innerHTML = "";

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(
            currentYear,
            currentMonth + 1,
            0,
        ).getDate();

        const today = new Date();
        const isCurrentMonth =
            today.getMonth() === currentMonth &&
            today.getFullYear() === currentYear;
        const todayDate = today.getDate();

        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement("div");
            emptyDay.className = "calendar-day empty";
            calendarDays.appendChild(emptyDay);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement("div");
            dayElement.className = "calendar-day";
            dayElement.textContent = day;

            const currentDate = new Date(currentYear, currentMonth, day);
            const selectedDateObj = new Date(selectedDate);

            const isSelected =
                currentDate.getDate() === selectedDateObj.getDate() &&
                currentDate.getMonth() === selectedDateObj.getMonth() &&
                currentDate.getFullYear() === selectedDateObj.getFullYear();

            const isToday = isCurrentMonth && day === todayDate;

            const todoCount = daysWithTodos[day] || 0;
            const hasTodos = todoCount > 0;

            if (isSelected) dayElement.classList.add("active");
            if (isToday) dayElement.classList.add("today");

            if (hasTodos) {
                dayElement.classList.add("has-todos");

                const todoCountBadge = document.createElement("span");
                todoCountBadge.className = "todo-count-badge";
                todoCountBadge.textContent = todoCount;
                dayElement.appendChild(todoCountBadge);

                if (todoCount >= 5) {
                    dayElement.classList.add("has-many-todos");
                } else if (todoCount >= 3) {
                    dayElement.classList.add("has-several-todos");
                }
            }

            dayElement.addEventListener("click", () => selectDate(day));

            calendarDays.appendChild(dayElement);
        }
    }

    function updateCalendarTodoHighlights() {
        if (!calendarDays) return;

        const dayElements = calendarDays.querySelectorAll(
            ".calendar-day:not(.empty)",
        );

        dayElements.forEach((dayEl) => {
            const day = parseInt(dayEl.textContent, 10);
            const todoCount = daysWithTodos[day] || 0;
            const hasTodos = todoCount > 0;

            const wasActive = dayEl.classList.contains("active");

            const existingBadge = dayEl.querySelector(".todo-count-badge");
            if (existingBadge) {
                dayEl.removeChild(existingBadge);
            }

            dayEl.classList.remove(
                "has-todos",
                "has-several-todos",
                "has-many-todos",
            );

            if (wasActive) {
                dayEl.classList.add("active");
            }

            if (hasTodos) {
                dayEl.classList.add("has-todos");

                const todoCountBadge = document.createElement("span");
                todoCountBadge.className = "todo-count-badge";
                todoCountBadge.textContent = todoCount;
                dayEl.appendChild(todoCountBadge);

                if (todoCount >= 5) {
                    dayEl.classList.add("has-many-todos");
                } else if (todoCount >= 3) {
                    dayEl.classList.add("has-several-todos");
                }
            }
        });
    }

    function selectDate(day) {
        selectedDate = new Date(currentYear, currentMonth, day);
        const formattedDate = formatDateForAPI(selectedDate);

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

        if (
            window.setCurrentDate &&
            typeof window.setCurrentDate === "function"
        ) {
            window.setCurrentDate(selectedDate);
        } else {
            if (window.currentDate) {
                window.currentDate = new Date(selectedDate);
            }
            if (window.formattedDate) {
                window.formattedDate = formattedDate;
            }
            if (
                window.updateDateDisplay &&
                typeof window.updateDateDisplay === "function"
            ) {
                window.updateDateDisplay();
            }
        }

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

        if (window.loadTodos && typeof window.loadTodos === "function") {
            window.loadTodos();
        }
    }

    window.updateCalendarTodos = updateCalendarTodos;
    window.updateCalendar = updateCalendar;

    window.selectCalendarDate = function (date) {
        const newDate = new Date(date);

        if (
            newDate.getMonth() === currentMonth &&
            newDate.getFullYear() === currentYear
        ) {
            selectDate(newDate.getDate());
        } else {
            currentMonth = newDate.getMonth();
            currentYear = newDate.getFullYear();
            selectedDate = new Date(newDate);

            updateCalendarTodos().then(() => {
                updateCalendar();

                setTimeout(() => {
                    const dayElements = calendarDays.querySelectorAll(
                        ".calendar-day:not(.empty)",
                    );
                    dayElements.forEach((dayEl) => {
                        if (parseInt(dayEl.textContent) === newDate.getDate()) {
                            dayEl.classList.add("active");
                        }
                    });
                }, 50);

                if (
                    window.setCurrentDate &&
                    typeof window.setCurrentDate === "function"
                ) {
                    window.setCurrentDate(newDate);
                }
            });
        }
    };

    if (calendarDays && calendarMonth) {
        initCalendar();
    }
});
