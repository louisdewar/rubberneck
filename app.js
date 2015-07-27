if(Meteor.isClient) {
    Template.stories.helpers({
        stories: [{location: 'Test Location', url: 'random'},{location: 'Test Location 2', url: 'random2s'},{location: 'Test Location 2', url: 'random2s'}]
    });
}
