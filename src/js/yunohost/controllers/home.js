(function() {
    // Get application context
    var app = Sammy.apps['#main'];
    var store = app.store;

    /**
     * Home
     *
     */

     // Home page
    app.get('#/', function (c) {
        c.view("home");
        // N.B : if you need to run stuff at login time,
        // see js/events.js instead
    });

    /**
     * Login
     *
     */

    app.get('#/login', function (c) {
        $('#masthead').show()
            .find('.logout-btn').hide();
        store.set('path-1', '#/login');

        c.showLoader();

        c.checkInstall(function(isInstalled) {
            if (isInstalled) {
                c.hideLoader();
                // Pass domain to hide form field
                c.view('login', { 'domain': window.location.hostname });
            } else if (typeof isInstalled === 'undefined') {
                if (app.isInstalledTry > 0) {
                    app.isInstalledTry--;
                    setTimeout(function() {
                        c.redirect('#/');
                    }, 5000);
                }
                else {
                    // Reset count
                    app.isInstalledTry = 3;

                    // API is not responding after 3 try
                    $( document ).ajaxError(function( event, request, settings ) {
                        // Display error if status != 200.
                        // .ajaxError fire even with status code 200 because json is sometimes not valid.
                        if (request.status !== 200) c.flash('fail', y18n.t('api_not_responding', [request.status+' '+request.statusText] ));

                        // Unbind directly
                        $(document).off('ajaxError');
                    });

                    c.hideLoader();
                }
            } else {
                c.hideLoader();
                c.redirect('#/postinstall');
            }
        });
    });


    /**
     * Logout
     *
     */

    app.post('#/login', function (c) {
        // Store url from params, it could have change form 'run' state
        store.set('url', c.params['domain'] +'/yunohost/api');

        var params = {
            password: c.params['password']
        };
        c.api('POST', '/login', params, function(data) {
            store.set('connected', true);
            c.trigger('login');
            $('#masthead .logout-btn').fadeIn();
            c.flash('success', y18n.t('logged_in'));
            if (store.get('path')) {
                c.redirect(store.get('path'));
            } else {
                c.redirect('#/');
            }
        }, undefined, false);

    });

    app.get('#/logout', function (c) {
        c.api('GET', '/logout', {}, function (data) {
            store.clear('url');
            store.clear('connected');
            store.set('path', '#/');
            c.trigger('logout');
            c.flash('success', y18n.t('logged_out'));
            c.redirect('#/login');
        }, undefined, false);
    });

})();
