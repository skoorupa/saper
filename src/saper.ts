let saper: Board;
const minecounter = document.getElementById("minecounter");
const timer = document.getElementById("timer");
const ingameicons = document.getElementById("ingameicons");
const restartform = document.getElementById("restartform");
const restarticon = document.getElementById("restarticon");
const showallicon = document.getElementById("showallicon");
const width = document.getElementById("width") as HTMLInputElement;
const height = document.getElementById("height") as HTMLInputElement;
const minesinput = document.getElementById("mines") as HTMLInputElement;
const plansza = document.getElementById("plansza") as HTMLTableElement;
let timerinterval: number;
let showtable = false;

interface FieldCoords {
	x: number,
	y: number
}

type FieldType = "blank" | "mine";
type FieldStatus = "hidden" | "flagged" | "unsure" | "visible";

interface Field extends FieldCoords {
	type: FieldType;
	status: FieldStatus;
	value?: number;
}

class Field implements Field {
	constructor(x: number, y: number, type: FieldType, status: FieldStatus, value?: number) {
		this.x = x;
		this.y = y;
		this.type = type;
		this.status = status;
		this.value = value;
	}
}

class Board {
	width: number;
	height: number;
	table: Field[][];
	mines: Field[];
	minequantity: number;
	minecounter: number;
	blanks: number;
	tableObject: HTMLTableElement;
	lost: boolean;
	readonly: boolean;
	timestart: number;

	constructor(width: number, height: number, mines: number, table: HTMLTableElement) {
		this.width = width;
		this.height = height;
		this.mines = [];
		this.minequantity = mines;
		this.minecounter = mines;
		this.blanks = width*height-mines;
		this.tableObject = table;
		this.lost = false;
		this.readonly = false;

		minecounter.innerHTML = String(mines);
		this.generateTable();
		this.printTable();
	}

	getXYAround({ x, y }: FieldCoords) {
		var around: FieldCoords[] = [
			{x: x-1, y: y-1},
			{x: x,   y: y-1},
			{x: x+1, y: y-1},
			{x: x-1, y: y},
			{x: x+1, y: y},
			{x: x-1, y: y+1},
			{x: x,   y: y+1},
			{x: x+1, y: y+1}
		];
		around = around.filter((coords: FieldCoords)=>{
			if (
				coords.x>=0 &&
				coords.x<this.width &&
				coords.y>=0 &&
				coords.y<this.height
			) return true;
		  else return false;
		});
		return around;
	}

	getFieldsAround(field: Field) {
		let aroundCoords = this.getXYAround({ x: field.x, y: field.y });
		let aroundFields = aroundCoords.map((coords)=>{
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
				var blank = new Field(j, i, "blank", "hidden", 0)
				t[i].push(blank)
			}
		}
		
		this.table = t;
	}

	generateMines({ x, y }: FieldCoords) {
		var t = this.table;
		// generowanie min
		for (var i = 0; i < this.minequantity; i++) {
			var randomX: number, 
				randomY: number;

			do {
				randomX = random(this.width-1);
				randomY = random(this.height-1);
			} while (
				this.mines.findIndex((currentmine) => {
					return currentmine.x == randomX && currentmine.y == randomY;
				}) != -1 || 
				(randomX == x && randomY == y) ||
				this.getXYAround({ x: x, y: y }).findIndex((currentXY) => {
					return currentXY.x == randomX && currentXY.y == randomY;
				}) != -1
			);
			let mine = new Field(randomX, randomY, "mine", "hidden");
			this.mines.push(mine);
			t[randomY][randomX] = mine;
		}
		// generowanie pól z numerkami
		for (var i = 0; i < this.height; i++) {
			for (var j = 0; j < this.width; j++) {
				var count = 0;
				// console.log(`${i},${j}`);
				var field = t[i][j];
				var around = this.getFieldsAround(field);
				around.forEach(f => {
					if (f.type=="mine") count++;
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

				if (field.status=="visible" || showtable) {
					td.classList.add(field.type);
					// if (field.type == "blank") td.innerHTML = field.value || "";
					if (field.type == "blank") 
						td.classList.add("blank"+field.value);
				} else td.classList.add(field.status);

				tr.appendChild(td);
			}
			this.tableObject.appendChild(tr);
		}

		[...this.tableObject.getElementsByTagName("tr")].forEach((row,i)=>{
			[...row.getElementsByTagName("td")].forEach((cell,j)=>{
				cell.addEventListener("click", (e)=>{
					this.click({ x: j, y: i });
				});
				cell.addEventListener("contextmenu", ()=>{
					this.flag({ x: j, y: i });
					return false;
				});
				cell.addEventListener("dblclick", ()=>{
					this.dblclick({ x: j, y: i });
				});
				cell.addEventListener("mouseup", (e)=>{
					if (e.which !== 2) return;
					this.dblclick({ x: j, y: i });
				});
			});
		});
	}

	click({ x, y }: FieldCoords) {
		var click = this.table[y][x];
		if (this.readonly) return;

		if (!this.mines.length) {
			if (this.width*this.height-10 < this.minequantity) {
				alert("Ilość min przekracza ilość pól na mapie.");
				minesinput.value = String(this.width*this.height-10);
				setup();
				return;
			}

			this.generateMines({ x: x, y: y });
			
			restartform.classList.add('hide');
			restartform.classList.remove('show');
			setTimeout(() => {
				ingameicons.classList.add('show');
				ingameicons.classList.remove('hide');
			}, 400);

			var d = new Date();
			this.timestart = d.getTime();
			timerinterval = setInterval((board: { timestart: number; })=>{
				var d = new Date();
				var t = Math.floor((d.getTime()-board.timestart)/1000);
				var h = Math.floor(t/3600);
				var m = Math.floor(t/60)%60;
				var s = t%60;
				var text: string;
				if (h>=1) {
					text = h+":"+(m<10?"0"+m:m)+":"+(s<10?"0"+s:s);
				} else if (m>=1) {
					text = m+":"+(s<10?"0"+s:s);
				} else text = "0:"+(s<10?"0"+s:s);

				timer.innerHTML = text;
			}, 1000, this);
		}
		if(click.status == "flagged" || click.status == "unsure") return;

		this.discover({ x, y });
		this.printTable();
	}

	discover({ x, y }: FieldCoords) {
		var click = this.table[y][x];
		if (click.status == "visible") return;
		click.status = "visible";
		if (click.type == "blank") this.blanks--;
		if (click.type == "mine") {
			alert("Przegrałeś :(");
			this.minecounter--;
			this.lost = true;
			minecounter.innerHTML = String(this.minecounter);
			showallicon.classList.add('show');
			showallicon.classList.remove('hide');
		}
		if (click.value==0 && click.type=="blank") {
			this.getFieldsAround(click).forEach((field)=>{
				/*if (this.table[field.y][field.x].status == "hidden")*/ this.discover({ x: field.x, y: field.y });
			});
		}
		if (this.blanks==0/*&&!this.lost*/) { // wygranko
			clearInterval(timerinterval);
			this.mines.forEach((mine)=>{
				if (mine.status != "visible")
					mine.status = "flagged";
			});
			this.printTable();
			this.minecounter = 0;
			minecounter.innerHTML = String(this.minecounter);
			if (!this.lost) alert("Brawo :)");
		}
	}

	flag({ x, y }: FieldCoords) {
		var click = this.table[y][x];
		if (!this.mines.length || this.blanks==0) return;
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
				this.dblclick({ x, y });
				break;
		}
		this.printTable();
		minecounter.innerHTML = String(this.minecounter);
	}

	dblclick({ x, y }: FieldCoords) {
		var click = this.table[y][x];
		var around = this.getFieldsAround(click);
		var mines = click.value;
		var count = 0;
		if (click.type == "mine") return;
		around.map((field)=>{
			if (field.status=="flagged" || (field.status=="visible" && field.type=="mine")) count++;
		});
		if (count == mines)
			around.forEach((field)=>{
				this.click({ x: field.x, y: field.y });
			});
	}

	showall() {
		clearInterval(timerinterval);
		
		this.mines.forEach((mine)=>{
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
				if (field.type == "blank") line += " ";
				else if (field.type == "mine") line += "X";
			});
			line += "\n";
		});

		console.log(line);
	}
}

function setup() {
	var w = Number(width.value);
	var h = Number(height.value);
	var m = Number(minesinput.value);
	// if (w*h < m) return;

	ingameicons.classList.add('hide');
	ingameicons.classList.remove('show');
	setTimeout(() => {
		restartform.classList.add('show');
		restartform.classList.remove('hide');
	}, 400);
	showallicon.classList.add('hide');
	showallicon.classList.remove('show');
	if (timerinterval) clearInterval(timerinterval);
	timer.innerHTML = "0:00";
	saper = new Board(w,h,m,plansza);
}
setup();

[width,height,minesinput].forEach( function(el) {

	el.addEventListener("change", setup);
	el.addEventListener("keyup", setup);
	el.addEventListener("wheel", (e: any)=>{
		e.preventDefault();
		if (e.wheelDelta<0 && e.target.value-1 >= e.target.min) e.target.value--;
		else if (e.wheelDelta>0) e.target.value++;
		setup();
	});
});

restarticon.addEventListener("click", setup);
showallicon.addEventListener("click", ()=>{saper.showall()});

function random (x: number): number {
	return Math.floor(Math.random()*(x+1));
}
