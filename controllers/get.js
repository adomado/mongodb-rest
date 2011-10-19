var listCommand = require("../commands/list");
var sys = require("sys");

exports.register = function(app) {
	app.get('/:db/:collection/:id?', function(req, res, next) {
        // JSON decode query or spec
		var spec = req.query.query? JSON.parse(req.query.query) : {};
            spec = req.query.spec? JSON.parse(req.query.spec) : spec;

        if(req.params.id)
            spec._id = req.params.id;

        // JSON decode options
	    var options = req.query.options?JSON.parse(req.query.options) : {};
        if(app.set('options').alwaysCountQueryHits)
            options.countQueryHits = true;
        if(req.query.limit)
            options.limit = parseInt(req.query.limit);
        if(req.query.skip)
            options.skip = parseInt(req.query.skip);
        if(req.query.offset)
            options.skip = parseInt(req.query.offset);
        if(req.query.deep)
            options.dereference = true;
        if(req.query.sort)
            options.sort = JSON.parse(req.query.sort);

        listCommand(
            {
                connection: app.set("dbconnection"),
                db: req.params.db,
                collection: req.params.collection
            },
            spec,
            options,
            function(err, docs, allCount) {
                app.renderResponse(res, err, docs, allCount);
            });
	});
};
