
define(function(require, exports, module) {
    'use strict';
    var StateModifier = require('famous/modifiers/StateModifier');

    var Surface    = require('famous/core/Surface');
    var Transform  = require('famous/core/Transform');

    var MarginLayout = require('layouts/MarginLayout');

    var View         = require('famous/core/View');

    function LoadMoreEntry() {
        View.apply(this, arguments);

        var modifier = new StateModifier({
            size: this.options.size
        });

        this.node = this.add(modifier);
        this._loading = false;

        _createBacking.call(this);
        _createDescription.call(this);
    }

    LoadMoreEntry.prototype = Object.create(View.prototype);
    LoadMoreEntry.prototype.constructor = LoadMoreEntry;

    LoadMoreEntry.DEFAULT_OPTIONS = {
        size: [undefined, undefined]
    };

    function _createBacking() {
        var surface = new Surface({
            properties: {
                borderBottom: '1px solid #DDD'
            }
        });
        this.node.add(surface);

        var eventHandler = this._eventOutput;

        surface.on('click', function(event) {
            this._title.setContent('Loading ...');
            if (!this._loading) {
                this._loading = true;
                eventHandler.emit('loading-more', event);
            }
        }.bind(this));
    }

    function _createDescription() {

        var layout = new MarginLayout({
            margins: [10, 10, 10, 10]
        });

        this._title = new Surface({
            content: 'Load more...',
            size: [undefined, 20],
            properties: {
                fontSize: '20px',
                lineHeight: '20px',
                overflow: 'hidden',
                pointerEvents: 'none',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }
        });

        var descriptionContent = 'Results for <b>' +
            this.options.searchTerm + '</b>, showing <b>' +
            this.options.count + '</b> of <b>' +
            this.options.total + '</b> properties';

        this._description = new Surface({
            content: descriptionContent,
            size: [undefined, 20],
            properties: {
                fontSize: '16px',
                lineHeight: '20px',
                overflow: 'hidden',
                pointerEvents: 'none',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }
        });

        var titleModifier = new StateModifier({
            align: [0.5, 0.5],
            origin: [0.5, 1],
            transform: Transform.translate(0, -5, 0)
        });
        var descriptionModifier = new StateModifier({
            align: [0.5, 0.5],
            origin: [0.5, 0],
            transform: Transform.translate(0, 5, 0)
        });

        layout.add(titleModifier).add(this._title);
        layout.add(descriptionModifier).add(this._description);

        this.node.add(layout);
    }

    module.exports = LoadMoreEntry;
});
