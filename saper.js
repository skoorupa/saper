let saper;
const minecounter = document.getElementById("minecounter");
const timer = document.getElementById("timer");
const restarticon = document.getElementById("restarticon");
const restartform = document.getElementById("restartform");
const showallicon = document.getElementById("showallicon");
const width = document.getElementById("width");
const height = document.getElementById("height");
const mines = document.getElementById("mines");
const plansza = document.getElementById("plansza");
let timerinterval;
let showtable = false;
class Field {
    constructor(x, y, type, status, value) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.status = status;
        this.value = value;
    }
}
class Board {
    constructor(width, height, mines, table) {
        this.width = width;
        this.height = height;
        this.mines = [];
        this.minequantity = mines;
        this.minecounter = mines;
        this.blanks = width * height - mines;
        this.tableObject = table;
        this.lost = false;
        this.readonly = false;
        minecounter.innerHTML = String(mines);
        this.generateTable();
        this.printTable();
    }
    getXYAround(x, y) {
        var around = [
            { x: x - 1, y: y - 1 },
            { x: x, y: y - 1 },
            { x: x + 1, y: y - 1 },
            { x: x - 1, y: y },
            { x: x + 1, y: y },
            { x: x - 1, y: y + 1 },
            { x: x, y: y + 1 },
            { x: x + 1, y: y + 1 }
        ];
        around = around.filter((coords) => {
            if (coords.x >= 0 &&
                coords.x < this.width &&
                coords.y >= 0 &&
                coords.y < this.height)
                return true;
            else
                return false;
        });
        return around;
    }
    getFieldsAround(field) {
        let aroundCoords = this.getXYAround(field.x, field.y);
        let aroundFields = aroundCoords.map((coords) => {
            return this.table[coords.y][coords.x];
        });
        return aroundFields;
    }
    generateTable() {
        var t = [];
        // generowanie pustych pól na tabeli
        for (var i = 0; i < this.height; i++) {
            t.push([]);
            for (var j = 0; j < this.width; j++) {
                var blank = new Field(j, i, "blank", "hidden", 0);
                t[i].push(blank);
            }
        }
        this.table = t;
    }
    generateMines(click_x, click_y) {
        var t = this.table;
        // generowanie min
        for (var i = 0; i < this.minequantity; i++) {
            var x, y;
            do {
                x = random(this.width - 1);
                y = random(this.height - 1);
            } while (this.mines.findIndex((currentmine) => {
                return currentmine.x == x && currentmine.y == y;
            }) != -1 ||
                (x == click_x && y == click_y) ||
                this.getXYAround(click_x, click_y).findIndex((currentXY) => {
                    return currentXY.x == x && currentXY.y == y;
                }) != -1);
            let mine = new Field(x, y, "mine", "hidden");
            this.mines.push(mine);
            t[y][x] = mine;
        }
        // generowanie pól z numerkami
        for (var i = 0; i < this.height; i++) {
            for (var j = 0; j < this.width; j++) {
                var count = 0;
                // console.log(`${i},${j}`);
                var field = t[i][j];
                var around = this.getFieldsAround(field);
                around.forEach(f => {
                    if (f.type == "mine")
                        count++;
                });
                field.value = count;
            }
        }
        this.table = t;
    }
    printTable() {
        this.tableObject.innerHTML = "";
        for (var i = 0; i < this.height; i++) {
            var tr = document.createElement("tr");
            for (var j = 0; j < this.width; j++) {
                var field = this.table[i][j];
                var td = document.createElement("td");
                if (field.status == "visible" || showtable) {
                    td.classList.add(field.type);
                    // if (field.type == "blank") td.innerHTML = field.value || "";
                    if (field.type == "blank")
                        td.classList.add("blank" + field.value);
                }
                else
                    td.classList.add(field.status);
                tr.appendChild(td);
            }
            this.tableObject.appendChild(tr);
        }
        [...this.tableObject.getElementsByTagName("tr")].forEach((row, i) => {
            [...row.getElementsByTagName("td")].forEach((cell, j) => {
                cell.addEventListener("click", (e) => {
                    this.click(j, i);
                });
                cell.addEventListener("contextmenu", () => {
                    this.flag(j, i);
                    return false;
                });
                cell.addEventListener("dblclick", () => {
                    this.dblclick(j, i);
                });
                cell.addEventListener("mouseup", (e) => {
                    if (e.which !== 2)
                        return;
                    this.dblclick(j, i);
                });
            });
        });
    }
    click(x, y) {
        var click = this.table[y][x];
        if (this.readonly)
            return;
        if (!this.mines.length) {
            if (this.width * this.height - 10 < this.minequantity) {
                alert("Ilość min przekracza ilość pól na mapie.");
                mines.value = String(this.width * this.height - 10);
                setup();
                return;
            }
            this.generateMines(x, y);
            $("#restartform").fadeOut(2000, () => {
                $("#restarticon").fadeIn(2000);
            });
            var d = new Date();
            this.timestart = d.getTime();
            timerinterval = setInterval((board) => {
                var d = new Date();
                var t = Math.floor((d.getTime() - board.timestart) / 1000);
                var h = Math.floor(t / 3600);
                var m = Math.floor(t / 60) % 60;
                var s = t % 60;
                var text;
                if (h >= 1) {
                    text = h + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
                }
                else if (m >= 1) {
                    text = m + ":" + (s < 10 ? "0" + s : s);
                }
                else
                    text = "0:" + (s < 10 ? "0" + s : s);
                timer.innerHTML = text;
            }, 1000, this);
        }
        if (click.status == "flagged" || click.status == "unsure")
            return;
        this.discover(x, y);
        this.printTable();
    }
    discover(x, y) {
        var click = this.table[y][x];
        if (click.status == "visible")
            return;
        click.status = "visible";
        if (click.type == "blank")
            this.blanks--;
        if (click.type == "mine") {
            alert("Przegrałeś :(");
            this.minecounter--;
            this.lost = true;
            minecounter.innerHTML = String(this.minecounter);
            showallicon.style.display = "inline";
        }
        if (click.value == 0 && click.type == "blank") {
            this.getFieldsAround(click).forEach((field) => {
                /*if (this.table[field.y][field.x].status == "hidden")*/ this.discover(field.x, field.y);
            });
        }
        if (this.blanks == 0 /*&&!this.lost*/) { // wygranko
            clearInterval(timerinterval);
            this.mines.forEach((mine) => {
                if (mine.status != "visible")
                    mine.status = "flagged";
            });
            this.printTable();
            this.minecounter = 0;
            minecounter.innerHTML = String(this.minecounter);
            if (!this.lost)
                alert("Brawo :)");
        }
    }
    flag(x, y) {
        var click = this.table[y][x];
        if (!this.mines.length || this.blanks == 0)
            return;
        switch (click.status) {
            case "hidden":
                click.status = "flagged";
                this.minecounter--;
                break;
            case "flagged":
                click.status = "unsure";
                this.minecounter++;
                break;
            case "unsure":
                click.status = "hidden";
                break;
            case "visible":
                this.dblclick(x, y);
                break;
        }
        this.printTable();
        minecounter.innerHTML = String(this.minecounter);
    }
    dblclick(x, y) {
        var click = this.table[y][x];
        var around = this.getFieldsAround(click);
        var mines = click.value;
        var count = 0;
        if (click.type == "mine")
            return;
        around.map((field) => {
            if (field.status == "flagged" || (field.status == "visible" && field.type == "mine"))
                count++;
        });
        if (count == mines)
            around.forEach((field) => {
                this.click(field.x, field.y);
            });
    }
    showall() {
        clearInterval(timerinterval);
        this.mines.forEach((mine) => {
            if (mine.status != "visible")
                mine.status = "visible";
        });
        this.printTable();
        this.readonly = true;
    }
    export() {
        var line = "";
        this.table.forEach(row => {
            row.forEach(field => {
                if (field.type == "blank")
                    line += " ";
                else if (field.type == "mine")
                    line += "X";
            });
            line += "\n";
        });
        console.log(line);
    }
}
function setup() {
    var w = Number(width.value);
    var h = Number(height.value);
    var m = Number(mines.value);
    // if (w*h < m) return;
    $("#restarticon").fadeOut(100, () => {
        $("#restartform").fadeIn(500);
    });
    showallicon.style.display = "none";
    if (timerinterval)
        clearInterval(timerinterval);
    timer.innerHTML = "0:00";
    saper = new Board(w, h, m, plansza);
}
setup();
[width, height, mines].forEach(function (el) {
    el.addEventListener("change", setup);
    el.addEventListener("keyup", setup);
    el.addEventListener("wheel", (e) => {
        e.preventDefault();
        if (e.wheelDelta < 0 && e.target.value - 1 >= e.target.min)
            e.target.value--;
        else if (e.wheelDelta > 0)
            e.target.value++;
        setup();
    });
});
restarticon.addEventListener("click", setup);
showallicon.addEventListener("click", () => { saper.showall(); });
function random(x) {
    return Math.floor(Math.random() * (x + 1));
}
