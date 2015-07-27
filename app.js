Stories = new Mongo.Collection('stories');

if(Meteor.isClient) {
    Meteor.subscribe('stories');
    Template.stories.helpers({
        stories: Stories.find()
    });

}

if(Meteor.isServer) {
    Meteor.publish('stories', function() {
        return Stories.find();
    });


    Meteor.methods({

    });
}
