/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

require('dotenv').config();

var path = require('path');
var express = require('express');
var session = require('express-session');
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');

const yargs = require('yargs');

const options = yargs
    .usage('Usage: --instanceMode <singe | multi> --cacheMode <session | distributed> --cacheSize <1000> --metadataCaching <metadata_caching> --scenarioName <some-test>--outputPath <output_path>')
    .option('instanceMode', { alias: 'im', describe: 'instance mode', type: 'string', demandOption: true })
    .option('cacheMode', { alias: 'cm', describe: 'cache mode', type: 'string', demandOption: false })
    .option('cacheSize', { alias: 'cs', describe: 'cache size', type: 'number', demandOption: false })
    .option('metadataCaching', { alias: 'mc', describe: 'whether to cache metadata', type: 'boolean', demandOption: true })
    .option('scenarioName', { alias: 'sn', describe: 'describe current scenario', type: 'string', demandOption: true })
    .option('outputPath', { alias: 'out', describe: 'path to benchmark output', type: 'string', demandOption: true })
    .argv;

// initialize express
const app = express();

/**
 * Using express-session middleware for persistent user session. Be sure to
 * familiarize yourself with available options. Visit: https://www.npmjs.com/package/express-session
 */
app.use(session({
    secret: process.env.AAD_CLIENT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true on production
    }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

if (options.cacheMode === 'distributed') {
    const cacheClientWrapper = require('./utils/cacheClientWrapper')(cacheClient);
    const partitionManager = require('./utils/partitionManager');

    function initializePartitionManager(req, _, next) {
        req.partitionManager = partitionManager(cacheClientWrapper, req.session.id);
        next();
    }

    app.use(initializePartitionManager);
}

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter({
    instanceMode: options.instanceMode,
    cacheMode: options.cacheMode,
    cacheSize: options.cacheSize,
    metadataCaching: options.metadataCaching,
    outputPath: options.outputPath,
    scenarioName: options.scenarioName
}));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;