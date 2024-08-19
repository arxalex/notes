Vue.component('note-teaser', {
    template: '#note-teaser-template',
    props: {
        note: {
            type: Object,
        },
        nth: {
            type: Boolean,
        }
    },
    computed: {
        isActive: function () {
            return app.displayNote && app.notes[app.onmain].id == this.note.id;
        }
    },
    data() {
        return {
            nthValue: this.nth,
        }
    },
    methods: {
        nthSet: function (value) {
            this.nthValue = value;
        },

    },
    watch: {
        nth(value) {
            this.nthValue = value;
        }
    }
});
Vue.component('note', {
    template: '#note-template',
    props: {
        note: {
            type: Object,
        },
        edit: {
            type: Boolean,
        }
    },
    methods: {
        addNewTodo: function () {
            this.note.todos.push({
                id: ++this.note.lastid,
                label: 'New Todo',
                checked: false,
            });
            app.saveNotes();
        },
        removeTodo: function (index) {
            this.note.todos.splice(index, 1);
            app.saveNotes();
        },
    },
});
Vue.component('todo-item', {
    template: '#todo-item-template',
    props: {
        todoElement: {
            type: Object,
        },
        edit: {
            type: Boolean,
        },
        tth: {
            type: Boolean,
        }
    },
    data() {
        return {
            tthValue: this.tth,
        }
    },
    methods: {
        checkTodo: function () {
            this.todoElement.checked = !this.todoElement.checked;
            app.saveNotes();
        },
        tthSet: function (value) {
            this.tthValue = value;
        },
    },
    watch: {
        tth(value) {
            this.tthValue = value;
        }
    }
});
Vue.component('alert', {
    props: {
        text: {
            type: String
        }
    },
    template: '#alert-template',
})
var app = new Vue({
    el: '#page-wrapper',
    data: {
        notes: [],
        onmain: 0,
        displayNote: false,
        lastid: null,
        edit: false,
        history: [],
        currentHistory: -1,
        undoActive: false,
        redoActive: false,
        text: '',
        todo: null,
        show: false,
    },
    mounted() {
        if (localStorage.getItem('notes')) {
            try {
                this.notes = JSON.parse(localStorage.getItem('notes'));
            } catch (e) {
                localStorage.removeItem('notes');
            }
        }
        if (localStorage.lastid) {
            this.lastid = localStorage.lastid;
        }
    },
    watch: {
        lastid(newLastid) {
            localStorage.lastid = newLastid;
        }
    },
    methods: {
        undo: function () {
            if (this.undoActive) {
                var history = this.history[this.currentHistory--];
                switch (history.action) {
                    case "deleteNote":
                        this.notes.splice(history.data.index, 0, history.data.note);
                        this.displayNote = true;
                        this.onmain = history.data.index;
                        this.redoActive = true;
                        this.undoActive = this.currentHistory >= 0;
                        this.saveNotes();
                        break;
                    case "addNote":
                        this.displayNote = false;
                        this.notes.splice(history.data.index, 1);
                        this.redoActive = true;
                        this.undoActive = this.currentHistory >= 0;
                        this.saveNotes();
                        break;
                }
            }
        },
        redo: function () {
            if (this.redoActive) {
                var history = this.history[++this.currentHistory];
                switch (history.action) {
                    case "deleteNote":
                        this.displayNote = false;
                        this.notes.splice(history.data.index, 1);
                        this.undoActive = true;
                        this.redoActive = this.currentHistory < this.history.length - 1;
                        this.saveNotes();
                        break;
                    case "addNote":
                        this.notes.splice(history.data.index, 0, history.data.note);
                        this.displayNote = true;
                        this.onmain = history.data.index;
                        this.undoActive = true;
                        this.redoActive = this.currentHistory < this.history.length - 1;
                        this.saveNotes();
                        break;
                }
            }
        },
        addNewNote: function () {
            this.notes.push({
                id: ++this.lastid,
                label: 'New Note',
                todos: [],
                lastid: -1,
            });
            this.toHistory('addNote', {
                index: this.notes.length - 1,
                note: this.notes[this.notes.length - 1],
            });
            this.displayNote = true;
            this.onmain = this.notes.length - 1;
            this.edit = true;
            this.saveNotes();
        },
        removeNote: function (index) {
            this.confirm('Delete?', function () {
                this.toHistory('deleteNote', {
                    index: index,
                    note: this.notes[index],
                })
                if (index != this.onmain) {
                    if (index > this.onmain) {
                        this.notes.splice(index, 1);
                    } else {
                        this.notes.splice(index, 1);
                        this.onmain--;
                    }
                } else {
                    this.notes.splice(index, 1);
                    this.displayNote = false;

                }
                this.saveNotes();
            });
        },
        selectNote: function (index) {
            this.onmain = index;
            this.displayNote = true;
            this.edit = false;
        },
        editNote: function () {
            this.edit = !this.edit;
            this.saveNotes();
        },
        saveNotes() {
            const parsed = JSON.stringify(this.notes);
            localStorage.setItem('notes', parsed);
        },
        toHistory(action, data) {
            if (++this.currentHistory < this.history.length) {
                this.history.splice(this.currentHistory);
            }
            this.history.push({
                action: action,
                data: data,
            });
            this.undoActive = true;
            this.redoActive = false;
        },
        back: function () {
            this.displayNote = false;
        },
        confirm: async function (text, todo) {
            this.text = text;
            this.todo = todo;
            this.show = true;
        },
        confirmYes: function () {
            this.todo();
            this.show = false;
        },
        confirmNo: function () {
            this.show = false;
        },
        jsonExport(arrData) {
            let jsonContent = "data:text/json;charset=utf-8,";
            const parsed = JSON.stringify(arrData);
            jsonContent += parsed.replace("#", "s:U+0023");

            const data = encodeURI(jsonContent);
            const link = document.createElement("a");
            link.setAttribute("href", data);
            link.setAttribute("download", "export-notes.json");
            link.click();
        },
    },
});
document.querySelector('#import').addEventListener('change', function () {
    var GetFile = new FileReader();
    GetFile.onload = function () {
        var cData = JSON.parse(GetFile.result.replace("s:U+0023", "#"));
        var cOK = new Array(0);
        cData.forEach((data) => {
            var isOK = true;
            isOK = isOK && "id" in data;
            isOK = isOK && Number.isInteger(data.id);
            isOK = isOK && "label" in data;
            isOK = isOK && typeof data.label == 'string';
            isOK = isOK && "lastid" in data;
            isOK = isOK && Number.isInteger(data.lastid);
            isOK = isOK && "todos" in data;
            data.todos.forEach((todo) => {
                isOK = isOK && "id" in todo;
                isOK = isOK && Number.isInteger(todo.id);
                isOK = isOK && "label" in todo;
                isOK = isOK && typeof todo.label == 'string';
                isOK = isOK && "checked" in todo;
                isOK = isOK && typeof todo.checked == 'boolean';
            })
            cOK.push(isOK);
        });
        app.onmain = 0;
        app.displayNote = false;
        app.notes = [];
        app.history = [];
        app.currentHistory = -1;
        app.undoActive = false;
        app.redoActive = false;
        app.edit = false;
        for(var i = 0; i < cOK.length; i++) {
            if(cOK[i]){
                app.notes.push(cData[i]);
            }
        };
        app.lastid = cData[cData.length - 1].id;
        app.saveNotes();
    }
    GetFile.readAsText(this.files[0]);
});