var express = require('express');
var session = require('express-session');
var app = express();
var fs = require('fs');
var bodyparser = require('body-parser');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}))
app.use(express.static(__dirname+"/public"))
app.set("view engine","pug");
app.set("views","./views")
const path = require('path');

var multer = require('multer');
var st = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, '' + file.originalname.replace(' ', ''));
    },
});
const blob = multer({ storage: st });
var cookieParser=require('cookie-parser');
const { request } = require('http');
app.use('/uploads', express.static('uploads'));
//app.use(express.static(__dirname+"/uploads"))
app.use(cookieParser());
app.use(express.json());
app.use(session({secret: "Your secret key"}));
var rawdata = fs.readFileSync('db.json');
var usersdata = JSON.parse(rawdata);
var data = usersdata.users;
var fooddata = usersdata.foods;
app.get("/register",(req,res)=>{
    res.sendFile(__dirname+"/public/register.html")
})
app.post("/reguser",(req,res)=>{
    var nuser={};
    nuser.username=req.body.username;
    nuser.password=req.body.password;
    nuser.placedorders=[];
    nuser.receivedorders=[];
    console.log(nuser);
    var ru = fs.readFileSync("db.json");
    var utemp = JSON.parse(ru);
    utemp.users.push(nuser);
    fs.writeFileSync("db.json",JSON.stringify(utemp),'utf-8');
    res.redirect("/login.html");
})
app.post("/loginto",(req,res)=>{
    var f=0; 
    data.forEach((item,i)=>{
        if(req.body.username==item.username && req.body.password==item.password){
            f=1;
            //res.cookie("username",req.query.username);
            //res.cookie("password",req.query.password);
            req.session.username=req.body.username;
            req.session.password=req.body.password;
            res.redirect("/home")
        }
    })
})
app.use((req,res,next)=>{
    if(req.session.username){
        next();
    }
    else{
        res.redirect("/login.html");
    }
})
app.get("/home",(req,res)=>{
    var locations=[];
    fooddata.forEach(food=>{
        locations.push(food.location);
    })
    locations = [...new Set(locations)];
    res.render("homepage",{data:fooddata,locations:locations})
})
app.post("/home",(req,res)=>{
    var locations1=[];
    fooddata.forEach(food=>{
        locations1.push(food.location);
    })
    locations1 = [...new Set(locations1)];
    var sloc = req.body.locations;
    var foodatsloc=[];
    if(sloc == 'select'){
        res.redirect("/home")
    }
    else{
        fooddata.forEach(food=>{
            if(food.location==sloc){
                foodatsloc.push(food)
            }
        })
        res.render("homepage",{data:foodatsloc,locations:locations1})
    }
})
app.get("/addfood",(req,res)=>{
    res.sendFile(__dirname+"/addfood.html")
})
app.post("/addfood",blob.single('foodpic'),(req,res)=>{
    var obj={}
    var sobj={}
    sobj.chefname=req.session.username;
    sobj.dish=req.body.foodname;
    obj.name=req.body.foodname;
    obj.serves=req.body.serves;
    obj.price=req.body.price;
    obj.remarks=req.body.remarks;
    obj.location=req.body.location;
    obj.delivery=req.body.delivery;
    obj.image='/uploads/'+ req.file.originalname.replace(' ','')
    console.log(obj);
    var rd = fs.readFileSync("db.json");
    var temp = JSON.parse(rd);
    temp.foods.push(obj);
    temp.supply.push(sobj);
    fs.writeFileSync("db.json",JSON.stringify(temp),'utf-8');
    res.redirect("/home");
})
app.get("/details/:id",(req,res)=>{
    fooddata.forEach((food,i)=>{
        if(req.params.id==i)
        {
            res.render("details.pug",{data:fooddata,id:i})
        }
    })
})
app.get("/placeorder/:id",(req,res)=>{
    var obj={};
    obj.buyername=req.session.username;
    obj.itemname=req.params.id;
    var rd = fs.readFileSync("db.json");
    var temp = JSON.parse(rd);
    temp.order.push(obj);
    fs.writeFileSync("db.json",JSON.stringify(temp),'utf-8');
    res.redirect("/home");
})
app.get("/placedorders",(req,res)=>{
    var rd = fs.readFileSync("db.json");
    var temp = JSON.parse(rd);
    var orders = temp.order
    var myitems = [];
    var foods=[];
    orders.forEach((a,i)=>{
        if(req.session.username == a.buyername){
            myitems.push(a)
            fooddata.forEach(food=>{
                if(a.itemname==food.name){
                    foods.push(food);
                }
            })
        }
    })
    res.render("placedorders",{myproducts:myitems,name:req.session.username,data:foods})
})
app.get("/receivedorders",(req,res)=>{
    var rd = fs.readFileSync("db.json");
    var temp = JSON.parse(rd);
    var supplier = temp.supply;
    var orders = temp.order;
    var mydata=[];
    var foods = [];
    supplier.forEach((s,i)=>{
        if(req.session.username == s.chefname){
            mydata.push(s);
        }
    })
    orders.forEach((o,oi)=>{
        mydata.forEach((m,mi)=>{
            if(m.dish == o.itemname){
                fooddata.forEach(food=>{
                    if(o.itemname==food.name){
                        foods.push(food);
                    }
                })
            }
        })
    })
    res.render("receivedorders",{mydata:mydata,name:req.session.username,data:foods})
})
app.get("/logout",(req,res)=>{
    res.clearCookie('connect.sid');
    res.redirect("/")
})
app.listen(process.env.PORT)

