var createHistory = require('history').createHistory;
var History = createHistory();

function Router(config){
    var routes = buildRoutesTable(config.routes);
    var baseUrl = !undef(config.baseUrl) ? config.baseUrl : '';
    var displayMethods = {
        scroll:scrollTo,
        show:showEl,
        'show-animate':showElAnimate
    };
    bindLinks();
    startRouter();
    goToStartingState();

    
    function startRouter(){
        History.listen(function(state){ // Note: We are using statechange instead of popstate
            var url = parseUri(state.pathname);
            navigateTo(url.path);
        });
    }
    
    function goToStartingState(){
        var uri = parseUri(window.location.href);
        if(normalizeUrl(uri.path) !== normalizeUrl(baseUrl)){
            return navigateTo(uri.path);
        }
        return navigateTo(getDefaultRoute());
    }

    function getDefaultRoute(){
        var defaultRoute = Object
            .keys(routes)
            .filter(function(key){
                return routes[key].defaultRoute === true;
            })
            .pop();
        return !undef(defaultRoute) ? defaultRoute : ''; 

    }

    function bindLinks(){
        $('[router-link]').click(function(e){
            preventDefault(e);
            var uri = parseUri(e.target.href);
            History.pushState(null,uri.path);
            navigateTo(e.target.pathname);
        });
    }

    function preventDefault(event){
        //old ie is silly
        event.preventDefault ? event.preventDefault() : (event.returnValue = false);
    }

    function navigateTo(url){
        var route = routes[normalizeUrl(url)];
        if(!undef(route)){
            var el = $('#'+route.elId);
            var fn = displayMethods[config.display];
            if(undef(fn)) fn = displayMethods.scroll;
            return fn(el);
        }
    }

    function scrollTo(el){
        $('html, body').animate({
            scrollTop: el.offset().top
        }, 500);
    }

    function showEl(el){
        //get the id's of all the elements we can route to, then convert their ids to a jquery selector format: #id1,#id2,#id3
        var selector = Object.keys(routes).map(function(key){
            return routes[key].elId;
        })
        .map(function(id){
            return '#'+id;
        })
        .join(',');

        $(selector).hide();
        el.show();
    }
    function showElAnimate(el){
        return showEl(el);//not implemented
    }

    function normalizeUrl(url){
        var _url = url;
        
        if(url.indexOf(baseUrl) > -1) _url= url.replace(baseUrl);

        if(url.charAt(0)==='/')_url = _url.slice(1);
        if(url.slice(-1)==='/')_url = _url.slice(0,-1);
        return _url;
    }

    function buildRoutesTable(routes){
        return routes.reduce(function(table,route){
            var url = normalizeUrl(route.url);
            table[url] = route;
            return table;
        },{});
    }  
}

//static method to build the routes list from the dom
Router.getRoutesFromElements = function(config){
    var _config = !undef(config) ? config : {}; 
    var urlProp = !undef(_config.url) ? _config.url : 'route';
    var defaultRouteProp =  !undef(_config.defaultRoute) ? _config.defaultRoute : 'default-route';
    var routes = $('[route]').map(function(){
        var el = $(this);
        return {
            elId:this.id,
            url:el.attr(urlProp),
            defaultRoute:!undef(el.attr(defaultRouteProp))
        };
    });
    return [].slice.call(routes);
};


function undef(x){
    return typeof x === 'undefined';
}

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
//http://blog.stevenlevithan.com/archives/parseuri
//tested in ie5+
function parseUri (str) {
    var o   = parseUri.options,
        m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
        uri = {},
        i   = 14;
    while (i--) uri[o.key[i]] = m[i] || "";
    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
    });
    return uri;
};
parseUri.options = {
    strictMode: false,
    key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
    q:   {
        name:   "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
};

module.exports = Router;