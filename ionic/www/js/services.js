angular.module('propertycross.services', ['ngResource'])

.factory('Nestoria', function($resource, $q) {
    var service = $resource("http://api.nestoria.co.uk/api",
                            { country: "uk",
                              pretty: "1",
                              action: "search_listings",
                              encoding: "json",
                              listing_type: "buy",
                              callback: "JSON_CALLBACK" },
                            { search: { method: "JSONP" } });

    return {

        search: function(placeName, page) {
            var q = $q.defer();
            service.search({
                place_name: placeName,
                page: page
            },
            function(response) {
                q.resolve(response.response);
            },
            function(error) {
                q.reject(error);
            });
            return q.promise;
        },

        searchByCoordinates: function(latitude, longitude, page) {
            var q = $q.defer();
            service.search({
                centre_point: latitude.toFixed(2) + ',' + longitude.toFixed(2),
                page: page
            },
            function(response) {
                q.resolve(response.response);
            },
            function(error) {
                q.reject(error);
            });
            return q.promise;
        }

    };
})

.factory('Geolocation', function($q) {

    return {

        getCurrentPosition: function() {
            var q = $q.defer();
            navigator.geolocation.getCurrentPosition(
                function(result) {
                    q.resolve(result);
                },
                function(error) {
                    q.reject(error);
                });
            return q.promise;
        }

    };
})

.factory('Properties', function($q, Nestoria, Geolocation) {

    var lastSearch = '',
        page = 1,
        lastResponse,
        properties = [];

    function toProperties(listings) {

        function simplifyTitle(title) {
            var parts = title.split(', ');
            parts.length = 2;
            return parts.join(', ');
        }
        function formatPrice(price) {
            return '£' + price.split(' ')[0];
        }

        return listings.map(function(listing) {
            return {
                guid: listing.guid,
                title: simplifyTitle(listing.title),
                price: formatPrice(listing.price_formatted),
                thumbnailURL: listing.thumb_url,
                imageURL: listing.img_url,
                summary: listing.summary,
                rooms: listing.bedroom_number + ' bed, ' + listing.bathroom_number + ' bathroom'
            };
        });
    }

    return {
        current: function() {
            return properties;
        },

        count: function() {
            return properties.length;
        },

        total: function() {
            return Number(lastResponse.total_results);
        },

        location: function() {
            return lastSearch;
        },

        search: function(placeName) {
            lastSearch = placeName;
            page = 1;
            lastResponse = null;
            properties = [];

            var q = $q.defer();
            Nestoria.search(placeName, page).then(
                function(response) {
                    lastResponse = response;
                    properties = toProperties(response.listings);
                    q.resolve(properties);
                },
                function(error) {
                    q.reject(error);
                }
            );
            return q.promise;
        },

        searchByCurrentLocation: function() {
            lastSearch = '';
            page = 1;
            lastResponse = null;
            properties = [];

            var q = $q.defer();
            Geolocation.getCurrentPosition().then(
                function(result) {
                    // TODO update lastSearch, etc
                    Nestoria.searchByCoordinates(result.coords.latitude,
                                                 result.coords.longitude,
                                                 page).then(
                        function(response) {
                            lastResponse = response;
                            properties = toProperties(response.listings);
                            q.resolve(properties);
                        },
                        function(error) {
                            q.reject(error);
                        }
                    );
                },
                function(error) {
                    q.reject(error);
                }
            );
            return q.promise;
        },

        // TODO handle more properties when using coordinates
        more: function() {
            var q = $q.defer();
            Nestoria.search(lastSearch, ++page).then(
                function(response) {
                    lastResponse = response;
                    properties = properties.concat(toProperties(response.listings));
                    q.resolve(properties);
                },
                function(error) {
                    q.reject(error);
                }
            );
            return q.promise;
        },

        get: function(id) {
            for (var i = 0, len = properties.length; i < len; i++) {
                if (properties[i].guid == id) {
                    return properties[i];
                }
            }
            return null;
        }
    };
})

.factory('Favourites', function($q, Properties) {
    var properties = [];

    function save() {
        try {
            localStorage['favourites'] = JSON.stringify(properties);
        }
        catch(error) {
            console.error("Failed to save favourites", error);
        }
    }

    return {

        properties: function() {
            return properties;
        },

        load: function() {
            var q = $q.defer();
            try {
                if (!properties || !properties.length) {
                    properties = JSON.parse(localStorage['favourites']) || [];
                }
                q.resolve(properties);
            }
            catch(error) {
                console.error("Failed to load favourites", error);
                q.reject(error);
            }
            return q.promise;
        },

        add: function(property) {
            if (!property) {
                return;
            }
            properties.push(property);
            save();
            return properties;
        },

        remove: function(property) {
            var index = properties.indexOf(property);
            if (index == -1) {
                return index;
            }
            properties.splice(index, 1);
            save();
            return properties;
        },

        get: function(id) {
            for (var i = 0, len = properties.length; i < len; i++) {
                if (properties[i].guid == id) {
                    return properties[i];
                }
            }
            return null;
        },

        isFavourite: function(property) {
            return properties.indexOf(property) != -1;
        }
    };
})

;
