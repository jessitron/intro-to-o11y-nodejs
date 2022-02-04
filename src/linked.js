
function slowThing(triggeringSpanContext, thingName) {
   console.log("Running slow thing for " + thingName);
}

module.exports = { slowThing }
