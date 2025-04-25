import { atom } from 'jotai';

// Canvas size atom - controls width and height of the canvas
export const canvasSizeAtom = atom({
  width: 800,
  height: 600
});

// Show grid atom - controls visibility of the grid
export const showGridAtom = atom(true);

// Grid size atom - controls the size of grid cells
export const canvasGridAtom = atom(20); 