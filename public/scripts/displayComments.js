const displayComments = function(){
  let commentSection = document.getElementById('comments');
  commentSection.innerHTML = comments;
  console.log(comments);
};

window.onload = displayComments;
