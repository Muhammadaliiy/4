// Todo App Types
interface Todo {
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
}

type FilterType = 'all' | 'active' | 'completed';

class TodoApp {
    private todos: Todo[] = [];
    private currentFilter: FilterType = 'all';
    private todoInput!: HTMLInputElement;
    private todoList!: HTMLElement;
    private filterButtons!: NodeListOf<HTMLElement>;
    private todoCount!: HTMLElement;
    private clearCompleted!: HTMLElement;

    constructor() {
        this.init();
    }

    private init(): void {
        this.loadFromStorage();
        this.setupDOMElements();
        this.setupEventListeners();
        this.render();
    }

    private setupDOMElements(): void {
        this.todoInput = document.getElementById('todo-input') as HTMLInputElement;
        this.todoList = document.getElementById('todo-list') as HTMLElement;
        this.filterButtons = document.querySelectorAll('.filter-btn') as NodeListOf<HTMLElement>;
        this.todoCount = document.getElementById('todo-count-number') as HTMLElement;
        this.clearCompleted = document.getElementById('clear-completed') as HTMLElement;
    }

    private setupEventListeners(): void {
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
                const filter = btn.dataset.filter as FilterType;
                this.setFilter(filter);
            });
        });

        // Clear completed
        this.clearCompleted.addEventListener('click', () => {
            this.clearCompletedTodos();
        });
    }

    private addTodo(title: string): void {
        const todo: Todo = {
            id: this.generateId(),
            title,
            completed: false,
            createdAt: new Date()
        };

        this.todos.unshift(todo);
        this.saveToStorage();
        this.render();
    }

    private toggleTodo(id: string): void {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
        }
    }

    private deleteTodo(id: string): void {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveToStorage();
        this.render();
    }

    private editTodo(id: string, newTitle: string): void {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newTitle.trim()) {
            todo.title = newTitle.trim();
            this.saveToStorage();
            this.render();
        }
    }

    private setFilter(filter: FilterType): void {
        this.currentFilter = filter;
        this.updateFilterButtons();
        this.render();
    }

    private updateFilterButtons(): void {
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.filter === this.currentFilter);
        });
    }

    private getFilteredTodos(): Todo[] {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    private clearCompletedTodos(): void {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveToStorage();
        this.render();
    }

    private render(): void {
        this.renderTodos();
        this.updateTodoCount();
        this.updateFilterButtons();
        this.updateEmptyState();
    }

    private renderTodos(): void {
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

    private updateTodoCount(): void {
        const activeTodos = this.todos.filter(t => !t.completed).length;
        this.todoCount.textContent = activeTodos.toString();
        
        const countSpan = this.todoCount.parentElement;
        if (countSpan) {
            const itemText = activeTodos === 1 ? 'item left' : 'items left';
            countSpan.innerHTML = `<strong>${activeTodos}</strong> ${itemText}`;
        }
    }

    private updateEmptyState(): void {
        const emptyState = document.getElementById('empty-state') as HTMLElement;
        const footer = document.getElementById('footer') as HTMLElement;
        const mainSection = document.querySelector('.main-section') as HTMLElement;
        
        if (this.todos.length === 0) {
            emptyState.style.display = 'block';
            footer.style.display = 'none';
            mainSection.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            footer.style.display = 'flex';
            mainSection.style.display = 'block';
        }
        
        // Update clear completed button visibility
        const hasCompleted = this.todos.some(t => t.completed);
        this.clearCompleted.style.display = hasCompleted ? 'block' : 'none';
    }



    public startEdit(id: string): void {
        const todoItem = document.querySelector(`[data-id="${id}"]`) as HTMLElement;
        if (todoItem) {
            todoItem.classList.add('editing');
            const input = todoItem.querySelector('.edit') as HTMLInputElement;
            input.focus();
            input.select();
        }
    }

    public finishEdit(id: string, newTitle: string): void {
        const todoItem = document.querySelector(`[data-id="${id}"]`) as HTMLElement;
        if (todoItem) {
            todoItem.classList.remove('editing');
            if (newTitle.trim()) {
                this.editTodo(id, newTitle);
            } else {
                this.deleteTodo(id);
            }
        }
    }

    public cancelEdit(id: string): void {
        const todoItem = document.querySelector(`[data-id="${id}"]`) as HTMLElement;
        if (todoItem) {
            todoItem.classList.remove('editing');
        }
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    private saveToStorage(): void {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    private loadFromStorage(): void {
        const stored = localStorage.getItem('todos');
        if (stored) {
            this.todos = JSON.parse(stored).map((todo: any) => ({
                ...todo,
                createdAt: new Date(todo.createdAt)
            }));
        }
    }

    // Public methods for global access
    public toggleTodoPublic = (id: string) => this.toggleTodo(id);
    public deleteTodoPublic = (id: string) => this.deleteTodo(id);
}

// Initialize the app
let todoApp: TodoApp;

document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
    // Make todoApp globally accessible for inline event handlers
    (window as any).todoApp = todoApp;
});
