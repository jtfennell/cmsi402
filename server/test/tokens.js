process.env.NODE_ENV = 'test';

var supertest = require('supertest');
var dotenv    = require('dotenv');
var should    = require('should');
var api       = require('../src/server.js');
var database  = require('../../database/pg-client.js');
var fs        = require('fs');
var request   = supertest(api);

var deleteFromAllTables = fs.readFileSync('./database/clearSchema.sql').toString();
var dropAllTables       = fs.readFileSync('./database/dropSchema.sql').toString();
var setUpSchema         = fs.readFileSync('./database/schema.sql').toString();

dotenv.load();

before(function(done) {   
   database.query(dropAllTables + setUpSchema, done);
});

beforeEach(function(done) {
    database.query(deleteFromAllTables, done)
});

describe('/api/v1/tokens', function() {
    context('DELETE', function() {
        it('returns 405 response code', function(done) {
            request
            .delete('/api/v1/tokens')
            .expect(405, done);
        });
    });

    context('POST', function() {
        context('When request is valid', function() {
            context('When user exists', function() {
                var user = {
                    "username" : "jeff",
                    "email"    : "fake@email.com",
                    "password" : "password",
                    "firstName": "Jeff",
                    "lastName" : "Fennell"
                };

                it('returns 201 response code', function(done) {
                    database.query(
                        `INSERT INTO users(
                            username,
                            email,
                            password,
                            first_name,
                            last_name
                        ) 
                        VALUES(
                            'jeff',
                            'fake@email.com',
                            crypt('password',gen_salt('bf')),
                            'Jeff',
                            'Fennell'
                        )`, 
                        function() {
                            request
                            .post('/api/v1/tokens')
                            .set('Accept','application/json')
                            .send(user)
                            .expect(201, done);
                        }
                    );
                });
                
                it('creates and returns a jwt for the new user', function(done) {
                    database.query(
                        `INSERT INTO users(
                            username,
                            email,
                            password,
                            first_name,
                            last_name
                        ) 
                        VALUES(
                            'jeff',
                            'fake@email.com',
                            crypt('password',gen_salt('bf')),
                            'Jeff',
                            'Fennell'
                        )`, 
                        function() {
                            request
                            .post('/api/v1/tokens')
                            .set('Accept','application/json')
                            .send(user)
                            .end(function(err, res) {
                                res.body.token.should.be.ok();
                                done();
                            });
                        }
                    );
                });
                
                it('returns the id of the user', function(done) {
                    database.query(
                        `INSERT INTO users(
                            username,
                            email,
                            password,
                            first_name,
                            last_name
                        ) 
                        VALUES(
                            'jeff',
                            'fake@email.com',
                            crypt('password',gen_salt('bf')),
                            'Jeff',
                            'Fennell'
                        )`, 
                        function() {
                            request
                            .post('/api/v1/tokens')
                            .set('Accept','application/json')
                            .send(user)
                            .end(function(err, res) {
                                res.body.userId.should.be.ok();
                                done();
                            });
                        }
                    );
                });
                
                it('returns the first name of the user', function(done) {
                    database.query(
                        `INSERT INTO users(
                            username,
                            email,
                            password,
                            first_name,
                            last_name
                        ) 
                        VALUES(
                            'jeff',
                            'fake@email.com',
                            crypt('password',gen_salt('bf')),
                            'Jeff',
                            'Fennell'
                        )`, 
                        function() {
                            request
                            .post('/api/v1/tokens')
                            .set('Accept','application/json')
                            .send(user)
                            .end(function(err, res) {
                                res.body.firstName.should.be.ok();
                                done();
                            });
                        }
                    );
                });
                
                it('returns the last name of the user', function(done) {
                    database.query(
                        `INSERT INTO users(
                            username,
                            email,
                            password,
                            first_name,
                            last_name
                        ) 
                        VALUES(
                            'jeff',
                            'fake@email.com',
                            crypt('password',gen_salt('bf')),
                            'Jeff',
                            'Fennell'
                        )`, 
                        function() {
                            request
                            .post('/api/v1/tokens')
                            .set('Accept','application/json')
                            .send(user)
                            .end(function(err, res) {
                                res.body.lastName.should.be.ok();
                                done();
                            });
                        }
                    );
                });
            });  

            context('When user does not exist', function() {
                var user = {
                    "username" : "jeff",
                    "email"    : "fake@email.com",
                    "password" : "password",
                    "firstName": "Jeff",
                    "lastName" : "Fennell"
                };

                it('returns a 404 status code', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept','application/json')
                    .send(user)
                    .expect(404, done)
                });

                it('does not return a token', function(done) {
                     request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .end(function(err, res) {
                        should.not.exist(err);
                        should.not.exist(res.body.token);
                        done();
                    });
                })
            });            
        });

        context('When request is invalid', function() {
            context('When username missing', function() {
                var user = {"password":"password","email":"email@email.com"};

                it('returns 400 status code', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .expect(400, done);
                });

                it('does not return a token', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .end(function(err, res) {
                        should.not.exist(err);
                        should.not.exist(res.body.token);
                        done();
                    });
                })
            });

            context('When username does not exist', function() {
                var user = {
                    "username": "jeff",
                    "password": "password"
                }

                it('returns 404 status code', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .expect(404, done)
                });

                it('does not return a token', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .end(function(err, res) {
                        should.not.exist(err);
                        should.not.exist(res.body.token);
                        done();
                    });
                })
            });

            context('When password incorrect for username', function() {
                var user = {
                        "username": "jeff",
                        "password": "theWrongPassword"
                    }
                it('returns 404  status code', function(done) {
                    

                    database.query(
                        `INSERT INTO users(
                            username,
                            email,
                            password,
                            first_name,
                            last_name
                        ) 
                        VALUES(
                            'jeff',
                            'fake@email.com',
                            crypt('password',gen_salt('bf')),
                            'Jeff',
                            'Fennell'
                        )`,
                        request
                        .post('/api/v1/tokens')
                        .set('Accept', 'application/json')
                        .send(user)
                        .expect(404, done)
                    )
                });
                
                it('does not return a token', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .end(function(err, res) {
                        should.not.exist(err);
                        should.not.exist(res.body.token);
                        done();
                    });
                })
            });

            context('When password missing', function() {
                var user = {"username": "jeff", "email": "fake@email.com"};

                it('returns 400 status code', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .expect(400, done);
                });

                it('does not return a token', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .end(function(err, res) {
                        should.not.exist(err);
                        should.not.exist(res.body.token)
                        done();
                    });
                });
            });

            context('When password is length 0', function() {
                var user = {"username":"jeff", "email": "fake@email.com"};
                
                it('returns 400 status code', function(done){
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .expect(400, done);
                });

                it('does not return a token', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .end(function(err, res) {
                        should.not.exist(err);
                        should.not.exist(res.body.token);
                        done();
                    })
                })
            });

            context('When username is length 0', function() {
                var user = {"username":"", "password":"password"};
                it('returns 400 status code', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .expect(400, done);
                });

                it('does not return a token', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .end(function(err, res) {
                        should.not.exist(err);
                        should.not.exist(res.body.token);
                        done();
                    });
                });
            });

            context('When username is length 0', function() {
                var user = {"username":"", "password":"password"};
                it('returns 400 status code', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .expect(400, done);
                });

                it('does not return a token', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .end(function(err, res) {
                        should.not.exist(err);
                        should.not.exist(res.body.token);
                        done()
                    });
                })
            });

            context('When username invalid case', function() {
                var user = {
                        "username": "Jeff",
                        "password": "password"
                    }

                it('returns 404 status code', function(done) {
                    database.query(
                        `INSERT INTO users(
                            username,
                            email,
                            password,
                            first_name,
                            last_name
                        ) 
                        VALUES(
                            'jeff',
                            'fake@email.com',
                            crypt('password',gen_salt('bf')),
                            'Jeff',
                            'Fennell'
                        )`,
                        request
                        .post('/api/v1/tokens')
                        .set('Accept', 'application/json')
                        .send(user)
                        .expect(404, done)
                    );
                });
                
                it('does not return a token', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .end(function(err, res) {
                        should.not.exist(err);
                        should.not.exist(res.body.token);
                        done()
                    });
                })
            });

            context('When password invalid case', function() {
                var user = {
                        "username": "jeff",
                        "password": "Password"
                    }

                it('returns 400 status code', function(done) {
                    database.query(
                        `INSERT INTO users(
                            username,
                            email,
                            password,
                            first_name,
                            last_name
                        ) 
                        VALUES(
                            'jeff',
                            'fake@email.com',
                            crypt('password',gen_salt('bf')),
                            'Jeff',
                            'Fennell'
                        )`,
                        request
                        .post('/api/v1/tokens')
                        .set('Accept', 'application/json')
                        .send(user)
                        .expect(404, done)
                    );
                });
                
                it('does not return a token', function(done) {
                    request
                    .post('/api/v1/tokens')
                    .set('Accept', 'application/json')
                    .send(user)
                    .end(function(err, res) {
                        should.not.exist(err);
                        should.not.exist(res.body.token);
                        done();
                    });
                })
            });
        });
    })
});