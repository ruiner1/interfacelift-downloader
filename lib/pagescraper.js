/*
 * InterfaceLIFT Wallpaper Auto-Downloader
 * https://github.com/stevenbenner/interfacelift-downloader
 *
 * Copyright (c) 2015 Steven Benner (http://stevenbenner.com/).
 * Released under the MIT License.
 */

'use strict';

var events = require('events');
var http = require('http');
var util = require('util');
var resPaths = require('./respaths.json');

var DLREGEX = /\/wallpaper\/[\w]+\/\d+_\w+\.jpg/ig;
var USERAGENT = 'Mozilla/4.8 [en] (Windows NT 6.0; U)';
var HOST = 'interfacelift.com';

module.exports = function(resolution) {
  var resPath = resPaths[resolution];
  var downloadLinks = [];
  var me = this;

  this.start = function() {
    me.emit('next', 1, resPath);
  };

  this.on('next', function(pageNumber, uri) {
    var requestConfig = {
      hostname: HOST,
      port: 80,
      path: uri,
      headers: {
        'User-Agent': USERAGENT
      }
    };

    http.get(requestConfig, function(response) {
      var pageData = '';

      response.on('data', function(chunk) {
        pageData += chunk;
      });

      response.on('end', function() {
        // grab image download links
        var matches = pageData.match(DLREGEX).filter(function(href) {
          // filter out preview images
          // i couldn't get regex lookaheads working
          return href.indexOf('previews') === -1;
        });
        downloadLinks = downloadLinks.concat(matches);

        // grab next page link
        pageNumber++;
        var nextPage = util.format('%sindex%d.html', resPath, pageNumber);

        // if there is a next page run the next callback, or end
        if (pageData.indexOf(nextPage) > -1) {
          me.emit('next', pageNumber, nextPage);
        } else {
          me.emit('end', downloadLinks);
        }
      });
    });

  });
};

util.inherits(module.exports, events.EventEmitter);
