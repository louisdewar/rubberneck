Stories = new Mongo.Collection('stories');

if(Meteor.isClient) {
    Meteor.subscribe('stories');
    Template.stories.helpers({
        stories: Stories.find()
    });

    Template.story.events({
        'click .like': function(event) {
            var likes = Session.get('likes');
            
            if(likes === undefined) likes = {};
            
            if(!Match.test(likes[this._id], Boolean)) likes[this._id] = true;
            else likes[this._id] = !likes[this._id];
            
            Session.setPersistent('likes', likes);
            Meteor.call('like', this._id);
        }
    });
    
    Template.story.helpers({
        time: function() {
            var time = Session.get(this._id);
            return time;
        },
        liked: function() {
            var likes = Session.get('likes');
            if(likes === undefined || !Match.test(likes[this._id], Boolean)) return false;
            
            return likes[this._id];
        }
    });

    Template.story.created = function() {
        var story = this.data;
        
        var updateTime = function() {
            var time;
            var seconds = Math.floor((new Date() - story.date) / (1000));
            
            if(seconds < 60) {
                time = seconds + ' seconds';
            } else if(seconds < 60 * 60) {
                time = Math.floor(seconds/60) + ' minutes';
            } else if(seconds < 60 * 60 * 24) {
                time = Math.floor(seconds/(60 * 60)) + ' hours';
            } else if(seconds < 60 * 60 * 24 * 7) {
                time = Math.floor(seconds/(60 * 60 * 24)) + ' days';
            } else {
                time = Math.floor(seconds/(60 * 60 * 24 * 7)) + ' weeks';
            }

            if(/^1\s/.test(time)) time = time.slice(0, -1);
            
            return time;
        }
                
        Session.set(story._id, updateTime());
        
        
        Meteor.setInterval((function() {
            Session.set(story._id, updateTime());
        }), 1000);
    };
}

if(Meteor.isServer) {
    Meteor.publish('stories', function () {
        return Stories.find();
    });

    Meteor.methods({
        upload: function (location, url, tags) {
            check(location, String);
            check(url, String);
            check(tags, Match.Optional([String]));
            var date = new Date();

            if (Stories.findOne({url: url})) throw new Meteor.Error('URL matches another one in the database. Is it a duplicate?');
            Stories.insert({location: location, url: url, tags: tags, date: date, likes: 0});

        },
        like: function (id) {
            Stories.update(id, {$inc: {
                likes: 1
            }});
        }
    });

    Meteor.startup(function() {
        Meteor.call('upload', 'Calais', 'img-1.jpg', ['eurotunnel', 'tunnelcrossing'], function(error) {console.log(error)});
        Meteor.call('upload', 'Paris', 'img-2.jpg', ['tourdefrance', 'cycling', 'skyteam', 'win'], function(error) {});
        Meteor.call('upload', 'Istanbul', 'img-3.jpg', ['coffin', 'death'], function(error) {});
    });
}
