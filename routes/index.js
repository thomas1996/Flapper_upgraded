var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var passport = require('passport');

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

var User = mongoose.model('User');
var jwt = require('express-jwt');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Express' });
});

// GET all posts
router.get('/posts',function(req,res,next){
    Post.find(function(err,posts){
        if(err){return next(err);}
        res.json(posts);
    });
});

router.get('/posts/:post',function(req,res,next){
    req.post.populate('comments',function(err,post){
        if(err){return next(err);}

        res.json(post);
    });
});
//create new post
router.post('/posts',auth,function(req,res,next){
    var post = new Post(req.body);
    post.author = req.payload.username;
    post.save(function(err,post){
        if(err){return next(err);}

        res.json(post);
    });
});

//map to route parameter 'post'
router.param('post',function(req,res,next,id){
    var query = Post.findById(id);
    query.exec(function(err,post){
        if(err){return next(err);}
        if(!post){return next(new Error('can\'t find post'));}

        req.post = post;

        return next();
    });
});
//get one single post
router.get('/posts/:post',function(req,res,next){
    req.post.populate('comments', function(err, post) {
        if (err) { return next(err); }

        return res.json(post);
    });
});
//delete post
router.delete('/posts/:post',function(req,res){
    req.post.comments.forEach(function(id){
        Comment.remove({
            _id:id
        },function(err){
            if(err)
            {return next(err);}
        });
    })
    Post.remove({
        _id:req.params.post
    },function(err,post){
        if(err)
        {return next(err);}

        //get and return all the remaining posts
        Post.find(function(err,posts){
            if(err){return next(err);}

            res.json(posts);
        });
    });
});
//upvote post
router.put('/posts/:post/upvote',auth,function(req,res,next){
    req.post.upvote(function(err,post){
        if(err){return next(err);}
        res.json(post);
    });
});
//downvote post
router.put('/posts/:post/downvote',function(req,res,next){
    req.post.downvote(function(err,post){
        if(err){return next(err);}
        res.json(post);

    });
});

//post comments
router.post('/posts/:post/comments',auth,function(req,res,next){
    var comment = new Comment(req.body);
    comment.post = req.post;
    comment.author = req.payload.username;

    comment.save(function(err,comment){
        if(err){return next(err);}

        req.post.comments.push(comment);
        req.post.save(function(err,post){
            if(err){return next(err);}

            res.json(comment);
        });
    });
});

router.put('/posts/:post/comments/:comment/downvote',function(req,res,next){
  console.log("4");
    req.comment.downvote(function(err,comment){
      console.log("5");
        if(err){return next(err);}
        console.log("6")

        res.json(comment);
    });
});
//upvote comment
router.put('/posts/:post/comments/:comment/upvote', function(req, res, next) {
    req.comment.upvote(function(err, comment){
        if (err) {
            return next(err); }

        res.json(comment);
    });
});


/*
router.deleteComment('/posts/:post/comments/:comment',function(req,res,next){
    req.comments.delete(function(id){
        Comment.remove({
            _id:id
        },function(err){
            if(err)
            {return next(err);}
        });
    });
        //get and return all the remaining posts
    Comment.find(function(err,posts){
        if(err){return next(err);}

        res.json(posts);
    });
});
*/
//map to route parameter 'commment'
router.param('comment',function(req,res,next,id){
    var query = Comment.findById(id);

    query.exec(function(err,comment){
        if(err){
            return next(err);
        }
        if(!comment)
        {
            return next(new Error('can\'t find comment'));
        }
        req.comment = comment;
        return next();
    });
});

//get user
/*
router.getUser('/users/:user',function(req,res){
    User.find(function(err,user){
        if(res.json(User)!=null){
            return res.json(user);
        }else {
            return null;
        }


    });
});
*/

//Register

router.post('/register',function(req,res,next){
    if(!req.body.username || !req.body.password){
        return res.statur(400).json({message: 'please fill out all fields'});
    }
    var user = new User();
  //  if(this.getUser===null)
    //{
        user.username = req.body.username;
        user.setPassword(req.body.password);

        user.save(function(err){
            if(err) {
                return res.status(400).json({message: 'Username already exist'});
            }


            return res.json({token: user.generateJWT()});
        });
    //}
    //else {
      //  return res.statur(400).json({message: 'Username already exist'});
  //  }
});

//log in
router.post('/login',function(req,res,next){
    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: 'pleas fill out all the fields'});
    }
    passport.authenticate('local',function(err,user,info){
        if(err){return next(err);}

        if(user){
            return res.json({token: user.generateJWT()});
        }else{
            return res.status(400).json(info);
        }
    })(req,res,next);
});

module.exports = router;
