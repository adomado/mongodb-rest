var sys = require("sys");

exports.create = function(options, hooks) {
	
	// create express application
	var express = require('express');
	var app = express.createServer();
	app.enable("jsonp callback");

	// Configuration
	app.configure(function(){
		
	    app.set('views', __dirname + '/views');
	    app.set('view engine', 'jade');
        app.set('options', options);
	    app.set('dbconnection', options.dbconnection);
        if(options.augmentWithTimestamps)
            app.set("augmentObject", function(command) {
                if(command == "create")
                    return function(data, next) {
                        data.createdAt = new Date();
                        data.updatedAt = new Date();
                        next();
                    };
                if(command == "update")
                    return function(data, next) {
                        data.updatedAt = new Date();
                        next();
                    }
            });
	    
	    app.renderResponse = function(res, err, data, allCount) {
		  	res.header('Content-Type', 'application/json');
		  	if(err == null) {
			  	if(typeof allCount == "undefined")
				  	res.send({data: data, success: true});
			  	else
				  	res.send({allCount: allCount, data: data, success: true});
		  	} else {
	  			sys.log(sys.inspect(err));
	  			res.send({success: false, error:err.message});
		  	}
		};


		// Render JSONP response - SHOULD only be used from GET requests
		// Automagicallu uses the callback mentioned in req object
		app.renderJsonpResponse = function(res, err, data) {
			if(err == null)
				res.json({data : data, success : true});
			else
				res.json({success : false, error : err.message});
		};


		app.use(express.bodyParser());
		app.use(express.methodOverride());
		if(typeof hooks != "undefined" && hooks['pre-router']) {
			hooks['pre-router'](app);
			sys.log("pre-router hook executed");
		}
		app.use(app.router);
		app.use(express.static(__dirname + '/public'));
	});
	
	app.configure('development', function(){
	  app.use(express.logger());
	  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});
	
	app.configure('production', function(){
	  app.use(express.errorHandler());
	});
	
	// Routes
    require("./controllers/admin").register(app);
	require("./controllers/get").register(app);
	require("./controllers/post").register(app);
	require("./controllers/delete").register(app);
	require("./controllers/put").register(app);
	require("./controllers/index").register(app);
	require("./controllers/timestamp").register(app);
	
	// set env value from the config
	app.settings.env = app.set('options').mode;
	
	// create simple server API object
	app.start = function() {
		if(app.set('started'))
			return;
		app.set('started', true);
		app.listen(app.set("options").port);
		sys.log("Express server | mongodb rest interface listening on port "+app.address().port+" in "+app.settings.env+" mode");
		return app;
	};
	
	// auto start the server
	if(app.set('options').autoStart)
		app.start();
	
	// return for usage
	return app;
};
