let fs = require('fs');
const timeStamp = require('./time.js').timeStamp;
const http = require('http');
const WebApp = require('./webapp');
let registered_users = [{userName:'anju',password:"hello"}];
let loggedin_users = [{userName:'anju',password:"hello"}];
const toS = o=>JSON.stringify(o,null,2);

const logRequest = (req,res)=>{
  let text = [`${req.method} ${req.url}`,
    '<<<<==============================>>>>',
    `${timeStamp()}`,
    `${req.method} ${req.url}`,
    `HEADERS=> ${toS(req.headers)}`,
    `COOKIES=> ${toS(req.cookies)}`,
    `BODY=> ${toS(req.body)}`,'',''].join('\n');
  fs.appendFile('request.log',text,()=>{});
}

const loadUser = (req,res)=>{
  let sessionid = req.cookies.sessionid;
  let user = registered_users.find(u=>u.sessionid==sessionid);
  if(sessionid && user){
    req.user = user;
  }
};

const addComment = function(comment){
  comment.date = timeStamp();
  comments.push(comment);
  let content = toS(comments)
  fs.writeFile('./public/data/comments.json',content,(err)=>{
    if(err) throw err;
  });
}

const getFileExtension = function(url){
  return url.split('.')[1];
}

const contentTypes = {
  'html':'text/html',
  'css':'text/css',
  'js':'text/javascript',
  'jpg':'image/jpg',
  'png':'image/png',
  'svg':'image/svg',
  'ico':'image/x-icon',
  'gif':'image/gif'
};

const filepaths = {
  'html':'',
  'gif':'/images',
  'ico':'/images',
  'css':'/styles',
  'js':'/scripts',
  'jpg':'/images',
  'png':'/images',
  'svg':'/images'
};

let commentsCallBack = (err,data)=>{
  if(err){
    fs.openSync('./public/data/comments.json','w+');
  }
  comments = JSON.parse(data);
};

let toHtml = function(comment){
  let fields = Object.keys(comment);
  let parsed = "";
  fields.forEach((field)=>{
    parsed += "<td>" + comment[field] + "<td>";
  });
  parsed += "</tr>";
  return parsed;
};

let comments = fs.readFile('./public/data/comments.json',commentsCallBack);

const parseComments = function(){
  let parsedComments = "";
  comments.forEach(comment=>{
    parsedComments += toHtml(comment);
  });
  return parsedComments;
};

const isImage = function(filepath){
  let fileExtn = getFileExtension(filepath);
  return ['jpg','png','ico','svg','gif'].includes(fileExtn);
};

const getContentType = (req)=>{
  let fileExtn = getFileExtension(req.url);
  req.contentType = contentTypes[fileExtn];
}

const getFilePath = function(req){
  let fileExtn = getFileExtension(req.url);
  req.filepath = './public' + filepaths[fileExtn] + req.url;
}

const respondWithFile = function(req,res){
  let actionAfterReading = (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end("file not found");
      return;
    }
    res.statusCode = 200;
    res.setHeader('ContentType',req.contentType);
    res.write(data);
    res.end();
  };
  if(isImage(req.url)){
    fs.readFile(req.filepath,actionAfterReading);
    return;
  }
  fs.readFile(req.filepath,'utf8',actionAfterReading);
};


let app = WebApp.create();
app.use(logRequest,'_preprocess');
app.use(loadUser,'_preprocess');

app.use(getFilePath,'_postprocess');
app.use(getContentType,'_postprocess');
app.use(respondWithFile,'_postprocess');


app.get('/login',(req,res)=>{
  res.setHeader('Content-type','text/html');
  if(!req.cookies.loggedin) res.write('<p>logIn Failed</p>');
  res.write(`<form method="POST"/>
  <input name="userName"/>
  <input type = "password" name="password">
  <input type="submit"> <a href ="/guestBook.html"><input type = 'button' value="comment"/></a>
   </form>`);
  res.end();
});

app.post('/login',(req,res)=>{
  let sessionid = new Date().getTime();
  // if(!user){
  //   res.setHeader('Set-Cookie','loggedIn=true');
  //   res.redirect('/login');
  //   res.end();
  // }
  res.setHeader('Set-Cookie',[`loggedin=true`,`sessionid=${sessionid}`]);
  loggedin_users.push(req.body);
  let user = loggedin_users.find(u=>u.userName==req.body.userName);
  user.sessionid = sessionid;
  user.loggedIn = true;
  res.redirect('/login');
});

app.post('/guestBook.html',(req,res)=>{
  let user = loggedin_users.find(u=>u.userName==req.body.name);
  let isLoggedIn = req.cookies.loggedin;
  addComment(req.body);
  if(!user){
    res.redirect('/login');
    return;
  }
  res.redirect('/guestBook.html');
})


app.get('/logout',(req,res)=>{
  res.setHeader('Set-Cookie',[`loggedin=false,Expires=${new Date(1).toUTCString()}`,`sessionid=0,Expires=${new Date(1).toUTCString()}`]);
  delete req.user.sessionid;
  delete req.user.loggedIn;
  res.redirect('/login');
});

app.get('/comments',(req,res)=>{
  let content = parseComments();
  res.statusCode = 200;
  res.setHeader('Content-type',"text/html");
  res.write(content);
  res.end();
})

const PORT = 5000;
let server = http.createServer(app);
server.on('error',e=>console.error('**error**',e.message));
server.listen(PORT,(e)=>console.log(`server listening at ${PORT}`));
