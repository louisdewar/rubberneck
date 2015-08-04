Stories = new Mongo.Collection('stories');

if(Meteor.isClient) {
    Meteor.subscribe('stories');

    Template.header.helpers({
        search: function() {
            if(Session.get('tags')) return Session.get('tags').join(' ').toLowerCase();
            return '';
        },

        local: function() {
            if(Session.get('local')) return Session.get('local');
            return false;
        },

        showTitle: function() {
            if(!Session.get('showTitle')) {
                $('header').css('transform', 'translate3d(0, -' + $('.title').outerHeight() + 'px, 0)');
                return true;
            } else {
                $('header').css('transform', 'none');
                return false;
            }
        }
    });

    Template.header.events({
        'keyup input': function(e) {
            var tags = e.target.value.split(' ');
            Session.setPersistent('tags', tags);
        },

        'click .locate': function(e) {
            e.preventDefault();
            Session.set('local', Session.get('local') ? false : true);
        },

        'click .add': function(e) {
            e.preventDefault();
            Session.set('dropdown', true);
        }
    });

    Template.upload.helpers({
        dropdown: function() {
            if(Session.get('dropdown')) return Session.get('dropdown');

            $('form').one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function() {
                Session.set('image', false);
            });

            return false;
        },

        image: function() {
            if(Session.get('image')) {
                $('.image img').css('opacity', '0.5');
                return Session.get('image');
            }

            $('.image img').css('opacity', '1');
            return 'blank.png';
        }
    });

    Template.upload.events({
        'click .icon': function(e) {
            e.preventDefault();
            Session.set('dropdown', false);
        },

        'click .image': function(e) {
            e.preventDefault();
            MeteorCamera.getPicture({width: 400, height: 200}, function(err, data) {
                if(!err) Session.set('image', data);
            });
        },

        'click .button': function(e) {
            e.preventDefault();
            if(!Session.get('image')) return;
            var tags = $('#tags').val().split(' ');
            var image = Session.get('image');

            $('#tags').val('');
            Session.set('image', false);
            Session.set('dropdown', false);

            if(navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    Meteor.call('upload', position.coords.longitude, position.coords.latitude, image, tags);
                });
            }
        }
    });

    Template.stories.helpers({
        stories: function() {
            var tags = Session.get('tags');

            if(typeof(tags) === undefined || tags === [] || !Match.test(tags, [String])) return Stories.find();
            var regex = [];

            tags.forEach(function(tag) {
                regex.push(new RegExp(tag, 'i'));
            });

            return Stories.find({
                tags: {$all: regex}
            });
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
        },

        'click img': function(e) {
            e.preventDefault();

            Session.set('tags', this.tags);
        },

        'click .location-tag': function(e) {
            e.preventDefault();
            Session.set('tags', [e.target.innerText]);
        }
    });

    Template.story.helpers({
        time: function() {
            return Session.get(this._id);
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

    Meteor.startup(function() {
        Session.set('scroll', undefined);
        Session.set('showHeader', true);

        $(window).scroll(function() {
            var scrollTop = $(window).scrollTop();
            if(scrollTop > 0) $('header').addClass('scroll');
            else $('header').removeClass('scroll');
            if(Match.test(Session.get('scroll'), Number)) {
                if((scrollTop - Session.get('scroll')) > $('.title').outerHeight() * 2) {
                    Session.set('showTitle', false);
                    Session.set('scroll', scrollTop);
                } else if((Session.get('scroll') - scrollTop) > $('.title').outerHeight() / 2) {
                    Session.set('showTitle', true);
                    Session.set('scroll', scrollTop);
                }
            } else Session.set('scroll', scrollTop);
        });

        $(window).on('load', function() {
            window.onresize = function() {
                if(!Session.get('dropdown')) $('form').css('visibility', 'hidden');
                $('form').css('transform', 'translate3d(0, -' + ($('form').outerHeight() + 8) + 'px, 0)').one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function() {
                    $('form').css('visibility', 'visible');
                });
            }

            window.onresize();
        });
    });
}

if(Meteor.isServer) {

    function calcPoints(id) {
        var story = Stories.findOne(id);
        var seconds = Math.floor((new Date() - story.date) / (1000));
        var points = (Math.log((story.likes + 100) / 100) * 1000) - (Math.log(seconds) * 10);
        Stories.update(id, {$set: {points: points}});
    }

    Meteor.publish('stories', function () {
        return Stories.find({visable: {$ne: false}}, {fields: {flags: 0, visable: 0}, sort: {points: -1}});
    });

    Meteor.methods({
        upload: function(longitude, latitude, url, tags) {
            if (Stories.findOne({url: url})) throw new Meteor.Error('URL matches another one in the database. Is it a duplicate?');

            var geo = new GeoCoder();
            var reverse = geo.reverse(latitude, longitude)[0];
            if(reverse.country.split(' ').length > 1) reverse.country = reverse.countryCode;
            var location = {coordinates: [longitude, latitude], country: reverse.country, city: reverse.city};

            check(tags, Match.Optional([String]));
            var date = new Date();
            tags.push(location.city, location.country);
            Stories.insert({location: location, url: url, tags: tags, date: date, likes: 0, flags: 0});
        },

        like: function(id, liked) {
            var inc = 1;
            if(!liked) inc = -1;
            Stories.update(id, {$inc: {
                likes: inc
            }});

            calcPoints(id);
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
        var calcAllPoints = new ScheduledTask('every 1 minute', function () {
            //console.log('Checking points.');
            var date = new Date();
            Stories.find({visable: {$ne: false}}).forEach(function(story) {
                calcPoints(story._id);
            });
        });
        calcAllPoints.start();
    });
}
