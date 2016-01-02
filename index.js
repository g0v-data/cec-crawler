var request = require('request');
var async = require('async');
var jsdom = require('jsdom');
require('shelljs/global');

const CITY_LIST_URL = 'http://2016.cec.gov.tw/frontsite/2016/proofreader/city/self/list';
const AREA_LIST_URL = 'http://2016.cec.gov.tw/frontsite/2016/proofreader/area/self/list';
const PAGE_PREFIX = 'http://2016.cec.gov.tw/frontsite/2016/proofreader/voteplace';
const ECE_PREFIX = 'http://2016.cec.gov.tw'
const JQUERY_URL = 'http://code.jquery.com/jquery.js';
const RE_DATA = /\('#canRPTAreaNomal'\)\.CanRPTArea\({\s+(.+)\s+showNoCandidates:function\(\){/m;

var cities = [];
var pics = [];
var pages = [];
var candidates = {}

async.series([
  done => {
    request.post(CITY_LIST_URL, {form: {type: 1}}, function(err, res, body) {
      cities = JSON.parse(body);
      done()
    });
  },
  done => {
    var tasks = cities.map(city => {
      return function(done) {
        var form = {
          form: {
            cityno: city.cityno,
            type: 1,
            provinceno: city.provinceno
          }
        };
        request.post(AREA_LIST_URL, form, (err, res, body) => {
          city['areas'] = JSON.parse(body);
          done();
        });
      }
    });
    async.series(tasks, (err, results) => {
      done();
    });
  },
  done => {
    pages = [];
    cities.forEach(city => {
      city.areas.forEach(area => {
        var url = `${PAGE_PREFIX}/1/${city.provinceno}/${city.cityno}/${area.areano}`;
        pages.push({
          provinceno: city.provinceno,
          cityno: city.cityno,
          areano: area.areano,
          url: url,
          pics: [],
        });
      });
    });
    var tasks = pages.map((page, index) => {
      return function(done) {
        console.log(index + ': working on ' + page.url);
        JSON.stringify(candidates, null, 2).to('candidates.json');
        jsdom.env(
          page.url, [JQUERY_URL],
          function(err, window) {
            var $ = window.$;
            var matches = window.document.documentElement.innerHTML.match(RE_DATA);
            if (matches) {
              var raw = matches[1].substring(5, matches[1].length-1);
              var json = JSON.parse(raw);
              json.elections.forEach(candidate => {
                candidates[candidate.candidateno] = candidate;
              });
            }
            done();
          }
        );
      }
    });
    console.log('total pages: ', pages.length);
    async.series(tasks, function() {
      done();
    });
  }
],
function() {
  JSON.stringify(candidates, null, 2).to('candidates.json');
});


