const getComments = function(){
  const displayComments = function(){
    let comments = document.getElementById('comments');
    let table = document.createElement('table');
    table.style.border = 4;
    table.innerHTML = this.responseText;
    comments.appendChild(table);
  }
  let xml = new XMLHttpRequest();
  xml.addEventListener("load", displayComments);
  xml.open("GET", "comments");
  xml.send();
};


window.onload = getComments;
