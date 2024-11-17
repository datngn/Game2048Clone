import { _decorator, Component, Label, Button } from 'cc';
const { ccclass, property } = _decorator;
import { TileBoard } from './TileBoard';
@ccclass('Popup')
export class Popup extends Component {
    @property(Label)
    public messageLabel: Label | null = null;

    @property(Button)
    public restartButton: Button | null = null;

    @property(TileBoard)
    public tileBoard: TileBoard | null = null;

    onLoad() {
        if (this.restartButton) {
            this.restartButton.node.on(Button.EventType.CLICK, this.onRestart, this);
        }
    }

    public showMessage(message: string) {
        if (this.messageLabel) {
            this.messageLabel.string = message;
        }
        this.node.active = true;
    }

    public hide() {
        this.node.active = false;
    }

    public onRestart() {
        console.log('Restart game!');
        this.hide();
        if (this.tileBoard) {
            this.tileBoard.restartGame();
        }
    }

    
}
