const Controller = require('./controller');
const SupabasePerformer = require('@vx-orm/Performer')

class HealthController extends Controller {
    async test(req, res) {
        let test = "success"
        test = await SupabasePerformer.retrieveAll();
        res.status(200)
        res.send(test);
        return res;
    }
    home(req, res) {
        res.status(200)
        res.send("Adult Core API")
        return res;
    }
}

module.exports = new HealthController();