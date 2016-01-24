NOAA CO-OPS Water Temperature Viewer
------------------------------------

This is an alternate view of water temperature data provided by the [NOAA](http://tidesandcurrents.noaa.gov/map/).

I created this as I'm interested in SF Bay water temperature changes because I swim with these [people](http://www.dolphinclub.org/). In reality though I do not obsess about the water temperature and just [enjoy the swim](http://www.sfchronicle.com/thetake/article/Dolphin-Club-The-oldest-goats-in-the-bay-6762877.php). But I thought it might be nice to be able to compare one year to the next more easily.

So this is mostly an exercise in a single page app using [React](https://facebook.github.io/react/), [Redux](https://github.com/rackt/redux) and associated tools.

I initialy started from [React Redux Starter Kit](https://github.com/davezuko/react-redux-starter-kit) which is a useful starting point and brings in many good features (webpack, babel, eslint, SCSS) and structure but this is arguably too complex for such a simple project. And it brings in some features (hot module reloading) that are overkill and i've since edited out a lot of that.

The chart comes from the excellent [Victory](http://victory.formidable.com/) project. Time permitting, I plan to add some interactivity to the chart and feed that back to the project.
