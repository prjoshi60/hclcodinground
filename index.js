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
global.DEBUG = false;

// globalArray: Maintaining the global array to keep records of currencies getting from socket. 
var globalArray = [];

// midPriceObject: Maintaining the global object to keep records of midprices against each currency name. 
var midPriceObject = {};

// tempArray: We keep the array of midprices against the currency name, we are keeping this array for the interval of next 30s. 
var tempArray = {};

const url = "ws://localhost:8011/stomp"
const client = Stomp.client(url)
client.debug = function (msg) {
  if (global.DEBUG) {
    //document.getElementById('stomp-status').innerHTML = msg
  }
}

function connectCallback() {
  document.getElementById('stomp-status').innerHTML = "It has now successfully connected to a stomp server serving price updates for some foreign exchange currency pairs pairs."

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

      const { bestBid, bestAsk } = messageBody;

      // Maintains the array of midprice in one object. 
      // On each update if the currency available then push the new midprice. 
      if (midPriceObject[messageBody.name]) {
        midPriceObject[messageBody.name].push((bestBid + bestAsk) / 2);
      } else {
        midPriceObject[messageBody.name] = [(bestBid + bestAsk) / 2];
      }

      // Repopulate the given table. 
      showData();

      let curName = messageBody.name;

      if (tempArray[curName]) {
        tempArray[curName].push();
      } else {
        createSparkLineImage(messageBody);
      }
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
  // finalArray.sort(function (a, b) {
  //   return a.lastChangeBid - b.lastChangeBid
  // });
  // finalArray.reverse();

  var tr = `<table>
            <tr>
              <th>Name</th>
              <th>Best Bid</th>
              <th>Best Ask</th>
              <th>Last Change Ask</th>
              <th>Last Change Bid</th>
              <th></th>
            </tr>`;

  //the amount that the best bid last changed, and the amount the best ask price last changed.

  // Note: MidPrice will shows intially as undefined, after 30s if the currency has values then shows it.
  for (const elem of finalArray) {
    const { name, bestBid, bestAsk, lastChangeAsk, lastChangeBid, midPrice } = elem;

    const sparkLines = 'div-' + name;
    const spandId = 'spark-' + name;

    tr = tr + `<tr> 
          <td>` + name + `</td>
          <td>` + bestBid + `</td>
          <td>` + bestAsk + `</td>
          <td>` + lastChangeAsk + `</td>
          <td>` + lastChangeBid + `</td>
          <td><div id="` + sparkLines + `"><span id="` + spandId + `"></span></div></td>
        </tr>`;
  }

  tr = tr + `</table>`;
  document.getElementById('stomp-table').innerHTML = tr;

  // To show sparklines in the last column. 
  populateSparks();
}

/**
 * function: populateSparks
 * description: Following function populate the sparklines. 
 * Initially tempArray will be empty so will not show anything.
 * But it will hold the same data for next 30s to show the sparks. 
 * 
 */

function populateSparks() {

  for (const elem of globalArray) {
    const array1 = tempArray[elem.name];
    const sparkElem = 'spark-' + elem.name;
    const sprkElement = document.getElementById(sparkElem);
    Sparkline.draw(sprkElement, array1);
  }
}


function createSparkLineImage(body) {
  const { name } = body;

  const array1 = midPriceObject[name];

  const sparkLines = 'div-' + name;
  const sparkElem = 'spark-' + name;
  const sprkElement = document.getElementById(sparkElem);
  Sparkline.draw(sprkElement, array1);
  tempArray[name] = [...array1]; // copy the array to tempArray. 
  midPriceObject[name] = []; // Clear the array. 

  setInterval(function () {

    const array1 = midPriceObject[name];
    const sparkLines = 'div-' + name;
    const sparkElem = 'spark-' + name;

    const sprkElement = document.getElementById(sparkElem);
    Sparkline.draw(sprkElement, array1)

    tempArray[name] = [...array1]; // copy the array to tempArray. 
    midPriceObject[name] = []; // Clear the array. 
  }, 30000);

}

const sprkElement = document.getElementById('example-sparkline');
Sparkline.draw(sprkElement, [1,5,3]);



