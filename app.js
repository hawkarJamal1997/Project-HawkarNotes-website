const express = require('express')
const expressHandlebars = require('express-handlebars')
const expressSession = require('express-session')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt');
const appDB = require('./db.js');
const { callbackify } = require('util');


const app = express()

app.use(expressSession({
	secret: 'uijknm',
    resave: false,
    saveUninitialized: true
}))

app.use(bodyParser.urlencoded({extended:false}))


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

app.get('/blogpost', function(req, res){
    const errors = []
    const isLoggedIn = req.session.isLoggedIn

    appDB.retrieveAllBlogposts(function(error, Blogpost){
        if(error) {
            errors.push("Database error! Try again late.")
        }
        const model = {
            Blogpost: Blogpost,
            isLoggedIn: isLoggedIn,
            errors: errors
        }
        res.render("blogpost.hbs", model)
    })
})

app.get('/guestbook', function(req, res){
    const errors = []
    const isLoggedIn = req.session.isLoggedIn

    appDB.retrieveAllGuestbooks(function(error, Guestbook){
        if(error) {
            errors.push("Database error! Try again late.")
        }
        const model = {
            Guestbook: Guestbook,
            isLoggedIn: isLoggedIn,
            error: errors
        }
        res.render("guestbook.hbs", model)
    })
})

app.get('/faq', function(req, res){
    const errors = []
    const isLoggedIn = req.session.isLoggedIn

    appDB.retrieveAllFaqs(function(error, Faq){
        if(error) {
            errors.push("Database error! Try again late.")
        }
        const model = {
            Faq: Faq,
            isLoggedIn: isLoggedIn,
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
app.get('/createBlogposts', function(req, res){
    res.render("createBlogposts.hbs")
})

app.post('/createBlogposts', function(req, res){
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
app.get('/update-blogpost/:id', function(req, res){
    const id = req.params.id
    const isLoggedIn = req.session.isLoggedIn
    
    if(!isLoggedIn) {
        res.redirect("/login")
        return;
    }
    res.render("update-blogpost.hbs", {id: id})
})

app.post('/update-blogpost/:id', function(req, res){
    const id = req.params.id
    const postText = req.body.postText
    const errors = []
   
    appDB.updateBlogpostByID(id, postText, function(error){
        if(error){
            errors.push("Error! could not edit post.")
            res.render("blogpost.hbs", {error: errors})
        }
    })
    res.redirect('/blogpost')
})

//------DELETE FOR BLOGPOSTS------//
app.post('/delete-blogpost/:id', function(req, res){
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
app.get('/createGuestbooks', function(req, res){
    res.render("createGuestbooks.hbs")
})

app.post('/createGuestbooks', function(req, res){
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
        res.redirect("/guestbook")
    }    
})

//------UPDATE FOR GUESTBOOK------//
app.get('/update-guestbook/:id', function(req, res){
    const id = req.params.id
    const isLoggedIn = req.session.isLoggedIn
    
    if(!isLoggedIn) {
        res.redirect("/login")
        return;
    }
    res.render("update-guestbook.hbs", {id: id})
})

app.post('/update-guestbook/:id', function(req, res){
    const id = req.params.id
    const postText = req.body.postText
    const errors = []

    appDB.updateGuestbookByID(id, postText, function(error){
        if(error){
            errors.push("Error! could not edit post.")
            res.render("guestbook.hbs", {error: errors})
        }
    })
    res.redirect('/guestbook')
})

//------DELETE FOR GUESTBOOK------//
app.post('/delete-guestbook/:id', function(req, res){
    const id = req.params.id
    const errors = []

    appDB.deleteGuestbookByID(id, function(error){
        if(error){
            errors.push("Error! could not delete post.")
            res.render("guestbook.hbs", {error: errors})
        }
    })
    res.redirect("/guestbook")
})


//--------------CREATE FAQ--------------//
app.get('/createFaqs', function(req, res){
    res.render("createFaqs.hbs")
})

app.post('/createFaqs', function(req, res){ 
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
app.get('/update-faq/:id', function(req, res){
    const id = req.params.id
    const isLoggedIn = req.session.isLoggedIn
    
    if(!isLoggedIn) {
        res.redirect("/login")
        return;
    }
    res.render("update-faq.hbs", {id: id})
})

app.post('/update-faq/:id', function(req, res){
    const id = req.params.id
    const postText = req.body.postText
    const errors = []

    appDB.updateFaqByID(id, postText, function(error){
        if(error){
            errors.push("Error! could not edit post.")
            res.render("faq.hbs", {error: errors})
        }
    })
    res.redirect('/faq')
})

//------DELETE FOR Faq------//
app.post('/delete-faq/:id', function(req, res){
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

app.get('/login', function(req, res){
    const isLoggedIn = req.session.isLoggedIn
    res.render("login.hbs", {isLoggedIn: isLoggedIn})
})

app.post('/login', function(req, res){
    const username = req.body.username
    const password = req.body.password
    const hashedPassword = "$2b$10$OsiaY76faZu8o8s1QuEoVOL3ZZg5OUjGFpJuknybVLaJocgAYnwv."
    const errors = []

   // bcrypt.hash(passwordToHash, 10, function(err, hash) {
        //console.log(hash)
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

