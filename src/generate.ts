import graph from "./pipeline";
let inputs = { question: "What is Task Decomposition?" };

const result = await graph.invoke(inputs);
console.log(result.answer);