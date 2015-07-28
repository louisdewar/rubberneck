Stories = new Mongo.Collection('stories');

if(Meteor.isClient) {
    Meteor.subscribe('stories');
    Template.stories.helpers({
        stories: Stories.find()
    });
    
    Template.story.helpers({
        time: function() {
            return Math.floor((new Date() - this.date) / (1000 * 60));
        }
    });
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
        like: function (url) {
            Stories.update({url: url}, {$inc: {
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
