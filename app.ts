// Todo App Types
interface Todo {
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
    priority: 'low' | 'medium' | 'high';
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
        this.todoCount = document.getElementById('todo-count') as HTMLElement;
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
            btn.addEventListener('click', () => {
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
            createdAt: new Date(),
            priority: 'medium'
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
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
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
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox">
                    <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                           onchange="todoApp.toggleTodoPublic('${todo.id}')">
                    <span class="checkmark"></span>
                </div>
                <div class="todo-content">
                    <span class="todo-title" ondblclick="todoApp.startEdit('${todo.id}')">${todo.title}</span>
                    <input type="text" class="edit-input" value="${todo.title}" 
                           onblur="todoApp.finishEdit('${todo.id}', this.value)"
                           onkeypress="if(event.key==='Enter') this.blur()">
                </div>
                <div class="todo-actions">
                    <button class="priority-btn priority-${todo.priority}" 
                            onclick="todoApp.cyclePriorityPublic('${todo.id}')" title="Priority: ${todo.priority}">
                        !
                    </button>
                    <button class="delete-btn" onclick="todoApp.deleteTodoPublic('${todo.id}')" title="Delete">
                        ×
                    </button>
                </div>
            </div>
        `).join('');
    }

    private updateTodoCount(): void {
        const activeTodos = this.todos.filter(t => !t.completed).length;
        this.todoCount.textContent = `${activeTodos} item${activeTodos !== 1 ? 's' : ''} left`;
    }

    private updateEmptyState(): void {
        const emptyState = document.getElementById('empty-state') as HTMLElement;
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
        }
    }

    private cyclePriority(id: string): void {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const priorities: Array<Todo['priority']> = ['low', 'medium', 'high'];
            const currentIndex = priorities.indexOf(todo.priority);
            const nextIndex = (currentIndex + 1) % priorities.length;
            todo.priority = priorities[nextIndex] as Todo['priority'];
            this.saveToStorage();
            this.render();
        }
    }

    public startEdit(id: string): void {
        const todoItem = document.querySelector(`[data-id="${id}"]`) as HTMLElement;
        if (todoItem) {
            todoItem.classList.add('editing');
            const input = todoItem.querySelector('.edit-input') as HTMLInputElement;
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
            }
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
    public cyclePriorityPublic = (id: string) => this.cyclePriority(id);
}

// Initialize the app
let todoApp: TodoApp;

document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
    // Make todoApp globally accessible for inline event handlers
    (window as any).todoApp = todoApp;
});
