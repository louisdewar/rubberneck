if(Meteor.isClient) {
    $(window).scroll(function() {
        if($(window).scrollTop() > 0) $('header').addClass('scroll');
        else $('header').removeClass('scroll');
    });
}
