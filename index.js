const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const fileUpload = require("express-fileupload");
const adminRouter = require("./route/admin");
const homeRouter = require("./route/home");
const authRouter = require("./route/auth");
const signUpRouter = require("./route/signup");
const clientApiRouter = require("./route/client-api");
const session = require("express-session");
const flash = require("express-flash");
const MediaService = require("./service/media-service");
const faqList = require("./faq.json");

app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view-engine", "ejs");
app.use(
    session({
        secret: "process.env.SESSION_SECRET",
        resave: true,
        saveUninitialized: true,
        cookie: {
            // secure: true,
            maxAge: 86400000,
        },
    })
);
app.use(flash());
app.use(express.static(__dirname + "/static"));
app.use("/admin", checkAuthenticated, adminRouter);
app.use("/api", clientApiRouter);
app.use("/login", authRouter);
app.use("/signup", signUpRouter);

app.post("/logout", (req, res) => {
    req.session.isAuthenticated = null;
    res.redirect("/login");
});

app.get("/echo", (req, res) => {
    res.send(req.body.tostring());
});

app.get("/404", function (req, res) {
    res.status(404).render("404.ejs");
});

app.get("/500", function (req, res) {
    res.status(500).render("500.ejs");
});


app.get("/:accountId/about", async (req, res) => {
    const aboutUs = await MediaService.getAlboutInfo(req.params.accountId);
    const members = await MediaService.getTeamMembers(req.params.accountId);

    console.log(members);
    res.render("about.ejs", {
        accountId: req.params.accountId,
        aboutUs,
        members,
    });
});

app.get("/:accountId/faq", async (req, res) => {
    res.render("faq.ejs", { faqList, accountId: req.params.accountId });
});

app.get("/:accountId/our-crew", async (req, res) => {
    const teamMembers = await MediaService.getAllTeamMembers();
    res.render("crew.ejs", { teamMembers, accountId: req.params.accountId });
});

app.get("/:accountId/cinema", async (req, res) => {
    const allVideos = await MediaService.getAllVideos();
    res.render("cinema.ejs", { allVideos, accountId: req.params.accountId });
});

app.get("/:accountId/contact", async (req, res) => {
    const teamInfo = await MediaService.getTeamInfo(req.params.accountId);
    const contactDetails = await MediaService.getContactDetails(
        req.params.accountId
    );
    console.log(teamInfo);
    res.render("contact.ejs", {
        teamInfo,
        accountId: req.params.accountId,
        contactDetails,
    });
});

app.get("/:accountId/gallery", async (req, res) => {
    const allImages = await MediaService.getAllImages(true);
    // const recentVideos = await MediaService.getRecentVideos();
    res.render("gallery.ejs", { allImages, accountId: req.params.accountId });
});

app.get("/:accountId/single-blog", (req, res) => {
    res.render("single-blog.ejs", { accountId: req.params.accountId });
});

app.post("/:accountId/client_details", (req, res) => {
    MediaService.addClientQuery(req.params.accountId, req.body);

    res.redirect(`/${req.params.accountId}/contact`);
});

app.get("/:accountId", async (req, res) => {
    const homePageInfo = await MediaService.getHomePageInfo(
        req.params.accountId
    );
    if (!homePageInfo) {
        return res.redirect("404");
    }
    const recentImages = await MediaService.getRecentImages(
        req.params.accountId
    );
    const recentVideos = await MediaService.getRecentVideos(
        req.params.accountId
    );
    const services = await MediaService.getServices(req.params.accountId);

    console.log(homePageInfo);

    res.render("index.ejs", {
        recentImages,
        recentVideos,
        accountId: req.params.accountId,
        homePageInfo,
        services,
    });
});

app.get("/:accountId/*", function (req, res) {
    res.redirect("/404");
});

app.get("/", function (req, res) {
    res.sendFile(__dirname+"/index.html");
});

app.get("*", function (req, res) {
    res.redirect("404");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("500.ejs");
});

function checkAuthenticated(req, res, next) {
    console.log("authntication check " + req.session.isAuthenticated);
    if (req.session.isAuthenticated) {
        return next();
    } else res.redirect("/login");
}



const serverless = require("serverless-http");
// app.listen(port, () => {
//     console.log("Listening to port: " + port);
// });

if (process.env.ENVIRONMENT === "production") {
    exports.handler = serverless(app);
} else {
    app.listen(port, () => {
        console.log(`Server is listening on port ${port}.`);
    });
}

// exports.handler = serverless(app);
