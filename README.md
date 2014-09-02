This pool module is based on the pool code of mysql-simple-pool: https://github.com/Deathspike/mysql-simple-pool but uses Mariasql node module for better performance

### Instantiating a connection pool

A connection pool has to be instantiated. You can provide *maximumNumberOfConnections* and *options*. Options are forwarded when a managed connection is established. And *log* field in *options* is the switch to let this module print the logs to stdout.

	// Include the module.
	var mypoolsql = require('my_pool_sql');

	// Instantiate the pool. Use a maximum of 100 connections.
	app.pool = new mypoolsql(100, {
		host: 'localhost',
		user: 'root',
		password: 'root',
		db: 'test',
		log: true
	});

### Performing queries

Queries are queued and executed on the first available connection.

	pool.query('select * from posts where id = :id and name = :name', { id: 1337, name: 'Frylock' }, function(err, results) {
		console.log(results);
	});

OR

	pool.query('select * from posts', function(err, results) {
		console.log(results);
	});

The `results` contains `{query: result, rows: rows, info: info}`, which `rows` is an array of `row` objects. You may refer to mariasql node module for detail information: https://github.com/mscdex/node-mariasql

### Claiming a managed connection

A connection can be claimed, at which point is is no longer managed.

	pool.claim(function(err, conn) {
		// I can do sequential queries here. This may be required when
		// you wish to do a transaction, since the queries have to be
		// sequential.
		conn.end();
	});

End the connection to place it back into the connection pool.

### Disposing the connection pool

A node application will not close with open connections.

	pool.dispose();

Dispose ensures all pending queries finish, after which all connections are cleared.
