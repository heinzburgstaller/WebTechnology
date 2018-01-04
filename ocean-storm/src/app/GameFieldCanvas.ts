import { ASTWithSource } from '@angular/compiler';

// TODO: Define this somewhere else
const columnsOfField = 10;
const rowsOfField = 10;


const shipColors: string[] = [
	'rgba(196, 154, 124, 1)',
	'rgba(142, 196, 084, 1)',
	'rgba(068, 163, 139, 1)',
	'rgba(085, 097, 193, 1)',
	'rgba(163, 107, 162, 1)',
	'rgba(167, 170, 078, 1)',
	'rgba(097, 170, 078, 1)',
	'rgba(127, 078, 169, 1)',
	'rgba(010, 150, 210, 1)',
	'rgba(190, 053, 144, 1)'
];

enum CanvasFieldState {
    Empty = 1,
    ShotMiss,
    ShotHit,
	ShotSunk,
	OccupiedUndamaged, // = Ship placed there
	OccupiedHit,
}

////////////////////////
// Supporting classes
////////////////////////

class CanvasElementPosition {
	x: number;
    y: number;

    constructor(x: number, y: number, ) {
        this.x = x;
        this.y = y;
    }
}

class CanvasElementSize {

    width: number;
    height: number;

    constructor(width: number, gHeight: number, ) {
        this.width = width;
        this.height = gHeight;
    }
}

class CanvasElementFrame {

    origin: CanvasElementPosition;
    size: CanvasElementSize;

    constructor(x: number, y: number, width: number, height: number) {

        this.origin = new CanvasElementPosition(x, y);
        this.size = new CanvasElementSize(width, height);
    }
}

class CanvasElement {

    frame: CanvasElementFrame;

    constructor(frame: CanvasElementFrame) {
        this.frame = frame;
    }
}


class CanvasGameTile extends CanvasElement {

	fieldState: CanvasFieldState;
	shipIndex: number;

	constructor(frame: CanvasElementFrame) {
		super(frame);
		this.fieldState = CanvasFieldState.Empty;
		this.shipIndex = -1;
    }
}


////////////////////////
// Main Thingy
////////////////////////

export class GameFieldDrawer {

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    cells: CanvasGameTile[][];

    cellSize: CanvasElementSize;
    gridLineWidth: number;

    start: CanvasElementPosition;

    hoverCell: CanvasGameTile;
	turnIndicatorFrame: CanvasElementFrame;

	hoveringEnabled: Boolean;

	mouseClickCallback: (click) => void;

	dragIndex: {x: number,y: number};
	dropIndex: {x: number,y: number};
	dragShipIndex: number;
	dragShipSize: number;
	dragging: boolean;
	dragHorizontal: boolean;
	drageCells: CanvasGameTile[];

    //////////////////////////////////////////////////////////////////////////////////////////
	// Init:
	//////////////////

	constructor(canvasId, mouseClickCallback) {

		this.mouseClickCallback = mouseClickCallback;

        this.canvas =  <HTMLCanvasElement>document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

		if (this.canvas != null) {
			this.drawGameGrid();
			this.initCells();
		}

		this.hoveringEnabled = true;

    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
		this.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this), false);
		this.canvas.addEventListener('mouseup', this.handleMouseClick.bind(this), false);
		this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
	}


	drawGameGrid() {

		const canvasWidth = this.canvas.width;
		const canvasHeight = this.canvas.height;

        // + 1 for the Label
        this.cellSize = new CanvasElementSize(
            canvasWidth / (columnsOfField + 1),
            canvasHeight / (columnsOfField + 1));
		this.gridLineWidth = 2;

        this.start = new CanvasElementPosition(
            this.cellSize.width - this.gridLineWidth / 2,
            this.cellSize.height - this.gridLineWidth / 2);

		this.ctx.font = '24px Arial';
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';

		this.ctx.strokeStyle = '#010101';
		this.ctx.lineWidth = this.gridLineWidth;

		for (let x = 0; x <= columnsOfField; x++) {

			if (x > 0) {
                this.ctx.fillText(
                    x.toString(),
                    this.start.x + (x - 1) * this.cellSize.width + this.cellSize.width / 2,
                    this.cellSize.height / 2);
			}

			this.ctx.moveTo(this.start.x + x * this.cellSize.width, this.start.y);
			this.ctx.lineTo(this.start.x + x * this.cellSize.width, canvasWidth);
			this.ctx.stroke();
		}

		for (let y = 0; y <= rowsOfField; y++) {

			if (y > 0) {

				const letter = String.fromCharCode(64 + y);
				this.ctx.fillText(
                    letter,
                    this.cellSize.width / 2,
                    this.start.y + (y - 1) * this.cellSize.height + this.cellSize.height / 2);
			}

			this.ctx.moveTo(this.start.x, this.start.y + y * this.cellSize.height);
			this.ctx.lineTo(canvasWidth, this.start.y + y * this.cellSize.height);
			this.ctx.stroke();
		}
	}

	initCells() {

		this.cells = [];
		this.drageCells = [];

		for (let x = 0; x < columnsOfField; x++) {

            this.cells[x] = [];
			for (let y = 0; y < rowsOfField; y++) {

                const frame = new CanvasElementFrame(
                    this.start.x + x * this.cellSize.width + this.gridLineWidth,
					this.start.y + y * this.cellSize.height + this.gridLineWidth,
					this.cellSize.width - this.gridLineWidth * 2,
                    this.cellSize.height - this.gridLineWidth * 2);

                this.cells[x][y] = new CanvasGameTile(frame);
			}
		}
	}

    //////////////////////////////////////////////////////////////////////////////////////////
	// Interaction:
	//////////////////

	//////////////////
	// Updating the fields

	public drawShipAtIndex(x, y, shipIndex) {
		const cell = this.cells[x][y];
		cell.shipIndex = shipIndex;
		cell.fieldState = CanvasFieldState.OccupiedUndamaged;
		this.drawShip(cell);
	}


	private drawShip(cell) {

		this.clearCanvasElement(cell);
		if (cell.shipIndex === -1 || cell.shipIndex >= shipColors.length) {
			this.ctx.fillStyle = 'rgba(230, 0, 0, 0.25)';
		} else {
			this.ctx.fillStyle = shipColors[cell.shipIndex];
		}
        this.ctx.fillRect(
			cell.frame.origin.x,
            cell.frame.origin.y,
            cell.frame.size.width,
            cell.frame.size.height);
	}

	clearCelldAtIndex(x, y) {
		const cell = this.cells[x][y];

		this.clearCanvasElement(cell);
		cell.fieldState = CanvasFieldState.Empty;
	}

	clearCanvasElement(element) {
		this.ctx.clearRect(
			element.frame.origin.x,
			element.frame.origin.y,
			element.frame.size.width,
			element.frame.size.height);
	}


	drawShipHitAtIndex(x, y, sunk, shipIndex) {
		const cell = this.cells[x][y];
		cell.shipIndex = shipIndex;
		if (cell.fieldState === CanvasFieldState.OccupiedUndamaged || cell.fieldState === CanvasFieldState.OccupiedHit) {
			cell.fieldState = CanvasFieldState.OccupiedHit;
			this.drawShip(cell);
			this.drawShipHit(cell);
		} else if (!sunk) {
			cell.fieldState = CanvasFieldState.ShotHit;
			this.drawShipHit(cell);
		} else if (sunk && (cell.fieldState === CanvasFieldState.Empty || cell.fieldState === CanvasFieldState.ShotHit)) {
			cell.fieldState = CanvasFieldState.ShotSunk;
			this.drawShip(cell);
		}
	}


	drawShipHit(cell) {

		if (cell.fieldState === CanvasFieldState.ShotHit) {
			this.clearCanvasElement(cell);
		}
		this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 2;

		this.ctx.beginPath();

		const dummy = cell.frame.size.width / 3;
		const x = cell.frame.origin.x + cell.frame.size.width / 2;
		const y = cell.frame.origin.y + cell.frame.size.height / 2;

		this.ctx.moveTo(x - dummy, y - dummy);
		this.ctx.lineTo(x + dummy, y + dummy);

		this.ctx.moveTo(x + dummy, y - dummy);
		this.ctx.lineTo(x - dummy, y + dummy);
		this.ctx.stroke();
	}

	drawShipMissAtIndex(x, y) {
		const cell = this.cells[x][y];
		cell.fieldState = CanvasFieldState.ShotMiss;

		this.drawShipMiss(cell);
	}

	drawShipMiss(cell) {
		this.ctx.strokeStyle = '#0000FF';
        this.ctx.lineWidth = 2;

		this.ctx.beginPath();
		this.ctx.arc(
			cell.frame.origin.x + cell.frame.size.width / 2,
			cell.frame.origin.y + cell.frame.size.height / 2,
			cell.frame.size.height / 3,
			0,
            2 * Math.PI);
        this.ctx.stroke();
	}

	public clearField() {
		for (let x = 0; x < columnsOfField; x++) {
			for (let y = 0; y < rowsOfField; y++) {
				const cell = this.cells[x][y];

				if (cell.fieldState !== CanvasFieldState.Empty) {
					this.clearCanvasElement(cell);
					cell.fieldState = CanvasFieldState.Empty;
					cell.shipIndex = -1;
				}
			}
		}
	}



	getShipSize(cell, indices) {
		let x = indices.x;
		let y = indices.y;

		if(cell.fieldState != 5){
			return 0;
		}
		let shipSize = 1;

		//up
		try{
			for(let y_ = y-1; this.cells[x][y_].shipIndex == cell.shipIndex; y_--) {
				shipSize++;
			}
		}
		catch (e){
		}
		//down
		try{
			for(let y_ = y+1; this.cells[x][y_].shipIndex == cell.shipIndex; y_++) {
				shipSize++;
			}
		}
		catch (e){
		}
		//left
		try{
			for(let x_ = x-1; this.cells[x_][y].shipIndex == cell.shipIndex; x_--) {
				shipSize++;
			}
		}
		catch (e){
		}
		//right
		try{
			for(let x_ = x+1; this.cells[x_][y].shipIndex == cell.shipIndex; x_++) {
				shipSize++;
			}
		}
		catch (e){
		}

		return shipSize;
	}

	// Hovering

	setHoveringEnabled(hovering: Boolean) {
		this.hoveringEnabled = hovering;
	}

	addHoveringToCell(cell) {

		this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(
			cell.frame.origin.x,
            cell.frame.origin.y,
            cell.frame.size.width,
            cell.frame.size.height);
	}

	addDragHoveringToCell(cell) {

		this.ctx.fillStyle = shipColors[this.dragShipIndex];
        this.ctx.fillRect(
			cell.frame.origin.x,
            cell.frame.origin.y,
            cell.frame.size.width,
            cell.frame.size.height);
	}

	resetDragCells(cells){
		for (let entry of cells) {
    	this.resetHoverCell(entry); // 1, "string", false
		}
		this.drageCells = [];
	}

	resetHoverCell(hoverCell) {

			const ctx = this.canvas.getContext('2d');

			if (hoverCell != null) {
				this.clearCanvasElement(hoverCell);

				switch (hoverCell.fieldState) {
					case CanvasFieldState.Empty:
						break;
					case CanvasFieldState.ShotMiss:
						this.drawShipMiss(hoverCell);
						break;
					case CanvasFieldState.ShotHit:
						this.drawShipHit(hoverCell);
						break;
					case CanvasFieldState.ShotSunk:
						this.drawShip(hoverCell);
						break;
					case CanvasFieldState.OccupiedUndamaged:
						this.drawShip(hoverCell);
						break;
					case CanvasFieldState.OccupiedHit:
						this.drawShip(hoverCell);
						this.drawShipHit(hoverCell);
						break;
				}
			}
		}

		showTurnIndicator() {

			this.ctx.strokeStyle = '#FF0000';
			this.ctx.lineWidth = 2;

			this.ctx.beginPath();
			this.ctx.arc(
				this.cellSize.width / 2,
				this.cellSize.height / 2,
				this.cellSize.width / 4,
				0,
				2 * Math.PI);
			this.ctx.stroke();

			this.turnIndicatorFrame = new CanvasElementFrame(
				this.cellSize.width / 4 - this.ctx.lineWidth,
				this.cellSize.width / 4 - this.ctx.lineWidth,
				this.cellSize.width / 2 + this.ctx.lineWidth * 2,
				this.cellSize.width / 2 + this.ctx.lineWidth * 2);
		}

		hideTurnIndicator() {
			if (this.turnIndicatorFrame != null) {
				this.ctx.clearRect(
					this.turnIndicatorFrame.origin.x,
					this.turnIndicatorFrame.origin.y,
					this.turnIndicatorFrame.size.width,
					this.turnIndicatorFrame.size.height);
			}
		}


	////////////////////////
	// Mouse Events, that should probably handled somewhere else

	handleMouseClick(arg) {
		var left, right;
		left = 0;
		right = 2;
		if(arg.button === left){
			if(this.dragging){
				const indices = this.getIndicesForMouseEvent(arg);
				const cell = this.cells[indices.x][indices.y];

				for(var i=0; i<this.dragShipSize; i++){
					if(this.dragHorizontal){
						this.drawShipAtIndex(indices.x+i, indices.y, this.dragShipIndex)
					}else{
						this.drawShipAtIndex(indices.x, indices.y+i, this.dragShipIndex)
					}
				}
				this.dragging = false;
			}
    }
    else if(arg.button === right){
			var indices = this.getIndicesForMouseEvent(arg);
			var cell = this.cells[indices.x][indices.y];

			console.log(this.getShipSize(cell, indices))
      this.spinShip(cell, this.getShipSize(cell, indices));
    }
	}

	 spinShip(cell, size){
		var spinAble = true;
		//Check if Space free

		if(this.dragHorizontal){
		for(var i = 0; i < this.cells.length; i++) {
			var line = this.cells[i];
			for(var j = 0; j < line.length; j++) {
				if(cell == this.cells[i][j]){
					console.log(size)
					for(var length = 1; length < size; length++){
						console.log(this.cells[i][j+length].fieldState)
						if(this.cells[i][j+length].fieldState != CanvasFieldState.Empty){
							spinAble = false;
						}
					}
					if(spinAble){
						var shipInd = cell.shipIndex;
						var state = cell.fieldState;
						this.removeShipFromCanvas(cell.shipIndex);
						for(var length = 0; length < size; length++){
							//this.removeShipFromCanvas(cell.shipIndex);
							console.log("KOMMT HER")
							this.cells[i][j+length].fieldState = state;
							this.cells[i][j+length].shipIndex = shipInd;
							this.drawShip(this.cells[i][j+length]);

						}
					}
				}
			}
		}
	}
	else{
		for(var i = 0; i < this.cells.length; i++) {
			var line = this.cells[i];
			for(var j = 0; j < line.length; j++) {
				if(cell == this.cells[i][j]){
					console.log(size)
					for(var length = 1; length < size; length++){
						console.log(this.cells[i+length][j].fieldState)
						if(this.cells[i+length][j].fieldState != CanvasFieldState.Empty){
							spinAble = false;
						}
					}
					if(spinAble){
						var shipInd = cell.shipIndex;
						var state = cell.fieldState;
						this.removeShipFromCanvas(cell.shipIndex);
						for(var length = 0; length < size; length++){
							//this.removeShipFromCanvas(cell.shipIndex);
							console.log("KOMMT HER")
							this.cells[i+length][j].fieldState = state;
							this.cells[i+length][j].shipIndex = shipInd;
							this.drawShip(this.cells[i+length][j]);

						}
					}
				}
			}
		}
	}



		console.log(spinAble);
	}



	removeShipFromCanvas(index){
		for(var i = 0; i < this.cells.length; i++) {
    	var line = this.cells[i];
    	for(var j = 0; j < line.length; j++) {
				if(index == this.cells[i][j].shipIndex){
					this.cells[i][j].fieldState = CanvasFieldState.Empty;
					this.cells[i][j].shipIndex = -1;
					this.clearCanvasElement(this.cells[i][j]);
				}
    	}
		}
	}

	handleMouseDown(arg){

		var left, right;
		left = 0;
		right = 2;
		if(arg.button === left){
			var indices = this.getIndicesForMouseEvent(arg);
			var cell = this.cells[indices.x][indices.y];
			this.dragShipIndex = cell.shipIndex;
			this.dragging = true;
			this.dragShipSize = this.getShipSize(cell, indices);
			this.dragHorizontal = this.getShipOrientation(cell, indices); //TODO: find out horizontal/vertical
			this.removeShipFromCanvas(this.dragShipIndex);
		}
		else{
			var indices = this.getIndicesForMouseEvent(arg);
			var cell = this.cells[indices.x][indices.y];
			this.dragShipIndex = cell.shipIndex;
			this.dragShipSize = this.getShipSize(cell, indices);
			this.dragHorizontal = this.getShipOrientation(cell, indices);
		}
	}

	//true wenn horizontal
	getShipOrientation(cell, indices){
		let x = indices.x;
		let y = indices.y;
		try{
			if(this.cells[x+1][y].shipIndex == cell.shipIndex || this.cells[x-1][y].shipIndex == cell.shipIndex){
				return true;
			}
		}
		catch (e){
		}
		return false;
	}

	handleMouseMove(arg) {

		var indices = this.getIndicesForMouseEvent(arg);


				if(this.dragging){
					this.resetDragCells(this.drageCells);
					for(var i=0; i<this.dragShipSize; i++){
						if(this.dragHorizontal){
							var cellToHover = this.cells[indices.x+i][indices.y];
							this.drageCells.push(cellToHover);
							this.addDragHoveringToCell(cellToHover);
						}else{
							var cellToHover = this.cells[indices.x][indices.y+i];
							this.drageCells.push(cellToHover);
							this.addDragHoveringToCell(cellToHover);
						}
					}
				}

	}

	handleMouseOut() {
	}

	getIndicesForMouseEvent(arg) {

		const rect = this.canvas.getBoundingClientRect();
		const mouseX = arg.clientX - rect.left;
		const mouseY = arg.clientY - rect.top;

		let positionIsInField = false;

		let indexX = 0.0;
		let indexY = 0.0;

		if (mouseX >= this.start.x + this.gridLineWidth && mouseY >= this.start.y + this.gridLineWidth) {

			indexX = Math.floor((mouseX - this.start.x - this.gridLineWidth) / (this.cellSize.width) );
			indexY = Math.floor((mouseY - this.start.y - this.gridLineWidth) / (this.cellSize.height));

			positionIsInField = true;

		} else {
			positionIsInField = false;
		}

		return {
			positionIsInField: positionIsInField,
			x: indexX,
			y: indexY
		};
	}
}
