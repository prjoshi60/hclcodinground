/**
 * This javascript file will constitute the entry point of your solution.
 *
 * Edit it as you need.  It currently contains things that you might find helpful to get started.
 */

// This is not really required, but means that changes to index.html will cause a reload.
require('./site/index.html')
// Apply the styles in style.css to the page.
require('./site/style.css')

// if you want to use es6, you can do something like
//     require('./es6/myEs6code')
// here to load the myEs6code.js file, and it will be automatically transpiled.

// Change this to get detailed logging from the stomp library
global.DEBUG = true

// globalArray: Maintaining the global array to keep records of currencies getting from socket. 
var globalArray = [];

// midPriceObject: Maintaining the global object to keep records of midprices against each currency name. 
var midPriceObject = {};

const url = "ws://localhost:8011/stomp"
const client = Stomp.client(url)
client.debug = function (msg) {
  if (global.DEBUG) {
    document.getElementById('stomp-status').innerHTML = msg
  }
}

function connectCallback() {
  //document.getElementById('stomp-status').innerHTML = "It has now successfully connected to a stomp server serving price updates for some foreign exchange currency pairs pairs."
  document.getElementById('stomp-status').innerHTML = "<h1>connected successfully!</h1>"


  // Socker subscriber callback function.  
  callback = function (message) {
    if (message.body) {

      var messageBody = JSON.parse(message.body);

      // Check if global array already have entry of the currency name.
      var index = globalArray.findIndex(elem => elem.name === messageBody.name);

      if (index > -1) {
        globalArray.splice(index, 1, messageBody);
      } else {
        globalArray.push(messageBody);
      }

      // Repopulate the given table. 
      showData();

    } else {
      alert("Subscribe Error: ");

    }
  }

  client.subscribe("/fx/prices", callback);
}

client.connect({}, connectCallback, function (error) {
  alert(error.headers.message)
})

/**
 * @function: showData
 * Following function rerenders the table. 
 * 
 */

function showData() {
  const finalArray = [...globalArray];

  // Sort the array based on lastChangeBid value
  finalArray.sort(function (a, b) {
    return a.lastChangeBid - b.lastChangeBid
  });
  finalArray.reverse();

  var tr = `<table>
            <tr>
              <th>Name</th>
              <th>Best Bid</th>
              <th>Best Ask</th>
              <th>Last Change Ask</th>
              <th>Last Change Bid</th>
              <th>Mid Price</th>
            </tr>`;

  //the amount that the best bid last changed, and the amount the best ask price last changed.

  // Note: MidPrice will shows intially as undefined, after 30s if the currency has values then shows it.
  for (const elem of finalArray) {
    const { name, bestBid, bestAsk, lastChangeAsk, lastChangeBid, midPrice } = elem;

    tr = tr + `<tr> 
          <td>` + name + `</td>
          <td>` + bestBid + `</td>
          <td>` + bestAsk + `</td>
          <td>` + lastChangeAsk + `</td>
          <td>` + lastChangeBid + `</td>
          <td>` + midPriceObject[name] + `</td>  
        </tr>`;
  }

  tr = tr + `<table>`;

  document.getElementById('stomp-table').innerHTML = tr;

}

const exampleSparkline = document.getElementById('example-sparkline');

// Set Interval to update the Spark Line on each 30 seconds. 
setInterval(function () {

  for (const elem of globalArray) {
    const { name, bestAsk, bestBid } = elem;
    let midPrice = (bestAsk + bestBid) / 2;
    midPriceObject[name] = midPrice;
  }

  const maps = Object.values(midPriceObject);
  Sparkline.draw(exampleSparkline, maps)

}, 30000)
