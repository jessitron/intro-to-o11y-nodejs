
const opentelemetry = require("@opentelemetry/api");

function slowThing(triggeringSpanContext, thingName) {

  const tracer = opentelemetry.trace.getTracer("async thinger");

  console.log("Running slow thing for " + thingName);
  
  return tracer.startActiveSpan("slowThing", { links: [{context: triggeringSpanContext}]}, (span) => {
    console.log("this is slow, see");
    span.end();
  })
}

module.exports = { slowThing }
