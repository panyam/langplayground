import createError from "http-errors";
import express = require("express");
import path = require("path");
import cookieParser = require("cookie-parser");
import bodyParser = require("body-parser");
import logger = require("morgan");
const session = require("express-session");
// const helmet = require("helmet");
const { Datastore } = require("@google-cloud/datastore");
const { DatastoreStore } = require("@google-cloud/connect-datastore");
const exphbs = require("express-handlebars");

function setupInheritance(engine: any): void {
  engine.loadPartial = function (name: string) {
    let partial = engine.partials[name];
    if (typeof partial === "string") {
      partial = engine.compile(partial);
      engine.partials[name] = partial;
    }
    return partial;
  };
  engine.registerHelper("block", (name: string, options: any): string => {
    /* Look for partial by name. */
    const partial = engine.loadPartial(name) || options.fn;
    return partial(engine, { data: options.hash });
  });
  engine.registerHelper("partial", function (name: string, options: any): void {
    engine.registerPartial(name, options.fn);
  });
}

// Create a new express app instance
const app: express.Application = express();

const copsHeader = [
  ["font-src", ["'self'", "https://fonts.gstatic.com/"]],
  ["img-src", ["'self'", "https://www.fillmurray.com", "data:"]],
  [
    "script-src",
    [
      "'self'",
      "https://unpkg.com/ace-builds@1.4.12/src-noconflict/",
      "https://unpkg.com/ace-builds@1.4.12/src-noconflict/",
    ],
  ],
  [
    "script-src-elem",
    [
      "'self'",
      "https://unpkg.com/ace-builds@1.4.12/src-noconflict/",
      "https://unpkg.com/ace-builds@1.4.12/src-noconflict/",
    ],
  ],
  [
    "style-src",
    [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com/icon",
      "https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css",
    ],
  ],
  ["frame-src", ["'self'"]],
]
  .map((entry) => [entry[0] + " " + (entry[1] as string[]).map((v) => `${v}`).join(" ")])
  .join(" ; ");

app.use(function (req, res, next) {
  res.setHeader("Content-Security-Policy", copsHeader);
  next();
});

app.use("/static", express.static(path.join(__dirname, "static")));
app.use("/blog", express.static(path.join(__dirname, "sites/blog")));

/// Enable static sites for dev (and hence CORS)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// Setup view/templating engine
app.set("views", [path.join(__dirname, "src/views"), path.join(__dirname, "static/dist")]);
app.set("view engine", "html");
const hbs = exphbs.create({
  defaultLayout: "main",
  extname: "html",
  allowProtoMethodsByDefault: true,
  allowProtoPropertiesByDefault: true,
  layoutsDir: __dirname + "/src/views/layouts",
});
setupInheritance(hbs.handlebars);
app.engine("html", hbs.engine);

app.use(logger("dev"));
// app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session Setup - Needed for most things session
// eg auth
const useMemSessions = false;
if (useMemSessions) {
  app.use(
    session({
      // It holds the secret key for session
      name: "usid",
      secret: "secret1234",
      cookie: {
        maxAge: 600000,
        sameSite: true,
      },
      resave: false,
      saveUninitialized: false,
    }),
  );
} else {
  app.use(
    session({
      store: new DatastoreStore({
        kind: "express-sessions",

        // Optional: expire the session after this many milliseconds.
        // note: datastore does not automatically delete all expired sessions
        // you may want to run separate cleanup requests to remove expired sessions
        // 0 means do not expire
        expirationMs: 0,

        dataset: new Datastore({
          /*
        // For convenience, @google-cloud/datastore automatically looks for the
        // GCLOUD_PROJECT environment variable. Or you can explicitly pass in a
        // project ID here:
        projectId: process.env.GCLOUD_PROJECT,

        // For convenience, @google-cloud/datastore automatically looks for the
        // GOOGLE_APPLICATION_CREDENTIALS environment variable. Or you can
        // explicitly pass in that path to your key file here:
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        */
        }),
      }),
      secret: "my-secret-12345",
    }),
  );
}

// Initialize passport before any routes
const passport = require("passport");
app.use(passport.initialize({ userProperty: "currChannel" }));
app.use(passport.session());

// And setup routes and error handlers

import * as TSG from "@panyam/tsutils-gae";
const indexRouter = require("./src/server/routes/index");

const ENV = app.get("env");

app.use("/", indexRouter);
// app.use("/auth", TSG.Auth.authRouter((Config as any)[ENV]));

// Iniitalise auth flows
// TODO - finalise a naming convention for these
TSG.Auth.initAuth2App(app);

// catch 404 and forward to error handler
app.use((req: any, res: any, next: any) => {
  next(createError(404));
});

// error handler
app.use((err: any, req: any, res: any, next: any) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = ENV === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error/index.html");
});

module.exports = app;
