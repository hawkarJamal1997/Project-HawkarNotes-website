const express = require('express')
const expressHandlebars = require('express-handlebars')
const expressSession = require('express-session')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
const bcrypt = require('bcrypt')
const appDB = require('./db.js')

const csrfProtection = csrf({cookie: true})

const app = express()

app.use(expressSession({
	secret: 'uijknm',
    resave: false,
    saveUninitialized: true
}))

app.use(bodyParser.urlencoded({extended:false}))
app.use(cookieParser())

app.use(express.static("public"))

app.engine("hbs", expressHandlebars({
    extname: "hbs", defaultLayout: "main"
}))

app.use(function(req, res, next){
    console.log("Recieved " + req.method + " for " + req.url)
    next()
})





app.get('/', function(req, res){
    const isLoggedIn = req.session.isLoggedIn
    res.render("index.hbs",{isLoggedIn: isLoggedIn})
})

app.get('/blogpost', csrfProtection, function(req, res){
    const errors = []
    const isLoggedIn = req.session.isLoggedIn

    appDB.retrieveAllBlogposts(function(error, Blogpost){
        if(error) {
            errors.push("Database error! Try again late.")
        }
        const model = {
            Blogpost: Blogpost,
            isLoggedIn: isLoggedIn,
            token: req.csrfToken(),
            errors: errors
        }
        res.render("blogpost.hbs", model)
    })
})

app.get('/guestbook/:page', csrfProtection, function(req, res){
    const errors = []
    const isLoggedIn = req.session.isLoggedIn
    const limit = 3
    var page = req.params.page

    const offset = (page -1) * limit
    var nextPage = Number(page) + 1;
    var previousPage = page - 1;
    if(page == 1){
        previousPage = 1;
    }

    

    appDB.retrieveAllGuestbooks(offset, function(error, Guestbook){
        if(error) {
            errors.push("Database error! Try again late.")
        }
        const model = {
            Guestbook: Guestbook,
            isLoggedIn: isLoggedIn,
            nextPage: nextPage,
            previousPage: previousPage,
            token: req.csrfToken(),
            error: errors
        }
        res.render("guestbook.hbs", model)
    })
})

app.get('/faq',csrfProtection, function(req, res){
    const errors = []
    const isLoggedIn = req.session.isLoggedIn

    appDB.retrieveAllFaqs(function(error, Faq){
        if(error) {
            errors.push("Database error! Try again late.")
        }
        const model = {
            Faq: Faq,
            isLoggedIn: isLoggedIn,
            token: req.csrfToken(),
            error: errors
        }
        res.render("faq.hbs", model)
    })
})

app.get('/about', function(req, res){
    const isLoggedIn = req.session.isLoggedIn
    res.render("about.hbs",{isLoggedIn: isLoggedIn})
})

app.get('/contact', function(req, res){
    const isLoggedIn = req.session.isLoggedIn
    res.render("contact.hbs",{isLoggedIn: isLoggedIn})
})




//--------------CREATE BLOGPOST--------------//
app.get('/createBlogposts', csrfProtection, function(req, res){
    const isLoggedIn = req.session.isLoggedIn

    if(!isLoggedIn) {
        res.redirect("/login")
        return;
    }
    res.render("createBlogposts.hbs", {token: req.csrfToken()})
})

app.post('/createBlogposts', csrfProtection, function(req, res){
    const title = req.body.title
    const postText = req.body.postText
    const errors = []
   
    if(title == "" || postText == ""){
        errors.push("Please fill out both forms!")
        res.render("createBlogposts.hbs", {error: errors})
    }else{
        appDB.createBlogPost(title, postText, function(error){
            if(error) {
                errors.push("Error! Could not create post.")
                res.render("createBlogposts.hbs", {error: errors})
            }
        })
        res.redirect("/blogpost")
    }
})

//------UPDATE FOR BLOGPOSTS------//
app.get('/update-blogpost/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const isLoggedIn = req.session.isLoggedIn
    
    const model = {
        id: id,
        token: req.csrfToken()
    }
    if(!isLoggedIn) {
        res.redirect("/login")
        return;
    }
    res.render("update-blogpost.hbs", model)
})

app.post('/update-blogpost/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const postText = req.body.postText
    const errors = []

    if(postText == ""){
        errors.push("Please write something!")
        res.render("update-blogpost.hbs", {id: id, error: errors})
    } else{
        appDB.updateBlogpostByID(id, postText, function(error){
            if(error){
                errors.push("Error! could not edit post.")
                res.render("blogpost.hbs", {error: errors})
            }
        })
        res.redirect('/blogpost')
    }
})

//------DELETE FOR BLOGPOSTS------//
app.post('/delete-blogpost/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const errors = []

    appDB.deleteBlogpostByID(id, function(error){
        if(error){
            errors.push("Error! could not delete post.")
            res.render("blogpost.hbs", {error: errors})
        }
    })
    res.redirect("/blogpost")
})


//--------------CREATE GUESTBOOK--------------//
app.get('/createGuestbooks', csrfProtection, function(req, res){
    res.render("createGuestbooks.hbs", {token: req.csrfToken()})
})

app.post('/createGuestbooks', csrfProtection, function(req, res){
    const title = req.body.title
    const postText = req.body.postText
    const errors = []
    
    if(title == "" || postText == ""){
        errors.push("Please fill out both forms!")
        res.render("createGuestbooks.hbs", {error: errors})
    }else{
        appDB.createGuestbook(title, postText, function(error){
            if(error) {
                errors.push("Error! Could not create post.")
                res.render("createGuestbooks.hbs", {error: errors})
            }
        })
        res.redirect("/guestbook/0")
    }    
})

//------UPDATE FOR GUESTBOOK------//
app.get('/update-guestbook/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const isLoggedIn = req.session.isLoggedIn
    
    const model = {
        id: id,
        token: req.csrfToken()
    }
    if(!isLoggedIn) {
        res.redirect("/login")
        return;
    }
    res.render("update-guestbook.hbs", model)
})

app.post('/update-guestbook/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const postText = req.body.postText
    const errors = []

    if(postText == ""){
        errors.push("Please write something!")
        res.render("update-guestbook.hbs", {id: id, error: errors})
    }else{
        appDB.updateGuestbookByID(id, postText, function(error){
            if(error){
                errors.push("Error! could not edit post.")
                res.render("guestbook.hbs", {error: errors})
            }
        })
        res.redirect('/guestbook')
    }
})

//------DELETE FOR GUESTBOOK------//
app.post('/delete-guestbook/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const errors = []

    appDB.deleteGuestbookByID(id, function(error){
        if(error){
            errors.push("Error! could not delete post.")
            res.render("guestbook.hbs", {error: errors})
        }
    })
    res.redirect("/guestbook/1")
})


//--------------CREATE FAQ--------------//
app.get('/createFaqs', csrfProtection, function(req, res){
    res.render("createFaqs.hbs", {token: req.csrfToken()})
})

app.post('/createFaqs', csrfProtection, function(req, res){ 
    const title = req.body.title
    const postText = req.body.postText
    const errors = []

    if(title == "" || postText == ""){
        errors.push("Please fill out both forms!")
        res.render("createFaqs.hbs", {error: errors})
    }else{
        appDB.createFaq(title, postText, function(error){
            if(error) {
                errors.push("Error! Could not create post.")
                res.render("createFaqs.hbs", {error: errors})
            }
        })
        res.redirect("/faq")
    }
})

//------UPDATE FOR FAQ------//
app.get('/update-faq/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const isLoggedIn = req.session.isLoggedIn
    
    const model = {
        id: id,
        token: req.csrfToken()
    }
    if(!isLoggedIn) {
        res.redirect("/login")
        return;
    }
    res.render("update-faq.hbs", model)
})

app.post('/update-faq/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const postText = req.body.postText
    const errors = []

    if(postText== ""){
        errors.push("Please write something!")
        res.render("update-faq.hbs", {id: id, error: errors})
    }else{
        appDB.updateFaqByID(id, postText, function(error){
            if(error){
                errors.push("Error! could not edit post.")
                res.render("faq.hbs", {error: errors})
            }
        })
        res.redirect('/faq')
    }
})

//------DELETE FOR FAQ------//
app.post('/delete-faq/:id', csrfProtection, function(req, res){
    const id = req.params.id
    const errors = []

    appDB.deleteFaqByID(id, function(error){
        if(error){
            errors.push("Error! could not delete post.")
            res.render("faq.hbs", {error: errors})
        }
    })
    res.redirect("/faq")
})

//------SEARCH FOR FAQ------//
app.get('/searchFaq', csrfProtection, function(req,res){
    const errors = []
    const searchText = req.query.searchText
    const isLoggedIn = req.session.isLoggedIn

    appDB.searchFaq(searchText, function(error, Faq){
        if(error){
            errors.push("Error!, could not find something.")
        }
        const model = {
            Faq: Faq,
            searchText: searchText,
            isLoggedIn: isLoggedIn,
            token: req.csrfToken(),
            error: errors
        }
        res.render("faq.hbs", model)
    })
})

app.get('/login', csrfProtection, function(req, res){
    const isLoggedIn = req.session.isLoggedIn
    res.render("login.hbs", {isLoggedIn: isLoggedIn, token: req.csrfToken})
})

app.post('/login', csrfProtection, function(req, res){
    const username = req.body.username
    const password = req.body.password
    const hashedPassword = "$2b$10$OsiaY76faZu8o8s1QuEoVOL3ZZg5OUjGFpJuknybVLaJocgAYnwv."
    const errors = []

    if(username == "" || password == ""){
        errors.push("Please type in username and password!")
        res.render("login.hbs", {error: errors})
    }else{
        if(username == "admin"){
            bcrypt.compare(password, hashedPassword, function(err, result) {
                if(err){
                    callback(err)
                }
                if(result){
                    
                    req.session.isLoggedIn = true
                    res.redirect("/")
                }else{
                    errors.push("This password is invalid")
                    res.render("login.hbs",{error: errors})
                }
            });
        }else{
            errors.push("This username is invalid")
            res.render("login.hbs",{error: errors})
        }
    }
})


app.post("/logout", function(req, res){
    req.session.isLoggedIn = false
    res.redirect("/")
})
 

app.listen(8080)

