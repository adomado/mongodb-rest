var mongo = require("mongodb");
//var ObjectID = require("mongodb/external-libs/bson").ObjectID;
var dereferenceFunc = require("./helpers/dereference");
var dbconnection = require("./helpers/dbconnection");
var jsonUtils = require("./helpers/jsonUtils");
var sys = require("sys");

/*
    target = { connection: { host, port }, db, collection } || { connection: [ {host, port} ], db, collection }
    spec = {}
    options = { limit, skip, order, dereference: true, countQueryHits: true }
    next = function(err, docs || doc, hitsCount)
*/
module.exports = function(target, spec, options, next) {
  // get custom options values and delete them, leaving options lean for mongodb
  var countQueryHits = options.countQueryHits;
  delete options.countQueryHits;

  var dereference = options.dereference;
  delete options.dereference;

  // deep decode spec
  jsonUtils.deepDecode(spec);

  dbconnection.open(target.db, target.connection, function(err,db) {
    if(err) { next(err); return; }
    // open collection
    db.collection(target.collection, function(err, collection) {

      if(spec._id) { // dereference is currently supported only for single object
    
        // if there is requested object by ID -> query only One document
        collection.findOne(spec, options, function(err, doc){

          if(dereference == true && doc != null) {
            dereferenceFunc(db, doc, function(err) {
              next(err, doc);
            });
          } else
            next(err, doc);

          //db.close();
        });
      }
      else
      {
        if (options.distinct)
        {
          var key = options.distinct;
          delete options.distinct;
          collection.distinct(key, spec, function(err, docs)
          {
            if(countQueryHits)
            {
              next(err, docs, docs.length);
            }
            else
            {
              next(err, docs);
            }
            //db.close();
          });
        }
        else
        {
          // otherwise find all matching given query but without dereference support, 
          // however has countQueryHits instead
          collection.find(spec, options, function(err, cursor)
          {
            cursor.toArray(function(err, docs)
            {
              if(countQueryHits)
              {
                //FIXME count is not correct as there is no additional options, is it so designed
                collection.count(spec, function(err, allCount) {
                  next(err, docs, allCount);
                });
              }
              else
              {
                next(err, docs);
              }
              //db.close();
            });
          });
        }
      }
    });
  });
}
