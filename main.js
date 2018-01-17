import Sigma from 'sigma';
import WebGLRenderer from 'sigma/renderers/webgl';
import {DirectedGraph} from 'graphology';
import randomLayout from 'graphology-layout/random';
import FA2Layout from 'graphology-layout-forceatlas2/worker';
import {scaleLinear} from 'd3-scale';
import DATA from './data.json';

/**
 * Constants.
 */
const PALETTE = {
  user: '#7aa456',
  channel: '#c65999',
  file: '#c96d44',
  message: '#777acd',
};

const TYPE_MAPPING = {
  '@': 'user',
  '#': 'channel',
  '&': 'file',
  '%': 'message'
};

/**
 * Processing data.
 */
const graph = new DirectedGraph();
const map = DATA.value;

let MAX_WEIGHT = -Infinity,
    MAX_DEGREE = -Infinity;

// Creating the graph
for (const source in map) {
  const sourceType = TYPE_MAPPING[source[0]];

  graph.mergeNode(source, {
    type: sourceType,
    label: source,
    color: PALETTE[sourceType]
  });

  const mentions = map[source].mentions;

  let degree = 0;

  for (const target in mentions) {
    const weight = map[source][target];

    const targetType = TYPE_MAPPING[target[0]];

    graph.mergeNode(target, {
      type: targetType,
      label: target,
      color: PALETTE[targetType]
    });

    graph.addEdge(source, target, {
      weight: weight,
      size: weight,
      color: '#ccc'
    });

    if (weight > MAX_WEIGHT)
      MAX_WEIGHT = weight;

    degree++;
  }

  if (degree > MAX_DEGREE)
    MAX_DEGREE = degree;
}

// Setting sizes
const nodeSizeScale = scaleLinear()
  .domain([0, MAX_DEGREE])
  .range([2, 10]);

const edgeSizeScale = scaleLinear()
  .domain([1, MAX_WEIGHT])
  .range([0.5, 5]);

graph.nodes().forEach(node => graph.setNodeAttribute(node, 'size', nodeSizeScale(graph.degree(node))));
graph.edges().forEach(edge => graph.updateEdgeAttribute(edge, 'size', edgeSizeScale));

// Random initial layout
randomLayout.assign(graph);

/**
 * Rendering.
 */
const renderer = new WebGLRenderer(document.getElementById('graph'));
const sigma = new Sigma(graph, renderer);

/**
 * Layout.
 */
const layout = new FA2Layout(graph, {
  settings: {
    barnesHutOptimize: true,
    strongGravityMode: true,
    gravity: 0.05,
    scalingRatio: 10,
    slowDown: 1 + Math.log(graph.order)
  }
});
layout.start();

const layoutButton = document.getElementById('layout-button');

layoutButton.onclick = () => {
  if (layout.running) {
    layoutButton.textContent = 'Start layout';
    layout.stop();
  }
  else {
    layoutButton.textContent = 'Stop layout';
    layout.start();
  }
};

/**
 * Legend.
 */
const legend = document.getElementById('legend');
const html = Object.keys(PALETTE).map(type => {
  return `<li><span style="color: ${PALETTE[type]};">█</span> ${type}</li>`
}).join('');

legend.innerHTML = `<ul>${html}</ul>`;

/**
 * Debug.
 */
window.graph = graph;
window.layout = layout;
