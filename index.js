var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
var mongojs = require('mongojs');
var ObjectId = require('mongodb').ObjectID;
var config = require('./config'); // get our config file
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var request = require('request');

var db = mongojs(config.database, ['users']);

var User   = require('./user'); // get our mongoose model

var cookieParser = require('cookie-parser')
app.use(cookieParser())

var morgan      = require('morgan');
var mongoose    = require('mongoose');
mongoose.connect(config.database); // connect to database
//mongo ds243085.mlab.com:43085/mydatabase -u kaiyast -p 123456789

// var db = mongojs('mongodb://kaiyast:123456789@ds243085.mlab.com:43085/mydatabase', ['users'])
/* Body Parser Middleware */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.set('superSecret', config.secret); // secret variable

/* setup view engine */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));





// Authen
app.get('/login', function(req, res) {
    res.render('login', {
    });
});

app.get('/', function (req, res) {
    console.log("connect mlab")
    db.users.find(function (err, docs) {
        if (err) {
            console.error(err);
        }
        /* passing data object to render in index */
        res.render('index', {
            title: 'Customer DB list:',
            users: docs
        });
    });

});

var apiRoutes = express.Router(); 

apiRoutes.post('/login', function(req, res) {

        // find the user
        User.findOne({
            email: req.body.email
        }, function(err, user) {
    
    
            if (err) throw err;
    
            if (!user) {
                res.json({ success: false, message: 'Authentication failed. User not found.' });
            } else if (user) {
    
                // check if password matches
                if (user.password != req.body.password) {
                    res.json({ success: false, message: 'Authentication failed. Wrong password.' });
                } else {
    
                    // if user is found and password is right
                    // create a token
                    var payload = {
                        email: user.email,
                        admin: user.admin,
                        id: user._id
                    }
                    var token = jwt.sign(payload, app.get('superSecret'), {
                        expiresIn: 86400 // expires in 24 hours
                    });
    
                    res.cookie('auth',token);

                    return res.json({
                        success: true,
                        message: 'Enjoy your token!',
                        token: token
                    });
                }		
    
            }
    
        });
    });

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function(req, res, next) {
    
        // check header or url parameters or post parameters for token
        var token = req.body.token || req.param('token') || req.headers['x-access-token'] || req.cookies.auth;
    
        // decode token
        if (token) {
    
            // verifies secret and checks exp
            jwt.verify(token, app.get('superSecret'), function(err, decoded) {			
                if (err) {
                    return res.json({ success: false, message: 'Failed to authenticate token.' });		
                } else {
                    // if everything is good, save to request for use in other routes
                    req.decoded = decoded;	
                    next();
                }
            });
    
        } else {
    
            // if there is no token
            // return an error
            return res.status(403).send({ 
                success: false, 
                message: 'No token provided.'
            });
            
        }
        
    });


    
    apiRoutes.post('/users', function (req, res) {
    
        var newUser = {
            name: req.body.name,
            age: req.body.age,
            email: req.body.email,
            password: req.body.password1,
        }
    
        
        db.users.insert(newUser, function () {
               
            db.users.find(function (err, docs) {
                if (err) {
                    console.error(err);
                }
                console.log(newUser);
                /* passing data object to render in index */
                res.render('index', {
                    title: 'Customer DB list:',
                    users: docs
                });
            });
    
        })
    
    
    });
    
    apiRoutes.get('/users', function (req, res) {
    
        db.users.find(function (err, docs) {
            if (err) {
                console.error(err);
            }
            /* passing data object to render in index */
            res.json(docs)
        });
    
    
    });
    
    apiRoutes.get('/users/:id', function (req, res) {
    
        user_id = req.params.id;
        console.log(user_id);
    
        db.users.find({
            _id: {
                $in: [ObjectId(user_id)]
            }
        }, function (err, docs) {
            if (err) {
                console.error(err);
            }
            /* passing data object to render in index */
            res.json(docs)
        });
    
    
    });
    
    apiRoutes.delete('/users/:id', function (req, res) {
    
        user_id = req.params.id;
    
        db.users.remove({
            _id: {
                $in: [ObjectId(user_id)]
            }
        }, function (err, docs) {
            if (err) {
                console.error(err);
            }else{
                responsejson = [{"code":"200 OK"}]
            }
            /* passing data object to render in index */
           
            res.json(responsejson)
        });
    
    
    });
    
    apiRoutes.put('/users/:id', function (req, res) {
    
        user_id = req.params.id;
    
        var newUser = {
            name: req.body.name,
            age: req.body.age,
            email: req.body.email,
            admin: req.body.admin,
        }
    
        db.users.insert(newUser, function () {
    
            db.clients.remove({_id: ObjectId(user_id)})
            res.json(newUser)
        })
    
    
    });

app.use('/api', apiRoutes);

app.listen(8080, function () {
    console.log('Server Started on Port 8080...');
});