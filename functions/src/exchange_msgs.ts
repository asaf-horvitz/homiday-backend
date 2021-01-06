

export class ExchangeMsg {
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
    status() {
        return this.change.after.get('status');
    }
    confirm() {
        return this.status().includes('confirm');
    }
    cancel() {
        return this.status().includes('cancel');
    }
    inProgress() {
        return this.status().includes('inProgress');        
    }
    decline() {
        return this.status().includes('decline');        
    }
}