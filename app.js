Stories = new Mongo.Collection('stories');

if(Meteor.isClient) {
    Meteor.subscribe('stories');

    Template.stories.helpers({
        stories: function() {
            var tags = Session.get('tags');

            if(typeof(tags) === undefined || tags === [] || !Match.test(tags, [String])) return Stories.find();
            var regex = [];

            tags.forEach(function(tag) {
                regex.push(new RegExp(tag, 'i'));
            });

            return Stories.find({$or: [{tags: {$in: regex}}, {location: {$in: regex}}]});
        }
    });

    Template.story.events({
        'click .like': function(e) {
            e.preventDefault();

            var likes = Session.get('likes');

            if(likes === undefined) likes = {};

            if(!Match.test(likes[this._id], Boolean)) likes[this._id] = true;
            else likes[this._id] = !likes[this._id];

            Session.setPersistent('likes', likes);
            Meteor.call('like', this._id, likes[this._id]);
        },

        'click .flag': function(e) {
            e.preventDefault();

            var flags = Session.get('flags');

            if(flags === undefined) flags = {};

            if(!Match.test(flags[this._id], Boolean)) flags[this._id] = true;
            else flags[this._id] = !flags[this._id];

            Session.setPersistent('flags', flags);
            Meteor.call('flag', this._id, flags[this._id]);
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
        },

        flagged: function() {
            var flags = Session.get('flags');

            if(flags === undefined || !Match.test(flags[this._id], Boolean)) return false;
            return flags[this._id];
        }
    });

    Template.story.created = function() {
        var story = this.data;

        var update = function() {
            var time;
            var seconds = Math.floor((new Date() - story.date) / (1000));
            if(seconds < 60) {
                return 'Just now';
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

            return time + ' ago';
        }

        Session.set(story._id, update());

        Meteor.setInterval((function() {
            Session.set(story._id, update());
        }), 1000);
    };

    Template.search.helpers({
        search: Session.get('tags').join(' ')
    });

    Template.search.events({
        'keyup input': function(e) {
            var tags = e.target.value.split(' ');
            Session.setPersistent('tags', tags);
        }
    });

    Meteor.startup(function() {
        $(window).scroll(function() {
            if($(window).scrollTop() > 0) $('header').addClass('scroll');
            else $('header').removeClass('scroll');
        });
    });
}

if(Meteor.isServer) {
    Meteor.publish('stories', function () {
        return Stories.find({visable: {$ne: false}}, {fields: {flags: 0, visable: 0}});
    });

    Meteor.methods({
        upload: function (location, url, tags) {
            check(location, {longitude: Number, latitude: Number, country: String, city: String});
            check(url, String);
            check(tags, Match.Optional([String]));
            var date = new Date();

            if (Stories.findOne({url: url})) throw new Meteor.Error('URL matches another one in the database. Is it a duplicate?');
            Stories.insert({location: location, url: url, tags: tags, date: date, likes: 0, flags: 0});

        },

        like: function (id, liked) {
            var inc = 1;
            if(!liked) inc = -1;
            Stories.update(id, {$inc: {
                likes: inc
            }});
        },

        flag: function(id, flagged) {
            var inc = 1;
            if(!flagged) inc = -1;
            Stories.update(id, {$inc: {
                flags: inc
            }});

            var doc = Stories.findOne(id);
            if(doc.flags >= 5 && doc.flags > doc.likes) {
                Stories.update(id, {$set: {
                    visable: false
                }});
            }
        }
    });

    Meteor.startup(function() {
        Meteor.call('upload', 'Calais', 'img-1.jpg', ['eurotunnel', 'tunnelcrossing'], function(error) {});
        Meteor.call('upload', 'Paris', 'img-2.jpg', ['tourdefrance', 'cycling', 'skyteam', 'win'], function(error) {});
        Meteor.call('upload', 'Istanbul', 'img-3.jpg', ['coffin', 'death'], function(error) {});

        var geo = new GeoCoder({geocoderProvider: "google"});
        var result = geo.reverse(51.4879067, -0.1234005);
        console.log(result);
    });
}
