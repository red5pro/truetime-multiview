<h3 align="center">
  <img src="assets/Red5_Truetime_black.png" alt="Red5 TrueTime" style="height: 60px" />
</h3>

# Red5 TrueTime MultiView For Fans

The Red5 Pro TrueTime MultiView is a web-based application that allows for viewing multiple live streams while providing the ability to switch between a "main feed" which has _optional_ live seek integration.

Additionally, it provides embedding options to easily add a TrueTime MultiView to your own website!

- [Project Structure](#project-structure)
- [Usage](#usage)
  - [Query Params](#query-params)
- [Examples](#example-usage-with-query-params)

# Project Structure

The following defines the role of the relevant files for the project.

> Please view the files individually for more comments and information.

## index.html

The [index.html](index.html) only and main HTML page of the TrueTime MultiView.

## script/main.js

The [main.js](script/main.js) file is the main entry for the application and is loaded as a `module`.

## script/subscriber.js

The [subscribe.js](script/subscriber.js) file defines the `Subscriber` class that is used in establishing a playback instance that can be enabled to use live seek capabilities.

The TrueTime MultiView application is made up of N-number of `Subscriber`s based on the provided list of streams to be consumed. One `Subscriber` is considered the "main feed" as it remains largest in display and provides the ability to scrub back in time on a live stream.

All other `Subscriber`s reside in a tray - either below the main subscriber when in portait orientation or overlayed and to the right when in landscape orientation.

## script/url-uril.js

The [url-util.js](script/url-util.js) file provides utility methods in accessing query parameters for configuration and setup.

> See [Query Params](#query-params) section for more information about the supported query parameters.

## script/modal-util.js

The [modal-util.js](script/modal-util.js) file provides utility methods for opening basic Error and Warning dialogs.

## script/embed-mode.js

The [embed-mode.js](script/embed-mode.js) file provides the ability to open and modify options in an Embed modal dialog.

When the `embed=true` query param is provided, a small cog icon will appear in the upper-right of the page. When clicked, this will open an Embed dialog providing the ability to fine-tune any options and allow you to generate an `iframe` script which you can place on your own site to easily host your own TrueTime MultiView.

## css/main.css

The [main.css](css/main.css) file provides the default style declarations of the TrueTime MultiView. The default styles are based on the application residing in Portait orientation.

## css/media-queries.css

The [media-queries.css](css/media-queries.css) file provides style overrides of `main.css` for other layout orientations other than Portait - mainly Landscape.

## css/ttmv-controls.css

The [ttmv-controls.css](css/atmv-controls.css) file provides style overrides for the Playback Controls of the Red5 Pro WebRTC SDK.

> The default styles of the Playback Controls can be found in [lib/red5pro/red5pro0media.css].

## css/embed.css

The [embed.css](css/embed.css) file provides style declarations related to the embed mode and Embed modal dialog.

## lib/red5pro

The Red5 Pro WebRTC SDK release files.

## examples/ttmv-iframe

This example demonstrates how to use the [r5pro_ttmv_iframe.js](r5pro_ttmv_iframe.js) script file to embed a TrueTime MultiView on your own site programmatically!

> See also [TTMV iframe](#ttmv-iframe).

## Run Locally

This project was setup using [Vite](https://vitejs.dev/).

```sh
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your favorite browser.

## Build

To build the project, issue the following (after having already run `npm install`):

```sh
npm run build
```

This will generate the built files in a `dist` directory.

> Note: It is not necessary to build the project. This repository can be deployed and accessed from a web browser without generating minified content.

# Usage

When visiting the TrueTime MultiView webapp - either through launching in `dev` or loaded from a built distribution - there are several optional query params that can be added to the landing URL to configure the app to use your own Red5 Pro Server deployment and playback live streams.

Once loaded with the proper configurations you will be able to view one stream as the "main feed" and view other live streams in a smaller format. The non "main feed" streams can be selected to move to the "main feed" spot, replacing each other's playback.

While the live stream is available in the "main feed", you have the ability to seek within the lifetime of the stream!

> It is important to note that your Red5 Pro Server will need to be properly configured to support live seek and VOD.

## Query Params

The following query parameters are available. Though _optional_, it is recommended to use in order to properly configure your TrueTime MultiView session.

| Param Name |       Default Value        | Description                                                                                                                                                                                                                                                                                                       |
| :--------- | :------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `host`     | `window.location.hostname` | The Red5 Pro Server endpoint that hosts the live streams. _The FQDN_                                                                                                                                                                                                                                              |
| `app`      |           `live`           | The webapp context on which the live streams reside.                                                                                                                                                                                                                                                              |
| `url`      |        `undefined`         | The optional service URL (including protocol and possible port) that `GET` requests will be made on to retrieve the current list of live streams. _See [Service URL Response](#service-url-response) for more info._                                                                                              |
| `vod`      |           `true`           | The option to allow for live seek controls of the main stream. _See [Enabling Live Seek on Server](#enable-live-seek-on-server) for more info._                                                                                                                                                                   |
| `abr`      |          `false`           | Flag to notify the application that the server uses Adaptive Bitrate control to provide different variants of the live streams.                                                                                                                                                                                   |
| `abrlow`   |            `3`             | When `abr=true`, the specified ladder suffix/index at which the lowest ABR variant resides. This is used in accessing the live stream by name. All the non "main feed" subscribe will then load and playback the lowest ABR variant.                                                                              |
| `abrhigh`  |            `1`             | When `abr=true`, the specified ladder suffic/index at which the highest ABR variant resides. This is used in accessing the live stream by name. Only the "main feed" playback will load the highest ABR variant.                                                                                                  |
| `vodbase`  |        `undefined`         | The base URL in which the VOD files for the live streams are located. By default it will look on the `host` for the VOD files. Using this query param you can specify a specific remote base location where the VOD files can be found - such as a CDN or NFS. _See [VOD Base URL](#vod-base-url) for more info._ |
| `embed`    |          `false`           | Flag to enable the ability for users to access the embed options to host their own TrueTime MultiView web application.                                                                                                                                                                                            |
| `debug`    |          `false`           | Flag to enable debug logging in the browser Dev Console.                                                                                                                                                                                                                                                          |

**Any other query param key-value pairs will be treated as a list of streams to load.**

As mentioned above, any key-value pairs other than the ones defined the query params table will be treated as stream listings defined by: `<label>=<stream name>`.

The `<label>` value is visible textually overlapping the loaded stream for playback, the name of which is the value of `<stream name>`.

When using the `<label>=<stream name>` pairs, each subscriber associated with the stream will continually request playback if the stream is considered unavailable - essentially it will assume that the stream is yet to be "live" or has a small loss in network connection and will continue to reconnect.

> If the `url` query parameter is provided, it takes precedence over accessing the stream list and the additional non-defined query params are not used. See [Service URL Response](#service-url-response) for more info.

## Service URL Response

By providing a `url` query param, it will be used to make a `GET` request to access the list of available streams for playback. The structure of the payload response from the service needs to conform to the following schemas:

- `[ <string> ]`: The label and stream name will be the same.
- `[ { name: <string> } ]`: The label and stream name will be the same.
- `[ { name: <string>, label: <string> } ]`: The `name` denoted the steam name and the `label` denotes the textual label to display.
- `{ <string>: <string> }`: The key will denotes the textual label and the value denotes the stream name.

By default, you can access a simple list of available streams from [https://yourred5pro.com/live/streams.jsp](https://yourred5pro.com/live/streams.jsp). You can simply provide that if you wish, or you can define which stream explicitly using the `<label>=<stream name>` key-value query params defined in the previous section.

Likewise, if utilizing a Stream Manager, you can provide a `url` similar to [https://yourred5pro.com/streammanager/api/4.0/event/list](https://yourred5pro.com/streammanager/api/4.0/event/list) that will return a payload with acceptable structure.

> If using the `url` query param, the application will make a recurring request every 5 seconds for an updated stream list.

## Enabling Live Seek on Server

In order to take advantage of the live seek capabilities of the main feed stream, you will need to set the following attributes in the `conf/hlsconfig.xml` configuration and restart your server:

```
<property name="outputFormat" value="TS"/>
```

```
<property name="dvrPlaylist" value="true"/>
```

This will instruct the server to serialize the full length of the stream to local or remote disk (see following section) in order to provide full live seek of the playback stream. Without these set, on an Origin server, you may see that playback has a finite range of seek as the server does reserve some HLS segment history for each stream.

## VOD Base URL

When configuring your Red5 Pro Server to support Live Seek capabilities, you will also have the option to save all VOD files of the live streams to a separate remote location. By default, the VOD files will be serialized to the `streams` directory of the target `app` context, but in order to save disk space on the server, you may want to save the files to another remote location like a CDN or NFS.

When saving the VOD files to a remote location, you should use the `vodbase` query param to specify the base URL of that remote location where the VOD files can be located.

For example: `vodbase=https://myremotenfs.com`. When the app wants to load and have live seek enabled for a stream names `mystream`, it will then look for those VOD files at `https://myremotenfs.com/mystream.m3u8`.

> The VOD files are stored as HLS.

# Example Usage with Query Params

## Basic Streams

In this example, we have a series of query params that pair labels with stream names.

1. Start a stream on your server (`myred5.com`) with the stream name `stream1`
2. Start another stream with the stream name `stream2`
3. Load the mutliview with the following URL (replacing `myred5.com` with the FQDN of your deployment):

```sh
https://myred5.com/truetime-multiview/?host=myred5.com&Camera%20One=stream1&Camera%20Two=stream2
```

The query params follow this structure: `<label>=<stream name>`. The first defined `<label>=<stream name>` key-value param will be loaded into the "main feed".

> You can provide any number of `<label>=<stream name>` key-value params. The list will appear below the "main feed" in Portrait orientation with a max of 3 streams per row, wrapping. The first 3 streams will be visible. Any other will appear below-the-fold and scrollable to.

## Loading Streams Listed from a Service

To take advantage of a service that list the desired streams to display, use the `url` query parameter.

1. Start several streams on your server (`myred5.com`)
2. Load the mutliview with the following URL (replacing `myred5.com` with the FQDN of your deployment):

Using the Service URL:

```sh
https://myred5.com/truetime-multiview/?host=myred5.com&url=https://myred5.com/live/streams.jsp
```

> See [Service URL Response](#service-url-response) for more info about expected response payload.

## Providing Live Seek Capability

To take advantage of live seek capabilities (on the main stream only), use the `vod` and optional `vodbase` query params.

1. Set up your deployment for live seek capabilities: [Enabling Live Seek on Server](#enable-live-seek-on-server)
2. Optionally set up a remote storage server to access the HLS files generated: [VOD Base URL](#vod-base-url)
3. Start a stream on your server (`myred5.com`) with the stream name `stream1`
4. Start another stream with the stream name `stream2`
5. Load the mutliview with the following URL (replacing `myred5.com` with the FQDN of your deployment):

```sh
https://myred5.com/truetime-multiview/?host=myred5.com&Camera%20One=stream1&Camera%20Two=stream2&vod=true&vodbase=https://myremotenfs.com
```

> See [Enabling Live Seek on Server](#enable-live-seek-on-server) and [VOD Base URL](#vod-base-url) for more info about setting up your deployment for live seek.

## Transcoding and Adaptive Bitrate

To take advantage of Red5's transcoding and adaptive bitrate playback capabilities, you will first need to set up your deployment to enable transcoding.

> Please read the [Transcoding and ABR](https://www.red5.net/docs/red5-pro/users-guide/transcoder/red5-pro-transcoding-and-abr-overview/) documentation for proper setup and provisioning.

1. Set up for deployment for transcoding capabilities
2. Post a couple of provisions detailing the 3 stream varaints each for transcoding for streams with names `stream1` and `stream2`
3. Start the `stream1_1` stream for the highest variant for stream name `stream1`
4. Start the `stream2_1` stream for the highest variant for stream name `stream2`
5. Load the mutliview with the following URL (replacing `myred5.com` with the FQDN of your deployment):

```sh
https://myred5.com/truetime-multiview/?host=myred5.com&Camera%20One=stream1&Camera%20Two=stream2&abr=true&abrhigh=1&abrlow=3
```

Of note are the `abr`, `abrhigh` and `abrlow` query params in this example.

- `abr=true` will tell the multiview app that the streams to subscribe to are going to be variants based on the provisions you posted in Step 2 of this example.
- `abrhigh=1` will tell the multiview app that the stream to load in the "main" view should be of the highest variant - in following this example, that stream name will initially be `stream1_1`
- `abrlow=3` will tell the multiview app that the streams to load in the smaller views should be of the lowest variant - in following this example, that stream name will initially be `stream2_3`

> If you are using a [Red5 Cloud](https://cloud.red5.net/pricing) deployment, please visit the `Deployments` section in your account dashboard to define transcoder options of a deployment.

# Embed

The TrueTime MultiView web application also provides the ability to viewers to generate and copy their own `iframe` script to include a version of the TrueTime MultiView player on their own websites!

This is done by defining a URL src on an `iframe` element with all the optionally configured query params discussed previously in this document.

## Embed options

By defining `embed=true` in the query params, a cog icon will be revealed in the upper-right corner of the TrueTime MultiView web application. By clicking on the cog icon, an **Embed** modal dialog will be opened where users can modify all the available options for hosting their own TrueTime MultiView on their websites.

Once the options are set, they can click `Copy and Close` to copy the `iframe` script to their clipboard and paste it on a page available from their website!

## TTMV iframe

Included in the root of this repo is the [r5pro_ttmv_iframe.js](r5pro_ttmv_iframe.js) script that can be used to programmatically load a TrueTime MultiView web app in an `iframe` on your website page.

You will need to define a `onR5ProReady` function on the window global scope to be invoke once the script is dynamically loaded. The only argument will be a `R5PRO` object exposing the `TTMV` class declaration. By instantiating a new `TTMV` instance with a configuration whose attributes relate to the query params discussed earlier in this document, tou can progrommatically insert a TrueTime MultiView on your website page:

```html
<body>
  <div id="app"></div>
  <script>
    const searchParams = new URLSearchParams(window.location.search)
    // embedHost is the host that provides the files required to run an TTMV instance.
    // By default, the github pages of this repo can provide the host pages.
    const embedHost = searchParams.has('embedhost')
      ? searchParams.get('embedhost')
      : 'http://red5pro.github.io/truetime-multiview'

    // Invoked once the inject script is loaded.
    function onR5ProReady(R5PRO) {
      // Create a new Red5 Pro TrueTime MultiView instance, loaded in an iframe that replaces the `app` element.
      var app = new R5PRO.TTMV('app', {
        width: '100%',
        height: '100%',
        embedHost,
        // The following are parameters to define the TTMV experience.
        host: searchParams.has('host')
          ? searchParams.get('host')
          : window.location.hostname,
        debug: true,
        abr: true,
        abrLow: 3,
        abrHigh: 1,
        vodBase: undefined,
        scriptUrl: undefined,
        streamList: [
          { label: 'Camera One', streamName: 'stream1' },
          { label: 'Camera Two', streamName: 'stream2' },
        ],
      })
    }

    // Inject the Red5 Pro TrueTime MultiView script.
    var tag = document.createElement('script')
    tag.src = `${embedHost}/r5pro_ttmv_iframe.js`
    document.body.parentNode.insertBefore(tag, document.body)
  </script>
</body>
```

The `embedHost` parameter points to the remote address where the frontend files for this web client are hosted. By default, we point to the generate GitHub pages for this repository.

**To host your own TrueTime MultiView, just clone this repo and change the look-and-feel and branding to your desire!**
