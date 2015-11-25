var createHistory = require('history').createHistory;
var History = createHistory();

function Router(config){
    var routes = buildRoutesTable(config.routes);
    var currentState = null;
    var displayMethods = {
        scroll:scrollTo,
        show:showEl,
        'show-animate':showElAnimate
    };
    bindLinks();
    startRouter();
    goToStartingState();

    this.goToStateById = goToStateById;
    this.getCurrentState = getCurrentState;

    /**public api*/
    function goToStateById(elementId){
        var routeWithId = objectFind(routes,function(route){
            return route.elId === elementId;
        });
        if(undef(elementId))console.error('Cannot go to state with element id: '+elementId);
        enterState(routeWithId);
    }
    
    function getCurrentState(){
        return currentState;
    }

    /**private api*/
    function startRouter(){
        History.listen(function(state){ // Note: We are using statechange instead of popstate
            var url = parseUri(state.pathname);
            navigateTo(url.path);
        });
    }
    
    function goToStartingState(){
        var uri = parseUri(window.location.href);
        currentState=routes[normalizeUrl(uri.path)];
        if(uri.path !== '/'){
            return enterState(currentState);
        }
        var defaultState = getDefaultState(); 
        return defaultState !== null ?  enterState(defaultState) : false;//if there's no default state, do nothing.
    }

    function enterState(state){
        if(state === null || undef(state)) console.error('invalid state');
        currentState=state;
        History.pushState(null,state.url);
        navigateTo(state.url);
    }

    function getDefaultState(){
        //override the dom if a route was passed into the constructor
        if(!undef(config.defaultRoute)) return routes[config.defaultRoute];
        var defaultRoute = Object
            .keys(routes)
            .filter(function(key){
                return routes[key].defaultRoute === true;
            })
            .pop();
        return !undef(defaultRoute) ? routes[defaultRoute] : null; 

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
            //if config.display is a function, allow a custom animation
            var fn = typeof config.display === 'function' ? config.display : displayMethods[config.display];
            if(undef(fn)) fn = displayMethods.scroll;
            return fn(el);
        }
    }

    function scrollTo(el){
        $('html, body')
            .clearQueue()//prevents janky scrolling if this method is called frequently
            .animate({
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

    function objectFind(obj,fn){
        for(var k in obj){
            if(obj.hasOwnProperty(k)){
                var found = fn(obj[k]);
                if(found){return obj[k]}
            }
        }
        return null;
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