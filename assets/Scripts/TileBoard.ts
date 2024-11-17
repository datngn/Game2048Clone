import { _decorator, Component, Node, Prefab, instantiate, Vec2, EventTouch, Vec3 } from 'cc';
import { Tile } from './Tile';
import { TileCell } from './TileCell';
import { Popup } from './Popup';

const { ccclass, property } = _decorator;

@ccclass('TileBoard')
export class TileBoard extends Component {
    @property(Prefab)
    private tilePrefab: Prefab | null = null;

    @property([TileCell])
    private cells: TileCell[] = [];

    @property(Popup)
    private popup: Popup | null = null;

    private tiles: Tile[] = [];
    private boardSize: number = 4;
    private touchStartPos: Vec3 | null = null;

    start() {
        this.initBoard();
        this.spawnTile();
        this.spawnTile();
        
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    private initBoard() {
        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i];
            const x = i % this.boardSize;
            const y = Math.floor(i / this.boardSize);
            cell.coordinates = new Vec2(x, y); // set toạ độ cho ô
            cell.clearTile();
        }
    }

    private spawnTile() {
        const emptyCells = this.cells.filter(cell => cell.empty);
        if (emptyCells.length === 0) return;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const tileNode = instantiate(this.tilePrefab!);
        const tile = tileNode.getComponent(Tile)!;
        tile.init(randomCell, 2);
        this.tiles.push(tile);
        this.node.addChild(tileNode);
    }

    private onTouchStart(event: EventTouch) {
    if (this.isPopupActive()) return;
    // Lưu vị trí vuốt ban đầu theo toạ độ của bảng
    const touchStartWorldPos = event.getLocation();
    this.touchStartPos = this.node.inverseTransformPoint(new Vec3(), new Vec3(touchStartWorldPos.x, touchStartWorldPos.y, 0));
}

private onTouchEnd(event: EventTouch) {
    if (this.isPopupActive()) return;
    if (!this.touchStartPos) return;

    // Lấy vị trí kết thúc vuốt theo toạ độ của bảng
    const touchEndWorldPos = event.getLocation();
    const touchEndPos = this.node.inverseTransformPoint(new Vec3(), new Vec3(touchEndWorldPos.x, touchEndWorldPos.y, 0));

    // Vecto hướng vuốt
    const delta = touchEndPos.subtract(this.touchStartPos);

    // Xác định hướng vuốt
    if(Math.abs(delta.x) > 50 || Math.abs(delta.y) > 50){
        if (Math.abs(delta.x) > Math.abs(delta.y)) {
            if (delta.x > 0) {
                this.moveTiles(new Vec2(1, 0)); // Phải
            } else {
                this.moveTiles(new Vec2(-1, 0)); // Trái
            }
        } else {
        // set toạ độ ô từ trái phải trên xuống nên khi xét hướng vuốt theo trục y cần lấy ngược lại
            if (delta.y > 0) {
                this.moveTiles(new Vec2(0, -1)); // Xuống
            } else {
                this.moveTiles(new Vec2(0, 1)); // Lên
            }
        }
    }
        
    this.touchStartPos = null;
}

    private moveTiles(direction: Vec2) {
        let moved = false;
        
        // Tạo mảng đánh dấu các ô di chuyển hoặc gộp
        let movedCells: Set<TileCell> = new Set();

        // Duyệt từng ô
        for (let i = 0; i < this.boardSize; i++) {
            const rowOrColumn = this.getRowOrColumn(i, direction);
            if (direction.x === 1 || direction.y === 1) {
                rowOrColumn.reverse();
            }

            for (let j = 0; j < rowOrColumn.length; j++) {
                const currentCell = rowOrColumn[j];
                if (!currentCell.tile) continue;  // Bỏ qua ô trống
                let targetCell = this.getTargetCell(currentCell, direction, movedCells);
                if (targetCell) {
                    if (targetCell.tile && targetCell.tile.value === currentCell.tile.value && !movedCells.has(targetCell)) {
                        // Gộp ô
                        this.removeTile(currentCell.tile);
                        currentCell.tile.mergeTo(targetCell);
                        moved = true;
                        movedCells.add(targetCell);
                    } else {
                        // Di chuyển tile đến ô đích
                        if (currentCell.tile.cell !== targetCell) {
                            currentCell.tile.moveTo(targetCell);
                            moved = true;
                        }
                    }
                }
            }
        }
        // Nếu có di chuyển, check win/lose và tạo ô mới
        if (moved) {
            this.spawnTile();
            this.checkGameOver();
            this.checkWin();
        }
    }

    // Lấy hàng hoặc cột theo hướng vuốt
    private getRowOrColumn(index: number, direction: Vec2): TileCell[] {
        let rowOrColumn: TileCell[] = [];
        for (let i = 0; i < this.boardSize; i++) {
            rowOrColumn.push(direction.x === 0 ? this.cells[i * this.boardSize + index] : this.cells[index * this.boardSize + i]);
        }
        return rowOrColumn;
    }

    // Tìm ô đích
    private getTargetCell(currentCell: TileCell, direction: Vec2, movedCells: Set<TileCell>): TileCell | null {
        let target = currentCell;
        let nextCell: TileCell | null;
    
        while (true) {
            nextCell = this.getAdjacentCell(target, direction);
    
            // Dừng nếu không còn ô tiếp theo
            if (!nextCell) break;
    
            // Nếu ô tiếp theo có tile, kiểm tra gộp
            if (nextCell.tile) {
                if (nextCell.tile.value === currentCell.tile!.value && !movedCells.has(nextCell)) {
                    return nextCell;
                }
                // Nếu ko gộp đc, dừng vòng lặp
                break;
            }
            
            // Di chuyển đến ô trống tiếp theo
            target = nextCell;
        }
    
        // Trả về ô đích hoặc null nếu không di chuyển
        return target === currentCell ? null : target;
    }

    // Lấy ô liền kề theo hưỚng vuốt
    private getAdjacentCell(cell: TileCell, direction: Vec2): TileCell | null {
        const x = cell.coordinates.x + direction.x;
        const y = cell.coordinates.y + direction.y;
        return this.isValidCoordinate(x, y) ? this.cells[y * this.boardSize + x] : null;
    }

    // Check toạ độ hợp lệ hay ko
    private isValidCoordinate(x: number, y: number): boolean {
        return x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize;
    }

    private checkGameOver() {
        // Nếu ko còn ô trống và ko thể gộp
        const isGameOver = !this.cells.some(cell => cell.empty || this.canMerge(cell));
        if (isGameOver) {
            if (this.popup) {
                this.popup.showMessage("Game Over!");
            }
        }
        return isGameOver;
    }

    // Kiểm tra ô có thể gộp theo hướng bất kỳ hay ko
    private canMerge(cell: TileCell): boolean {
        const directions = [new Vec2(0, 1), new Vec2(0, -1), new Vec2(1, 0), new Vec2(-1, 0)];
        for (const dir of directions) {
            const adjacent = this.getAdjacentCell(cell, dir);
            if (adjacent && adjacent.tile?.value === cell.tile?.value) {
                return true;
            }
        }
        return false;
    }

    private checkWin(): boolean {
        for (const cell of this.cells) {
            if (cell.tile && cell.tile.value >= 2048) {
                console.log("You Win!");
                if (this.popup) {
                    this.popup.showMessage("You Win!");
                }
                return true;
            }
        }
        return false;
    }
    
    public restartGame() {
        // Xóa tất cả tiles
        for (const tile of this.tiles) {
            if (tile?.node?.isValid) {
                tile.node.destroy();
            }
        }
        this.tiles = [];
    
        // Reset cells
        for (const cell of this.cells) {
            cell.clearTile();
        }
    
        // Tạo 2 tiles mới
        this.spawnTile();
        this.spawnTile();
    }

    public removeTile(tile: Tile) {
        const index = this.tiles.indexOf(tile);
        if (index > -1) {
            this.tiles.splice(index, 1); // Xóa tile khỏi mảng tiles
        }
    }

    private isPopupActive(): boolean {
        return this.popup?.node.active ?? false;
    }
}
