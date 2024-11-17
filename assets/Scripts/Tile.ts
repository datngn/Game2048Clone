import { _decorator, Component, tween, Label, Color, Sprite } from 'cc';
import { TileCell } from './TileCell';
const { ccclass, property } = _decorator;

@ccclass('Tile')
export class Tile extends Component {
    @property(Label)
    public label: Label | null = null;
    public cell: TileCell | null = null;
    public value: number = 2;

    public init(cell: TileCell, value: number) {
        this.cell = cell;
        this.value = value;
        this.cell.setTile(this);
        this.updateDisplay();
        this.node.setPosition(cell.node.position);
    }

    public setValue(newValue: number) {
        this.value = newValue;
        this.updateDisplay();
    }

    public updateDisplay() {
        this.label.string = this.value > 0 ? this.value.toString() : '';
       
       const sprite = this.node.getComponent(Sprite);
       if (sprite) {
           sprite.color = this.getColorForValue(this.value);
       }
    }

       getColorForValue(value: number): Color {
       switch (value) {
           case 2: return new Color(238, 228, 218);
           case 4: return new Color(237, 224, 200);
           case 8: return new Color(242, 177, 121);
           case 16: return new Color(245, 149, 99);
           case 32: return new Color(246, 124, 95);
           case 64: return new Color(246, 94, 59);
           case 128: return new Color(237, 207, 114);
           case 256: return new Color(237, 204, 97);
           case 512: return new Color(237, 200, 80);
           case 1024: return new Color(237, 197, 63);
           case 2048: return new Color(237, 194, 46);
           default: return new Color(205, 193, 180);
       }
   }

    // Di chuyển tới ô trống
    public moveTo(cell: TileCell) {
        if (this.cell) this.cell.clearTile();
        this.cell = cell;
        this.cell.setTile(this);

        tween(this.node)
            .to(0.1, { position: cell.node.position }, { easing: 'smooth' })
            .start();
    }

    // Gộp với ô đích
    public mergeTo(targetCell: TileCell) {
        if (this.cell) this.cell.clearTile();
    
        tween(this.node)
            .to(0.1, { position: targetCell.node.position }, { easing: 'smooth' })
            .call(() => {
                if(targetCell.tile){
                    this.node.destroy();
                }
            })
            .start();
        targetCell.tile.setValue(targetCell.tile.value*2);
    }
}

