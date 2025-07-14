document.addEventListener("DOMContentLoaded", () => {
    let tasks = JSON.parse(localStorage.getItem("qtimeTasks") || "[]");
    let lastUpdated = JSON.parse(localStorage.getItem("qtimeLastUpdated") || Date.now());
    
    let anyTaskRunning = false;
    
    const taskList = document.getElementById("taskList");
    const taskForm = document.getElementById("taskForm");
    const taskNameInput = document.getElementById("taskName");
    const resetAll = document.getElementById("reset");
    
    function checkLastUpdated() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set today's date to midnight for accurate comparison
        
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const prevMonday = new Date();
        const weekOffset = (prevMonday.getDay() === 1) ? 7 : (prevMonday.getDay() + 6) % 7;
        prevMonday.setDate(prevMonday.getDate() - weekOffset);
        prevMonday.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(lastUpdated);
        targetDate.setHours(0, 0, 0, 0);
        
        // reset daily time
        if (targetDate.getTime() <= yesterday.getTime()) {
            tasks.forEach((task, i) => {
                task.time.daily = 0;
            });
        }

        // reset weekly time
        console.log(weekOffset);
        console.log(targetDate.getTime());
        console.log(prevMonday.getTime());
        if (targetDate.getTime() <= prevMonday.getTime()) {
            tasks.forEach((task, i) => {
                task.time.weekly = 0;
            });
        }
    }
    
    
    function saveTasks() {
        localStorage.setItem("qtimeTasks", JSON.stringify(tasks));
        localStorage.setItem("qtimeLastUpdated", JSON.stringify(lastUpdated));
    }
    
    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = String(totalSeconds % 60).padStart(2, '0');
        const msecs = String(ms % 1000).padStart(3, '0');
        return `${hrs}h ${mins}m ${secs}:${msecs}s`;
    }
    
    function deleteTask(index) {
        if (!anyTaskRunning && confirm("Delete task?")) {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        }
    }
    
    function toggleTask(index) {
        const task = tasks[index];
        const now = Date.now();
        
        if (task.isRunning) {
            const elapsed = now - task.startTime;
            
            task.time.total = (task.time.total || 0) + elapsed;
            task.time.daily = (task.time.daily || 0) + elapsed;
            task.time.weekly = (task.time.weekly || 0) + elapsed;
            
            task.isRunning = false;
            delete task.startTime;
            
            anyTaskRunning = false;
            
            lastUpdated = now;
        } else if (!anyTaskRunning) {
            task.startTime = now;
            task.isRunning = true;
            
            anyTaskRunning = true;
        }
        
        saveTasks();
        renderTasks();
    }
    
    function renderTasks() {
        taskList.innerHTML = "";
        tasks.forEach((task, index) => {
            const div = document.createElement("div");
            div.className = "task" + (task.isRunning ? " active" : "");
            div.innerHTML = `
                <span class="task-name">${task.name}</span>
                <div>Day: <span class="task-time" id="time-daily-${index}">${formatTime(task.time.daily || 0)}</span></div>
                <div>Week: <span class="task-time" id="time-weekly-${index}">${formatTime(task.time.weekly || 0)}</span></div>
                <div>Total: <span class="task-time" id="time-${index}">${formatTime(task.time.total || 0)}</span></div>
                <span class="task-buttons">
                    <button class="task-toggle" data-index="${index}">
                        <span class="material-icons task-toggle" data-index="${index}">
                            ${task.isRunning ? "stop" : "play_arrow"}
                        </span>
                    </button>
                    <button class="task-delete" data-index="${index}">
                        <span class="material-icons task-delete" data-index="${index}">delete</span>
                    </button>
                </span>
            `;
            taskList.appendChild(div);
        });
    }
    
    document.body.addEventListener('click', function(e) {
        //console.log(e.target);
        if (e.target.matches('.task-toggle')) {
            toggleTask(e.target.dataset.index);
        } else if (e.target.matches('.task-delete')) {
            deleteTask(e.target.dataset.index);
        }
    });
    
    taskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = taskNameInput.value.trim();
        if (!name) return;
        
        tasks.push({
            name,
            time: {
                daily: 0,
                weekly: 0,
                total: 0  
            },
            isRunning: false
        });
        saveTasks();
        renderTasks();
        taskNameInput.value = "";
    });
    
    resetAll.addEventListener("click", (e) => {
        if (confirm("Delete all tasks?")) {
            localStorage.clear();
            tasks = [];
            renderTasks();
        }
    });
    
    // Update running time every second
    setInterval(() => {
        tasks.forEach((task, i) => {
            if (task.isRunning) {
                const elapsed = Date.now() - task.startTime;
                document.getElementById(`time-${i}`).textContent = formatTime((task.time.total || 0) + elapsed);
                document.getElementById(`time-daily-${i}`).textContent = formatTime((task.time.daily || 0) + elapsed);
                document.getElementById(`time-weekly-${i}`).textContent = formatTime((task.time.weekly || 0) + elapsed);
            }
        });
    }, 1);
    
    checkLastUpdated();
    renderTasks();
});
