## NOAA CO-OPS Water Temperature Viewer

This is an alternate view of water temperature data provided by the [NOAA](http://tidesandcurrents.noaa.gov/map/).

Demo at: http://noaa-coops-viewer.vmbed.com/

I created this as I'm interested in SF Bay water temperature over the years because I swim with these [people](http://www.dolphinclub.org/). Though the temperature has no ultimate bearing on whether I swim or not. I just [enjoy the swim](http://www.sfchronicle.com/thetake/article/Dolphin-Club-The-oldest-goats-in-the-bay-6762877.php).

So this is mostly an exercise in a single page app using [React](https://facebook.github.io/react/), [Redux](https://github.com/rackt/redux) and associated tools.

I initialy started from [React Redux Starter Kit](https://github.com/davezuko/react-redux-starter-kit) which is a useful starting point and brings in many good features (webpack, babel, eslint, SCSS) and structure but this is arguably too complex for such a simple project. And it brings in some features (hot module reloading) that are overkill and i've since edited out a lot of that.

The chart comes from the excellent [Victory](http://victory.formidable.com/) project.

### Build & Run

`npm install && NODE_ENV=production webpack -p && npm start`

Then connect to http://localhost:5000/

### Dev

- Run once: `npm install`
- Build & rebuild when files change: `webpack -w`
- Serve built assets and proxy connections to NOAA: `node proxy.js`

Connect to: http://localhost:9090/
