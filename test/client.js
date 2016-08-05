var mypoolsql = require("../index.this.js");
var Client = require("mariasql");

var pool = new mypoolsql(100, {
		host: 'localhost',
		user: 'root',
		password: 'passw0rd',
		db: 'mysql',
		log: true
	});
 
// var c = new Client({
//   host: '127.0.0.1',
//   user: 'root',
//   password: 'root'
// });

// c.query('SHOW DATABASES', function(err, rows) {
//   if (err)
//     throw err;
//   console.dir(rows);
// });
 
// c.end();

pool.query('select * from user', function(err, result) {
                if(err)
                    console.error("Error!", err);
                // console.log("query results: ", result.rows);
                console.log("user query info: ", result['info']);
                console.log("Pool size:", pool._connections.length);
            });
pool.query('select * from db', function(err, result) {
                if(err)
                    console.error("Error!", err);
                // console.log("query results: ", result.rows);
                console.log("db query info: ", result['info']);
                console.log("Pool size:", pool._connections.length);
            });
pool.query('select * from event', function(err, result) {
                if(err)
                    console.error("Error!", err);
                // console.log("query results: ", result.rows);
                console.log("event query info: ", result['info']);
                console.log("Pool size:", pool._connections.length);
            });
pool.query('select * from func', function(err, result) {
                if(err)
                    console.error("Error!", err);
                // console.log("query results: ", result.rows);
                console.log("func query info: ", result['info']);
                console.log("Pool size:", pool._connections.length);
            });


// pool.dispose();