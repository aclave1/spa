var createHistory = require('history').createHistory;
var History = createHistory();

function Router(config){
    var isScrolling = false;
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
    if(config.watchScroll === true){
        watchScroll();
    }

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
        pushHistory(state.url);
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
        $('[router-link], .router-link').on('click','a',function(e){
            preventDefault(e);
            console.log('click');
            var uri = parseUri($(this)[0].href);
            pushHistory(uri.path);
            navigateTo(uri.path);
        });
    }

    function pushHistory(url){
        var route = getRoute(url);
        if(route !== null){
            History.pushState(null,route.url);
        }else{
            History.pushState(null,url);
        }
    }

    function getRoute(url){
        var route = routes[normalizeUrl(url)];
        return !undef(route) ? route : null;
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
        isScrolling = true;

        var headerOffset = typeof config.headerOffset === 'function' ? config.headerOffset() : 0;

        $('html, body')
            .clearQueue()//prevents janky scrolling if this method is called frequently
            .animate({
                scrollTop: el.offset().top - headerOffset
            }, 500,function done(){
                isScrolling = false;
            });
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

    function watchScroll(){
        var routeIndex = 0;
        var sortedByPosition = [{scrollPos:0,url:'/'}].concat(config.routes.sort(function(route1,route2){
            return route1.scrollPos - route2.scrollPos;
        }));
        

        $(window).scroll(function(){
            if(isScrolling) return;
            var $window = $(this);
            var winHeight = $window.height();
            var scrollPos = $window.scrollTop();
            var scrollPosIdx = sortedByPosition.findIndex(function(route,routeIdx,allRoutes){
                if(routeIdx === 0){//start
                    return scrollPos < allRoutes[routeIdx+1].scrollPos;
                }else if(routeIdx === allRoutes.length-1){//end
                    return scrollPos + winHeight > allRoutes[routeIdx].scrollPos;
                }else{//middle
                    return scrollPos > route.scrollPos && scrollPos < allRoutes[routeIdx+1].scrollPos;
                }
            });
            if(scrollPosIdx !== routeIndex){
                routeIndex = scrollPosIdx;
                var newRoute = sortedByPosition[routeIndex];
                console.log('new route');
                console.log(scrollPos);
                console.dir(newRoute);
                pushHistory(newRoute.url);
            }
        });
    }

    function normalizeUrl(url){
        //remove leading and trailing slashes
        return url.replace(/^\/|\/$/g, '');
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
    var routes = $('[route]',document).map(function(){
        var el = $(this);
        return {
            elId:this.id,
            url:el.attr(urlProp),
            defaultRoute:!undef(el.attr(defaultRouteProp)),
            scrollPos:getElementScrollPosition(el)
        };
    });
    return [].slice.call(routes);
};

function getElementScrollPosition($el){
    return $el.offset().top;
}


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
