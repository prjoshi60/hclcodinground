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

const url = "ws://localhost:8011/stomp"
const client = Stomp.client(url)
client.debug = function (msg) {
  if (global.DEBUG) {
    console.info(msg);
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

      // if the object with new currency exist in the array then replace with new object
      if (index > -1) {
        globalArray.splice(index, 1, messageBody);
      } else {
         // if the object with new currency doest not exist in the array then push the new object
        globalArray.push(messageBody);
      }

      // fetch the required variable from message body. 
      const { bestBid, bestAsk, name } = messageBody;

      // Maintains the of midprice in one object. 
      // On each update if the currency available then push the new midprice. 
      if (midPriceObject[name]) {
       
        let { lastUpdateAt } = midPriceObject[name];

        let currentTime = new Date();
        let lastDate = new Date(lastUpdateAt);

        // If the last updated time and current time has difference more than 30s then update the last udpate time and replace the whole array. 
        if (((currentTime - lastDate) / 1000) > 30) {
          midPriceObject[name].lastUpdateAt = new Date();
          midPriceObject[name].sparkDataArray = [(bestBid + bestAsk) / 2];

        } else {
          //console.log("LAST UPDATE LESS THAN 30s..." + name );
          //midPriceObject[name].lastUpdateAt = new Date();
          midPriceObject[name].sparkDataArray.push((bestBid + bestAsk) / 2);
        }

      } else {
        midPriceObject[name] = {
          lastUpdateAt: new Date(),
          sparkDataArray: [(bestBid + bestAsk) / 2]
        }
      }

      //console.log("New Entries: ",midPriceObject );

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
              <th></th>
            </tr>`;

  
  // Populate the latest data. 
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
 * Initially the spark value array will have only one element and hence show dots. 
 * 
 */

function populateSparks() {

  for (const [key, obj] of Object.entries(midPriceObject)) {
    const array1 = obj.sparkDataArray;
    const sparkElem = 'spark-' + key;
    const sprkElement = document.getElementById(sparkElem);
    Sparkline.draw(sprkElement, array1);
  }
}

const sprkElement = document.getElementById('example-sparkline');
Sparkline.draw(sprkElement, [1, 5, 3]);



