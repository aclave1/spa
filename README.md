# Spa
# WIP: more docs to come after it's been tested more
## Simple single page app routing library, work in progress!

# WHY REINVENT THE WHEEL??

This was done for a very small static site which needed to behave as a single page app. The main goals were:

* works great with a static site with only one file
* hitting a route correctly displays the corresponding state
* default states
* use regular anchor tags
* back/forward button
* no hashfrag in browsers that support html5 history
* simple to use


* Features: * 

* uses history and pushstate to modify the url, no hashfrag
* when showing a view, can currently use two strategies
* * scroll to view
* * hide others and show view

* Roadmap: * 

* "lightbox view"
* next/forward abilities
* * Ability to click a next button and travel to the "next" state. There will be some flexibility in how "next" is determined
* nested routes/states
* parallel routes/states
