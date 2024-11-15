class Controller {
    constructor() {
        this.code = 404;
        this.payload = {};
    }
    get(req, res) {
        res.status(200)
        res.send("Adult Core API")
        return res;
    }
    put(req, res) {
        return {code: this.code, payload: this.payload}
    }
    post(req, res) {
        return {code: this.code, payload: this.payload}
    }
    delete(req, res) {
        return {code: this.code, payload: this.payload}
    }
    test(req, res) {
        return {code: this.code, payload: this.payload}
    }
}
module.exports = Controller;