var should = require("should");
var assert = require("assert");
var mypoolsql = require("../index.test.js");
var Client = require("mariasql");

var pool = new mypoolsql(100, {
		host: 'localhost',
		user: 'root',
		password: 'root',
		db: 'mysql',
		log: true
	});

var client = new Client({
                host: 'localhost',
                user: 'root',
                password: 'root',
                db: 'mysql'
            });


// pool.query('select * from user', function(err, results) {
//                 console.log("query results: ", results);
//             });

describe("Check mariadb client", function () {
    // describe("create connection",function () {
    //     it("1st user name should be root",function () {
    //         client.query("select * from user", function(err, rows){
    //             if (err)
    //                 console.error(err);
    //             // console.log("Rows: ", rows[0]);
    //             // console.log("Rows: " + rows[0].Password);
    //             rows[0].User.should.equal('root');
    //         });

    //         client.end();
            
    //     });
    // });

    // describe("create connection pool",function () {
    //     it("pool max number should equal to 100",function () {
    //         // console.log("Pool information: ", pool);
    //         pool.max.should.equal(100);
    //     });
    // });

    describe("create a table named MyClass",function () {
        it("result should equal to null",function () {
            // pool.query('create table MyClass(id int(4) not null primary key auto_increment, name char(20) not null, sex int(4) not null default 0, degree double(16,2));', function(err, results) {
            //     console.log("query results: ", results);
            //     results.info.should.be.true;
            // });
            pool.query('select * from user', function(err, rows) {
                if(err)
                    console.error("Error!", err);
                console.log("query results: ", rows[0]);
                console.log("query host: ", rows['info']);
                // results.info.should.be.true;
            });
        });
    });

    // describe("add one number",function  () {
    //     it("result should equal to the number",function () {
    //         add(1).should.equal(1);
    //     });

    // });

    // describe("add two number",function name() {
    //     it("result should equal to the number1+ number2",function () {
    //         add(1,2).should.equal(3);
    //     });
    // });


    // describe("add numbers",function name() {
    //     it("result should equal to number1+ number2 + ...",function () {
    //         add(1,2,3,4).should.equal(10);
    //     });
    // });
});
