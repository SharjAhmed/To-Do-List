// Selecting elements
const todoInput = document.querySelector(".todo-input");
const todoButton = document.querySelector(".todo-button");
const todoList = document.querySelector(".todo-list");
const filterOption = document.querySelector(".filter-todo");

// Event listeners
document.addEventListener("DOMContentLoaded", getTodos);
todoButton.addEventListener("click", addTodo);
todoList.addEventListener("click", deleteCheck);
filterOption.addEventListener("click", filterTodo);

// Variables for drag and drop
let draggedItem = null;
let dragOverItem = null;

// Create the drop indicator line
const dropIndicator = document.createElement('div');
dropIndicator.style.height = '4px';
dropIndicator.style.backgroundColor = 'rgb(255, 200, 0)';
dropIndicator.style.margin = '4px 0';
dropIndicator.style.borderRadius = '2px';

function makeTodoDraggable(todoDiv) {
    todoDiv.setAttribute('draggable', true);
    todoDiv.addEventListener('dragstart', dragStart);
    todoDiv.addEventListener('dragover', dragOver);
    todoDiv.addEventListener('drop', drop);
    todoDiv.addEventListener('dragenter', dragEnter);
    todoDiv.addEventListener('dragleave', dragLeave);
    todoDiv.addEventListener('dragend', dragEnd);
}

function dragStart(e) {
    draggedItem = this;
    setTimeout(() => this.style.display = 'none', 0);
}

function dragOver(e) {
    e.preventDefault();
    if (this === draggedItem) return;

    const bounding = this.getBoundingClientRect();
    const offset = e.clientY - bounding.top;
    const halfway = bounding.height / 2;
    const todoListParent = this.parentNode;

    if (todoListParent.contains(dropIndicator)) {
        todoListParent.removeChild(dropIndicator);
    }

    if (offset < halfway) {
        todoListParent.insertBefore(dropIndicator, this);
    } else {
        todoListParent.insertBefore(dropIndicator, this.nextSibling);
    }

    dragOverItem = this;
}

function dragEnter(e) {
    e.preventDefault();
}

function dragLeave(e) {
    const todoListParent = this.parentNode;
    if (todoListParent.contains(dropIndicator)) {
        todoListParent.removeChild(dropIndicator);
    }
}

function drop(e) {
    e.preventDefault();
    const todoListParent = this.parentNode;

    if (todoListParent.contains(dropIndicator)) {
        todoListParent.removeChild(dropIndicator);
    }

    if (this !== draggedItem) {
        const bounding = this.getBoundingClientRect();
        const offset = e.clientY - bounding.top;
        const halfway = bounding.height / 2;

        if (offset < halfway) {
            todoListParent.insertBefore(draggedItem, this);
        } else {
            todoListParent.insertBefore(draggedItem, this.nextSibling);
        }
        saveOrderToLocalStorage();
    }
}

function dragEnd() {
    this.style.display = 'flex';
    draggedItem = null;
    dragOverItem = null;
    if (dropIndicator.parentNode) {
        dropIndicator.parentNode.removeChild(dropIndicator);
    }
}

// Save order and completed state to localStorage
function saveOrderToLocalStorage() {
    const todos = [];
    todoList.querySelectorAll('.todo').forEach(todoDiv => {
        const text = todoDiv.querySelector('.todo-item').innerText;
        const completed = todoDiv.classList.contains('completed');
        todos.push({ text, completed });
    });
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Add new todo and save with completed:false
function addTodo(event) {
    event.preventDefault();
    if (todoInput.value.trim() === '') return; // Prevent adding empty

    const todoDiv = document.createElement('div');
    todoDiv.classList.add('todo');
    makeTodoDraggable(todoDiv);

    // Drag handle for visual drag indication
    const dragHandle = document.createElement("span");
    dragHandle.innerHTML = "&#9776;"; // hamburger menu icon (☰)
    dragHandle.classList.add("drag-handle");
    todoDiv.appendChild(dragHandle);

    const newTodo = document.createElement('li');
    newTodo.innerText = todoInput.value;
    newTodo.classList.add('todo-item');
    todoDiv.appendChild(newTodo);

    const completedButton = document.createElement('button');
    completedButton.innerHTML = '<i class="fas fa-check-circle"></i>';
    completedButton.classList.add('complete-btn');
    todoDiv.appendChild(completedButton);

    const trashButton = document.createElement('button');
    trashButton.innerHTML = '<i class="fas fa-trash"></i>';
    trashButton.classList.add('trash-btn');
    todoDiv.appendChild(trashButton);

    todoList.appendChild(todoDiv);

    saveLocalTodos({ text: todoInput.value, completed: false });
    todoInput.value = "";
}

// Remove a todo from localStorage by text match
function removeLocalTodos(todo) {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    const todoText = todo.children[1].innerText; // dragHandle at index 0 now, todo-item at 1
    todos = todos.filter(t => t.text !== todoText);
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Update todo's completed status in localStorage
function updateCompletedStatus(todo, completed) {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    todos = todos.map(t => {
        if (t.text === todo.children[1].innerText) {
            return { text: t.text, completed: completed };
        }
        return t;
    });
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Handle clicks for delete and complete toggle
function deleteCheck(e) {
    const item = e.target;

    if (item.classList[0] === "trash-btn") {
        const todo = item.parentElement;
        todo.classList.add("slide");
        removeLocalTodos(todo);
        todo.addEventListener("transitionend", function () {
            todo.remove();
            saveOrderToLocalStorage();
        });
    }

    if (item.classList[0] === "complete-btn") {
        const todo = item.parentElement;
        todo.classList.toggle("completed");
        const isCompleted = todo.classList.contains("completed");
        
        // Move completed task to bottom, incomplete to top
        if (isCompleted) {
            todoList.appendChild(todo);
        } else {
            todoList.insertBefore(todo, todoList.firstChild);
        }
        updateCompletedStatus(todo, isCompleted);
        saveOrderToLocalStorage();
    }
}

// Filter todos based on selection
function filterTodo(e) {
    const todos = todoList.childNodes;
    todos.forEach(function (todo) {
        if (todo.nodeType !== 1) return; // Ignore non-element nodes
        switch (e.target.value) {
            case "all":
                todo.style.display = "flex";
                break;
            case "completed":
                if (todo.classList.contains("completed")) {
                    todo.style.display = "flex";
                } else {
                    todo.style.display = "none";
                }
                break;
            case "incomplete":
                if (!todo.classList.contains("completed")) {
                    todo.style.display = "flex";
                } else {
                    todo.style.display = "none";
                }
                break;
        }
    });
}

// Load todos from localStorage with completed state and draggable
function getTodos() {
    let todos = JSON.parse(localStorage.getItem("todos")) || [];
    todos.forEach(({ text, completed }) => {
        const todoDiv = document.createElement("div");
        todoDiv.classList.add("todo");
        if (completed) todoDiv.classList.add("completed");
        makeTodoDraggable(todoDiv);

        // Drag handle for visual drag indication
        const dragHandle = document.createElement("span");
        dragHandle.innerHTML = "&#9776;"; // hamburger menu icon (☰)
        dragHandle.classList.add("drag-handle");
        todoDiv.appendChild(dragHandle);

        const newTodo = document.createElement("li");
        newTodo.innerText = text;
        newTodo.classList.add("todo-item");
        todoDiv.appendChild(newTodo);

        const completedButton = document.createElement("button");
        completedButton.innerHTML = '<i class="fas fa-check-circle"></i>';
        completedButton.classList.add("complete-btn");
        todoDiv.appendChild(completedButton);

        const trashButton = document.createElement("button");
        trashButton.innerHTML = '<i class="fas fa-trash"></i>';
        trashButton.classList.add("trash-btn");
        todoDiv.appendChild(trashButton);

        todoList.appendChild(todoDiv);
    });
}
