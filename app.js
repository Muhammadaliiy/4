"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TodoApp {
    todos = [];
    currentFilter = 'all';
    todoInput;
    todoList;
    filterButtons;
    todoCount;
    clearCompleted;
    constructor() {
        this.init();
    }
    init() {
        this.loadFromStorage();
        this.setupDOMElements();
        this.setupEventListeners();
        this.render();
    }
    setupDOMElements() {
        this.todoInput = document.getElementById('todo-input');
        this.todoList = document.getElementById('todo-list');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.todoCount = document.getElementById('todo-count-number');
        this.clearCompleted = document.getElementById('clear-completed');
    }
    setupEventListeners() {
        // Add new todo
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.todoInput.value.trim()) {
                this.addTodo(this.todoInput.value.trim());
                this.todoInput.value = '';
            }
        });
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = btn.dataset.filter;
                this.setFilter(filter);
            });
        });
        // Clear completed
        this.clearCompleted.addEventListener('click', () => {
            this.clearCompletedTodos();
        });
    }
    addTodo(title) {
        const todo = {
            id: this.generateId(),
            title,
            completed: false,
            createdAt: new Date()
        };
        this.todos.unshift(todo);
        this.saveToStorage();
        this.render();
    }
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
        }
    }
    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveToStorage();
        this.render();
    }
    editTodo(id, newTitle) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newTitle.trim()) {
            todo.title = newTitle.trim();
            this.saveToStorage();
            this.render();
        }
    }
    setFilter(filter) {
        this.currentFilter = filter;
        this.updateFilterButtons();
        this.render();
    }
    updateFilterButtons() {
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.filter === this.currentFilter);
        });
    }
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }
    clearCompletedTodos() {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveToStorage();
        this.render();
    }
    render() {
        this.renderTodos();
        this.updateTodoCount();
        this.updateFilterButtons();
        this.updateEmptyState();
    }
    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        this.todoList.innerHTML = filteredTodos.map(todo => `
            <li class="${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="view">
                    <input class="toggle" type="checkbox" ${todo.completed ? 'checked' : ''} 
                           onchange="todoApp.toggleTodoPublic('${todo.id}')">
                    <label ondblclick="todoApp.startEdit('${todo.id}')">${todo.title}</label>
                    <button class="destroy" onclick="todoApp.deleteTodoPublic('${todo.id}')"></button>
                </div>
                <input class="edit" value="${todo.title}" 
                       onblur="todoApp.finishEdit('${todo.id}', this.value)"
                       onkeypress="if(event.key==='Enter') this.blur(); if(event.key==='Escape') todoApp.cancelEdit('${todo.id}')">
            </li>
        `).join('');
    }
    updateTodoCount() {
        const activeTodos = this.todos.filter(t => !t.completed).length;
        this.todoCount.textContent = activeTodos.toString();
        const countSpan = this.todoCount.parentElement;
        if (countSpan) {
            const itemText = activeTodos === 1 ? 'item left' : 'items left';
            countSpan.innerHTML = `<strong>${activeTodos}</strong> ${itemText}`;
        }
    }
    updateEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const footer = document.getElementById('footer');
        const mainSection = document.querySelector('.main-section');
        if (this.todos.length === 0) {
            emptyState.style.display = 'block';
            footer.style.display = 'none';
            mainSection.style.display = 'none';
        }
        else {
            emptyState.style.display = 'none';
            footer.style.display = 'flex';
            mainSection.style.display = 'block';
        }
        // Update clear completed button visibility
        const hasCompleted = this.todos.some(t => t.completed);
        this.clearCompleted.style.display = hasCompleted ? 'block' : 'none';
    }
    startEdit(id) {
        const todoItem = document.querySelector(`[data-id="${id}"]`);
        if (todoItem) {
            todoItem.classList.add('editing');
            const input = todoItem.querySelector('.edit');
            input.focus();
            input.select();
        }
    }
    finishEdit(id, newTitle) {
        const todoItem = document.querySelector(`[data-id="${id}"]`);
        if (todoItem) {
            todoItem.classList.remove('editing');
            if (newTitle.trim()) {
                this.editTodo(id, newTitle);
            }
            else {
                this.deleteTodo(id);
            }
        }
    }
    cancelEdit(id) {
        const todoItem = document.querySelector(`[data-id="${id}"]`);
        if (todoItem) {
            todoItem.classList.remove('editing');
        }
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    saveToStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
    loadFromStorage() {
        const stored = localStorage.getItem('todos');
        if (stored) {
            this.todos = JSON.parse(stored).map((todo) => ({
                ...todo,
                createdAt: new Date(todo.createdAt)
            }));
        }
    }
    // Public methods for global access
    toggleTodoPublic = (id) => this.toggleTodo(id);
    deleteTodoPublic = (id) => this.deleteTodo(id);
}
// Initialize the app
let todoApp;
document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
    // Make todoApp globally accessible for inline event handlers
    window.todoApp = todoApp;
});
//# sourceMappingURL=app.js.map