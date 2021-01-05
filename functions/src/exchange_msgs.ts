

export class Exchange {
    change = undefined;
    constructor(change) {
        this.change = change;
    }

    to() {
        return this.change.after.get('to');
    }
    from() {
        return this.change.after.get('from');
    }
    confiremd() {
        return this.change.after.get('from');
    }

}