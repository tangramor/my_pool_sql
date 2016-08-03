var mypoolsql = require("../index.test.js");
var Client = require("mariasql");

var pool = new mypoolsql(100, {
		host: 'localhost',
		user: 'root',
		password: 'root',
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
                console.log("query results: ", result.rows);
                console.log("query host: ", result['info']);
            });
// pool.dispose();