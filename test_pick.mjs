import { pickEvents } from './src/engine/ExplorationSystem.js';

const mockState = {
  exploration: {
    completedEvents: [],
    restUsedInSubLayer: false
  },
  demons: {
    demon_a: { affection: 50, warmed_up_count: 5 },
    demon_b: { affection: 20, warmed_up_count: 1 },
    demon_c: { affection: 10, warmed_up_count: 0 }
  }
};

const results = {};
for(let i=0; i<1000; i++) {
  const evs = pickEvents('town_market', mockState);
  if (evs.length !== 1) {
    console.error("ERROR: length is " + evs.length);
  }
  const event = evs[0];
  results[event] = (results[event] || 0) + 1;
}
console.log('Test town_market: ', Object.entries(results).map(([k,v]) => `${k}: ${v} (${(v/10).toFixed(1)}%)`).join(', '));
