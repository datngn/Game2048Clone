import { _decorator, Component, Vec2, } from 'cc';
import { Tile } from './Tile';
const { ccclass, property } = _decorator;

@ccclass('TileCell')
export class TileCell extends Component {
    public tile: Tile | null = null;

    // Toạ độ
    public coordinates: Vec2 = new Vec2(0,0);

    get empty(): boolean {
        return this.tile === null;
    }

    setTile(tile: Tile) {
        this.tile = tile;
    }

    clearTile() {
        this.tile = null;
    }
}