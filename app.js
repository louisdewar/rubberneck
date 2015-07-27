if(Meteor.isClient) {
    Template.stories.helpers({
        stories: [{location: 'Calais', url: 'img-1.jpg'},{location: 'Paris', url: 'img-2.jpg'},{location: 'Istanbul', url: 'img-3.jpg'}]
    });
}
