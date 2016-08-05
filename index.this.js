var mariasql = require('mariasql');
var date_format = require('date-format');

var iflog = false;
var debug = true;

/**
 * Represents the class managing a MySQL connection pool for node-mysql. The
 * connection pool accepts an options object which is passed to the node-mysql
 * createConnection function to establish a connection. A maximum number of
 * connections can be configured.
 *
 * @param max The maximum number of connections.
 * @param options The options with which a connection is created.
 */
function Pool(max, options) {
  // Initialize public properties.
  if (true) {
    // The maximum number of connections.
    this.max = max ? max : 100;
    // The options with which a connection is created.
    this.options = options ? options : {};
    // If need to log the queries
    iflog = this.options.log;
  }
  // Initialize private properties.
  // if (true) {
  //   // The current number of connections being established.
  //   this._currentNumberOfConnectionsEstablishing = 0;
  //   // The current number of _connections.
  //   this._currentNumberOfConnections = 0;
  //   // The established _connections.
  //   this._connections = [];
  //   // Indicates whether the pool has been disposed of.
  //   this._disposed = false;
  //   // The _pending operations.
  //   this._pending = [];
  // }

  // The current number of connections being established.
    this._currentNumberOfConnectionsEstablishing = 0;
    // The current number of _connections.
    this._currentNumberOfConnections = 0;
    // The established _connections.
    this._connections = [];
    // Indicates whether the pool has been disposed of.
    this._disposed = false;
    // The _pending operations.
    this._pending = [];
}

/**
 * Claim a managed connection. A claimed connection is not managed by the pool until
 * the connection is rebound. Once the caller has finished using the connection, rebound
 * it using the end function on the connection. This function makes it possible for a
 * transaction to function as intended.
 *
 * @param fn The callback function.
 */
Pool.prototype.claim = function(fn) {
  // Check if the pool has not been disposed of.
  if (!this._disposed) {
    // Check if the connection pool has exhausted each connection.
    if (this._connections.length === 0) {
      // Push the claim to the pending operations.
      this._pending.push({claiming: true, fn: fn});
      // Update the connection pool
      this._update();
    }
    // Otherwise a connection is available.
    else {
      // Retrieve a connection.
      var pc = this._connections.pop();
      var connection = pc.connection;
      // Send the connection to the callback function.
      fn(null, connection);
    }
  }
};

/**
 * Dispose of the connection this. Further queries are ignored, but all pending
 * operations are handled. Once the pending operations have been finished, the
 * connections are removed.
 */
Pool.prototype.dispose = function() {
  // Check if the pool has not been disposed of.
  if (!this._disposed) {
    // Set the status indicating whether the pool has been disposed of.
    this._disposed = true;
  }
};

/**
 * Execute a query. This will add the operation to the pending operations and instructs
 * the connection pool to find an available connection. When a connection is not available,
 * a connection is established. If the maximum number of connections has been reached, the
 * operation will be pending until a connection is returned.
 *
 * @param query The query to execute.
 * @param options The options
 * @param fn The callback function.
 */
Pool.prototype.query = function(query, values, options, fn) {
  // Check if the pool has not been disposed of.
  if (!this._disposed) {
    if (typeof values == 'function') {
    //   console.log('[my_pool_sql] callback fn: ', values);
      // Set the callback to the values.
      fn = values;
      // Initialize the options.
      values = null;
      options = null;
    }
    // Check if the options variable is a function.
    if (typeof options == 'function') {
      // Set the callback to the options.
      fn = options;
      // Initialize the options.
      options = null;
    }
    // console.log('[my_pool_sql] callback fn after: ', fn);
    // Push the query to the pending operations.
    this._pending.push({claiming: false, query: query, values: values, options: options, fn: fn});
    // console.log('[my_pool_sql] pending: ', this._pending);
    // Update the connection pool and pending queries.
    this._update();
    // Iterate until sufficient managed _connections are establishing.
    while (this._currentNumberOfConnectionsEstablishing < this._pending.length) {
      // Create a managed connection.
      if (!this._create()) {
        break;
      }
    }
  }
};

/**
 * Create a managed connection. A managed connection has an event handler to detect
 * connection errors and changes the termination behaviour. Once the managed connection
 * has been established, it is added to the connection this.
 *
 * @return Indicates whether a connection is being established.
 */
Pool.prototype.makeClient = function(callback) {
  var client = new mariasql(this.options);

  // if(iflog) console.log('[my_pool_sql][makeClient] new client: ', client);
  
  this._currentNumberOfConnections++;

  client._end = client.end;
  var pool = this;
  client.end = function() {
    // Update the connection pool and _pending queries.
    // this._update();
    pool._connections.push(client);
    pool._currentNumberOfConnectionsEstablishing++;
    if(debug) console.log('[my_pool_sql][makeClient] don\'t end: ', client.connected);
  };

  client.on('ready', function() {
    if(debug) console.log('[my_pool_sql][makeClient] connection ready: ', client.connected);
    this._currentNumberOfConnectionsEstablishing--;
  })
    .on('error', function(err){
        console.error("Connection Error! ", err);
      // Check if the connection has been lost.
      if (err.fatal && err.code !== 'PROTOCOL_CONNECTION_LOST') {
        // Decrement the current number of _connections.
        // this._currentNumberOfConnections--;
        this._currentNumberOfConnections--;
      }
      // Update the connection this.
      // this._update();
      this._update();
    })
    .on('end', function(){
      if(iflog) {
        var logtimestamp = date_format("[yyyy-MM-dd hh:mm:ss]", new Date());
        console.log('[my_pool_sql]' + logtimestamp + ' Done with all results, deposed this connection...');
      }
    })
    .on('close', function() {

      if(iflog) {
        var logtimestamp = date_format("[yyyy-MM-dd hh:mm:ss]", new Date());
        console.log('[my_pool_sql]' + logtimestamp + ' This connection is closed');
      }
    });

  this._connections.push(client);

  this._update();

  // if(debug) console.log('[my_pool_sql][makeClient] is connection ready: ', client.connected);
  
  callback();
  
}

Pool.prototype._create = function() {
  if(debug) console.log('[my_pool_sql][_create] do we need a new connection: ', this._currentNumberOfConnections + this._currentNumberOfConnectionsEstablishing);
  
  // Check if a connection may be established.
  if (this._currentNumberOfConnections + this._currentNumberOfConnectionsEstablishing < this.max) {
    // Create a connection.
    this.makeClient(function() {
      if(iflog) {
        var logtimestamp = date_format("[yyyy-MM-dd hh:mm:ss]", new Date());
        console.log('[my_pool_sql]' + logtimestamp + ' Create new mariasql connection');
      }

      // Return true.
      return true;
    });  //new mariasql(this.options);
    
  }
  // Otherwise return false.
  else return false;
};

/**
 * Update the connection this. This method is called whenever a change in the
 * connection pool has occured, handles pending operations and establishes
 * connections.
 */
Pool.prototype._update = function() {
  // Check if a _pending query is available.
  if(debug) console.log('[my_pool_sql][_update] current pool connections: ', this._currentNumberOfConnections + this._currentNumberOfConnectionsEstablishing);
  if(debug) console.log('[my_pool_sql][_update] query queue size: ', this._pending.length)
  if (this._pending.length !== 0) {
    // Check if a connection is available.
    if(debug) console.log('[my_pool_sql][_update] connection pool size: ', this._connections.length);
    if (this._connections.length !== 0) {
      //console.log('[my_pool_sql] Now pool size: ', this._connections.length)
      // Retrieve a connection.
      var connection = this._connections.pop();
    //   console.log('[my_pool_sql][_update] connection from pool: ', connection);
            
      // Retrieve a _pending query.
      var pending = this._pending.pop();

    //   console.log('[my_pool_sql] pending: ', pending);

      if(pending.claiming === true) {
        //  console.log('[my_pool_sql] claiming == true')
        pending.fn(null, connection);
      }
      else {
        // Execute the query using this handler to rebound the connection.
        if(debug) {
          console.log('[my_pool_sql][_update] pending query: ', pending.query);
          console.log('[my_pool_sql][_update] pending callback: ', pending.fn);
          console.log('[my_pool_sql][_update] connection ready: ', connection.connected);
        }
        var query = connection.query(pending.query, pending.values, pending.options);//, pending.fn);
        query.on('result', function(res){
          connection.end();
          var rows = [];
          var info = res.info;
          res.on('data', function(row) {
              // console.dir(row);
              rows.push(row);
          }).on('end', function() {
              if(debug) console.log('Result set finished');
              pending.fn(null, {query: res, rows: rows, info: info});
          });
        }).on('error', function(err){
          connection.end();
          pending.fn(err);
        }).on('end', function() {
          connection.end();
          if(debug) console.log('No more result sets!');
        });
      }

    }
    // Otherwise a connection may have to be established.
    else {
      // Iterate until sufficient managed _connections are establishing.
      if(debug) console.log('[my_pool_sql][_update] _currentNumberOfConnectionsEstablishing size: ', this._currentNumberOfConnectionsEstablishing)
      while (this._currentNumberOfConnectionsEstablishing < this._pending.length) {
        // Create a managed connection.
        if (!this._create()) {
          break;
        }
      }
    }
  }
  // Otherwise check if the pool has been disposed of.
  else if (this._disposed) {
    // Iterate through each connection.
    for (var i = 0; i < this._connections.length; i++) {
      // Terminate the connection.
      this._connections[i]._end();
    }
    // Clear connections.
    this._connections.length = 0;
  }
};

// Export the Pool class.
module.exports = Pool;
