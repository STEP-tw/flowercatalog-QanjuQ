let fs = require('fs');
const timeStamp = require('./time.js').timeStamp;
const http = require('http');
const WebApp = require('./webapp');
let registered_users = [{userName:'bhanutv',name:'Bhanu Teja Verma'},{userName:'harshab',name:'Harsha Vardhana'}];
const toS = o=>JSON.stringify(o,null,2);

const logRequest = (req,res)=>{
  let text = ['------------------------------',
    `${timeStamp()}`,
    `${req.method} ${req.url}`,
    `HEADERS=> ${toS(req.headers)}`,
    `COOKIES=> ${toS(req.cookies)}`,
    `BODY=> ${toS(req.body)}`,''].join('\n');
  fs.appendFile('request.log',text,()=>{});

  console.log(`${req.method} ${req.url}`);
}

const loadUser = (req,res)=>{
  let sessionid = req.cookies.sessionid;
  let user = registered_users.find(u=>u.sessionid==sessionid);
  if(sessionid && user){
    req.user = user;
  }
};

const redirectLoggedInUserToHome = (req,res)=>{
  if(req.urlIsOneOf(['/','/login']) && req.user) res.redirect('/home');
}

const redirectLoggedOutUserToLogin = (req,res)=>{
  if(req.urlIsOneOf(['/','/home','/logout']) && !req.user) res.redirect('/login');
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
  'ico':'image/x-icon'
};

const filepaths = {
  'html':'',
  'ico':'/images',
  'css':'/styles',
  'js':'/scripts',
  'jpg':'/images',
  'png':'/images',
  'svg':'/images'
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
  console.log(req.filepath);
  fs.readFile(req.filepath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end("file not found");
      return;
    }
    res.statusCode = 200;
    res.setHeader('ContentType',req.contentType);
    res.write(data.toString());
    res.end();
  });
}


let app = WebApp.create();
app.use(logRequest,'_preprocess');
app.use(loadUser,'_preprocess');
app.use(redirectLoggedInUserToHome,'_preprocess');
app.use(redirectLoggedOutUserToLogin,'_preprocess');

app.use(getFilePath,'_postprocess');
app.use(getContentType,'_postprocess');
app.use(respondWithFile,'_postprocess');


app.get('/login',(req,res)=>{
  res.setHeader('Content-type','text/html');
  if(req.cookies.logInFailed) res.write('<p>logIn Failed</p>');
  res.write('<form method="POST"> <input name="userName"><input name="place"> <input type="submit"></form>');
  res.end();
});
app.post('/login',(req,res)=>{
  let user = registered_users.find(u=>u.userName==req.body.userName);
  if(!user) {
    res.setHeader('Set-Cookie',`logInFailed=true`);
    res.redirect('/login');
    return;
  }
  let sessionid = new Date().getTime();
  res.setHeader('Set-Cookie',`sessionid=${sessionid}`);
  user.sessionid = sessionid;
  res.redirect('/home');
});
app.get('/home',(req,res)=>{
  res.setHeader('Content-type','text/html');
  res.write(`<p>Hello ${req.user.name}</p>`);
  res.end();
});
app.get('/logout',(req,res)=>{
  res.setHeader('Set-Cookie',[`loginFailed=false,Expires=${new Date(1).toUTCString()}`,`sessionid=0,Expires=${new Date(1).toUTCString()}`]);
  delete req.user.sessionid;
  res.redirect('/login');
});

const PORT = 5000;
let server = http.createServer(app);
server.on('error',e=>console.error('**error**',e.message));
server.listen(PORT,(e)=>console.log(`server listening at ${PORT}`));
