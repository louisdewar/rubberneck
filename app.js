Stories = new Mongo.Collection('stories');

if (Meteor.isClient) {
    Meteor.subscribe('stories');
    Template.stories.helpers({
        stories: Stories.find()
    });
}

if (Meteor.isServer) {
    Meteor.publish('stories', function () {
        return Stories.find();
    });


    Meteor.methods({
        upload: function (location, url, date, tags) {
            check(location, String);
            check(url, String);
            check(date, String);
            check(tags, Match.Optional([String]));

            if (Stories.findOne({url: url})) throw new Meteor.Error('URL matches another one in the database. Is it a duplicate?');
            Stories.insert({location: location, url: url, date: date, tags: tags});
        }
    });
    Meteor.startup(function() {
        Meteor.call('upload', 'Calais', 'img-1.jpg', '27/07/15', ['eurotunnel', 'tunnelcrossing'], function(error) {});
        Meteor.call('upload', 'Paris', 'img-2.jpg', '27/07/15', ['tourdefrance', 'cycling', 'skyteam', 'win'], function(error) {});
        Meteor.call('upload', 'Istanbul', 'img-3.jpg', '27/07/15', ['coffin', 'death'], function(error) {});
    });
}
